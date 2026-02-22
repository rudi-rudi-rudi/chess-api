import { BadRequestException, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { and, eq, gt } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { sessions, users } from '../../database/schema.js';
import { randomId, randomToken } from '../../config/crypto.js';

@Injectable()
export class AuthService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(private readonly dbs: DatabaseService) {}

  async loginWithGoogle(idToken: string) {
    if (!idToken) throw new BadRequestException('idToken is required');
    if (!process.env.GOOGLE_CLIENT_ID) throw new BadRequestException('GOOGLE_CLIENT_ID missing');

    const ticket = await this.google.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.name) throw new BadRequestException('Invalid Google token payload');

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

  async sessionFromBearer(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);

    const rows = await this.dbs.db
      .select({ userId: sessions.userId, email: users.email, name: users.name })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    return rows[0] ?? null;
  }
}
