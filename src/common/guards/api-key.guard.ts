import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys } from '../../database/schema.js';
import { sha256 } from '../../config/crypto.js';

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

    await this.dbs.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, api.id));
    req.apiUserId = api.userId;
    return true;
  }
}
