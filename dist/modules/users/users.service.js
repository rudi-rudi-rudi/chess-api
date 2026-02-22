var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys } from '../../database/schema.js';
import { randomId, randomToken, sha256 } from '../../config/crypto.js';
let UsersService = class UsersService {
    dbs;
    constructor(dbs) {
        this.dbs = dbs;
    }
    async listApiKeys(userId) {
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
    async createApiKey(userId, name = 'default') {
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
    async revokeApiKey(userId, id) {
        await this.dbs.db
            .update(apiKeys)
            .set({ active: false })
            .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map