var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { apiKeys } from '../../database/schema.js';
import { sha256 } from '../../config/crypto.js';
let ApiKeyGuard = class ApiKeyGuard {
    dbs;
    constructor(dbs) {
        this.dbs = dbs;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const key = req.headers['x-api-key'];
        if (!key)
            throw new UnauthorizedException('Missing x-api-key');
        const keyHash = sha256(key);
        const rows = await this.dbs.db
            .select({ id: apiKeys.id, userId: apiKeys.userId })
            .from(apiKeys)
            .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)))
            .limit(1);
        const api = rows[0];
        if (!api)
            throw new UnauthorizedException('Invalid API key');
        await this.dbs.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, api.id));
        req.apiUserId = api.userId;
        return true;
    }
};
ApiKeyGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], ApiKeyGuard);
export { ApiKeyGuard };
//# sourceMappingURL=api-key.guard.js.map