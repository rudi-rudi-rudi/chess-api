import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys, apiUsageMonthly, plans } from '../../database/schema.js';
import { randomId, sha256 } from '../../config/crypto.js';

const rpmBuckets = new Map<string, { start: number; count: number }>();

export function resetApiKeyRateLimitBuckets() {
  rpmBuckets.clear();
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly dbs: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] as string | undefined;
    if (!key) throw new UnauthorizedException('Missing x-api-key');

    const keyHash = sha256(key);
    const rows = await this.dbs.db
      .select({ id: apiKeys.id, userId: apiKeys.userId })
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)))
      .limit(1);

    const api = rows[0];
    if (!api) throw new UnauthorizedException('Invalid API key');

    await this.enforcePlanLimits(api.userId, api.id);

    await this.dbs.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, api.id));
    req.apiUserId = api.userId;
    return true;
  }

  private async enforcePlanLimits(userId: string, apiKeyId: string) {
    const [plan] = await this.dbs.db.select().from(plans).where(eq(plans.userId, userId)).limit(1);
    const tier = plan?.tier === 'pro' ? 'pro' : 'free';

    const rpmLimit = tier === 'pro' ? 300 : 30;
    const monthlyLimit = tier === 'pro' ? 1_000_000 : 10_000;

    const now = Date.now();
    const bucketKey = `${apiKeyId}:${Math.floor(now / 60000)}`;
    const bucket = rpmBuckets.get(bucketKey) ?? { start: now, count: 0 };
    bucket.count += 1;
    rpmBuckets.set(bucketKey, bucket);
    if (bucket.count > rpmLimit) {
      throw new HttpException(`Rate limit exceeded for ${tier} plan (${rpmLimit} req/min)`, 429);
    }

    const month = new Date().toISOString().slice(0, 7);
    const existing = await this.dbs.db
      .select({ id: apiUsageMonthly.id, requestCount: apiUsageMonthly.requestCount })
      .from(apiUsageMonthly)
      .where(and(eq(apiUsageMonthly.userId, userId), eq(apiUsageMonthly.monthKey, month)))
      .limit(1);

    if (!existing.length) {
      await this.dbs.db.insert(apiUsageMonthly).values({
        id: randomId(),
        userId,
        monthKey: month,
        requestCount: 1,
        updatedAt: new Date(),
      });
      return;
    }

    const usage = existing[0]!;
    const next = usage.requestCount + 1;
    if (next > monthlyLimit) {
      throw new HttpException(`Monthly quota exceeded for ${tier} plan (${monthlyLimit})`, 429);
    }

    await this.dbs.db
      .update(apiUsageMonthly)
      .set({ requestCount: next, updatedAt: new Date() })
      .where(eq(apiUsageMonthly.id, usage.id));
  }
}
