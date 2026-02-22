import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys } from '../../database/schema.js';
import { randomId, randomToken, sha256 } from '../../config/crypto.js';

@Injectable()
export class UsersService {
  constructor(private readonly dbs: DatabaseService) {}

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
