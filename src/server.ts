import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { and, eq, gt } from 'drizzle-orm';
import { db } from './db.js';
import { apiKeys, games, sessions, users } from './schema.js';
import { ensureSchema } from './bootstrap.js';
import { randomId, randomToken, sha256 } from './crypto.js';
import { verifyGoogleIdToken } from './google.js';
import {
  aiMove,
  hydrate,
  legalMoves,
  makeMove,
  newGameState,
  present,
  resign,
  serialize,
  type Color,
  type GameMode
} from './store.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
await ensureSchema();

type SessionUser = { id: string; email: string; name: string };

declare module 'fastify' {
  interface FastifyRequest {
    sessionUser?: SessionUser;
    apiUserId?: string;
  }
}

async function requireSession(request: any, reply: any) {
  const auth = request.headers.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) return reply.code(401).send({ error: 'Missing bearer token' });

  const token = auth.slice('Bearer '.length);
  const rows = await db
    .select({ userId: sessions.userId, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!rows.length) return reply.code(401).send({ error: 'Invalid session' });
  request.sessionUser = { id: rows[0]!.userId, email: rows[0]!.email, name: rows[0]!.name };
}

async function requireApiKey(request: any, reply: any) {
  const key = request.headers['x-api-key'] as string | undefined;
  if (!key) return reply.code(401).send({ error: 'Missing x-api-key' });

  const keyHash = sha256(key);
  const rows = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)))
    .limit(1);

  if (!rows.length) return reply.code(401).send({ error: 'Invalid API key' });

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, rows[0]!.id));
  request.apiUserId = rows[0]!.userId;
}

app.get('/', async () => ({ ok: true, service: 'chess-api', docs: '/api' }));

app.get('/api', async () => ({
  message: 'Production Chess API',
  auth: {
    login: 'POST /auth/google',
    me: 'GET /me',
    apiKeys: 'POST/GET/DELETE /me/api-keys'
  },
  chess: ['POST /games', 'GET /games/:id', 'DELETE /games/:id', 'GET /games/:id/moves', 'POST /games/:id/moves', 'POST /games/:id/ai-move', 'POST /games/:id/resign']
}));

app.post('/auth/google', async (request, reply) => {
  const body = (request.body ?? {}) as { idToken?: string };
  if (!body.idToken) return reply.code(400).send({ error: 'idToken is required' });

  const profile = await verifyGoogleIdToken(body.idToken);

  const existing = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
  const userId = existing[0]?.id ?? randomId();

  if (!existing.length) {
    await db.insert(users).values({ id: userId, email: profile.email, name: profile.name, picture: profile.picture });
  }

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessions).values({ token, userId, expiresAt });

  return { accessToken: token, expiresAt, user: { id: userId, email: profile.email, name: profile.name, picture: profile.picture } };
});

app.get('/me', { preHandler: requireSession }, async (request) => {
  return { user: request.sessionUser };
});

app.get('/me/api-keys', { preHandler: requireSession }, async (request) => {
  const rows = await db
    .select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, active: apiKeys.active, createdAt: apiKeys.createdAt, lastUsedAt: apiKeys.lastUsedAt })
    .from(apiKeys)
    .where(eq(apiKeys.userId, request.sessionUser!.id));

  return { items: rows };
});

app.post('/me/api-keys', { preHandler: requireSession }, async (request, reply) => {
  const body = (request.body ?? {}) as { name?: string };
  const name = (body.name ?? 'default').slice(0, 80);

  const rawKey = `chess_${randomToken(24)}`;
  const keyHash = sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  await db.insert(apiKeys).values({
    id: randomId(),
    userId: request.sessionUser!.id,
    name,
    keyHash,
    keyPrefix,
    active: true
  });

  reply.code(201);
  return { apiKey: rawKey, prefix: keyPrefix, name };
});

app.delete('/me/api-keys/:id', { preHandler: requireSession }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await db
    .update(apiKeys)
    .set({ active: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, request.sessionUser!.id)));
  return reply.code(204).send();
});

app.post('/games', { preHandler: requireApiKey }, async (request, reply) => {
  const body = (request.body ?? {}) as {
    mode?: GameMode;
    fen?: string;
    aiColor?: Color;
    timeControl?: { initialSeconds: number; incrementSeconds?: number };
  };

  const gameId = randomId();
  const state = newGameState(body);
  const payload = serialize(state);

  await db.insert(games).values({
    id: gameId,
    userId: request.apiUserId!,
    ...payload,
    updatedAt: new Date()
  });

  reply.code(201);
  return present(gameId, state);
});

app.get('/games/:id', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)))
    .limit(1);

  const row = rows[0];
  if (!row) return reply.code(404).send({ error: 'Game not found' });

  const state = hydrate(row as any);
  const view = present(id, state);

  await db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  return view;
});

app.delete('/games/:id', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await db.delete(games).where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)));
  return reply.code(204).send();
});

app.get('/games/:id/moves', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const { from } = (request.query ?? {}) as { from?: string };
  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)))
    .limit(1);
  const row = rows[0];
  if (!row) return reply.code(404).send({ error: 'Game not found' });

  const state = hydrate(row as any);
  const moves = legalMoves(state, from);
  await db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  return { gameId: id, from: from ?? null, count: moves.length, moves };
});

app.post('/games/:id/moves', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = (request.body ?? {}) as { san?: string; from?: string; to?: string; promotion?: 'q' | 'r' | 'b' | 'n' };

  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)))
    .limit(1);
  const row = rows[0];
  if (!row) return reply.code(404).send({ error: 'Game not found' });

  const state = hydrate(row as any);
  const result = makeMove(state, body);
  if ('error' in result) return reply.code(422).send(result);

  await db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  return { move: result.move, state: present(id, state) };
});

app.post('/games/:id/ai-move', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };

  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)))
    .limit(1);
  const row = rows[0];
  if (!row) return reply.code(404).send({ error: 'Game not found' });

  const state = hydrate(row as any);
  const result = await aiMove(state);
  if ('error' in result) return reply.code(422).send(result);

  await db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  return { move: result.move, state: present(id, state) };
});

app.post('/games/:id/resign', { preHandler: requireApiKey }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = (request.body ?? {}) as { color?: Color };
  if (!body.color || !['w', 'b'].includes(body.color)) {
    return reply.code(400).send({ error: 'color must be w or b' });
  }

  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.userId, request.apiUserId!)))
    .limit(1);
  const row = rows[0];
  if (!row) return reply.code(404).send({ error: 'Game not found' });

  const state = hydrate(row as any);
  resign(state, body.color);
  await db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  return present(id, state);
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`chess-api listening on ${port}`);
});
