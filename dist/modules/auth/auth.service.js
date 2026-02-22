var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { and, eq, gt } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { sessions, users } from '../../database/schema.js';
import { randomId, randomToken } from '../../config/crypto.js';
let AuthService = class AuthService {
    dbs;
    google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    constructor(dbs) {
        this.dbs = dbs;
    }
    async loginWithGoogle(idToken) {
        if (!idToken)
            throw new BadRequestException('idToken is required');
        if (!process.env.GOOGLE_CLIENT_ID)
            throw new BadRequestException('GOOGLE_CLIENT_ID missing');
        const ticket = await this.google.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.name)
            throw new BadRequestException('Invalid Google token payload');
        const existing = await this.dbs.db.select().from(users).where(eq(users.email, payload.email)).limit(1);
        const userId = existing[0]?.id ?? randomId();
        if (!existing.length) {
            await this.dbs.db.insert(users).values({
                id: userId,
                email: payload.email,
                name: payload.name,
                picture: payload.picture ?? null,
            });
        }
        const token = randomToken(32);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.dbs.db.insert(sessions).values({ token, userId, expiresAt });
        return {
            accessToken: token,
            expiresAt,
            user: {
                id: userId,
                email: payload.email,
                name: payload.name,
                picture: payload.picture ?? null,
            },
        };
    }
    async sessionFromBearer(authHeader) {
        if (!authHeader?.startsWith('Bearer '))
            return null;
        const token = authHeader.slice('Bearer '.length);
        const rows = await this.dbs.db
            .select({ userId: sessions.userId, email: users.email, name: users.name })
            .from(sessions)
            .innerJoin(users, eq(users.id, sessions.userId))
            .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
            .limit(1);
        return rows[0] ?? null;
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map