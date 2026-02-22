import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys, plans } from '../../database/schema.js';
import { randomId, randomToken, sha256 } from '../../config/crypto.js';

@Injectable()
export class UsersService {
  constructor(private readonly dbs: DatabaseService) {}

  async getPlan(userId: string) {
    const rows = await this.dbs.db.select().from(plans).where(eq(plans.userId, userId)).limit(1);
    if (!rows.length) {
      await this.dbs.db.insert(plans).values({ userId, tier: 'free', status: 'active', updatedAt: new Date() });
      return { tier: 'free', status: 'active' };
    }
    return rows[0];
  }

  async listApiKeys(userId: string) {
    return this.dbs.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        active: apiKeys.active,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));
  }

  async createApiKey(userId: string, name = 'default') {
    const plan = await this.getPlan(userId);
    const existing = await this.listApiKeys(userId);
    const activeCount = existing.filter((k) => k.active).length;

    const maxKeys = plan.tier === 'pro' ? 20 : 2;
    if (activeCount >= maxKeys) {
      throw new BadRequestException(`API key limit reached for ${plan.tier} plan (max ${maxKeys})`);
    }

    const rawKey = `chess_${randomToken(24)}`;
    await this.dbs.db.insert(apiKeys).values({
      id: randomId(),
      userId,
      name: name.slice(0, 80),
      keyHash: sha256(rawKey),
      keyPrefix: rawKey.slice(0, 12),
      active: true,
    });
    return { apiKey: rawKey };
  }

  async revokeApiKey(userId: string, id: string) {
    await this.dbs.db
      .update(apiKeys)
      .set({ active: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  }
}
