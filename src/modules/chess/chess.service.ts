import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { games } from '../../database/schema.js';
import { randomId } from '../../config/crypto.js';
import { aiMove, createState, hydrate, legalMoves, move, present, resign, serialize, type Color, type GameMode } from './chess.engine.js';

@Injectable()
export class ChessService {
  constructor(private readonly dbs: DatabaseService) {}

  async list(
    userId: string,
    query: { mode?: GameMode; status?: 'active' | 'finished'; page?: number; limit?: number }
  ) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));

    const conditions = [eq(games.userId, userId)];
    if (query.mode) conditions.push(eq(games.mode, query.mode));
    if (query.status) conditions.push(eq(games.status, query.status));

    const rows = await this.dbs.db
      .select({
        id: games.id,
        mode: games.mode,
        status: games.status,
        turn: games.turn,
        updatedAt: games.updatedAt,
        createdAt: games.createdAt,
      })
      .from(games)
      .where(and(...conditions))
      .orderBy(desc(games.updatedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { page, limit, items: rows };
  }

  async create(userId: string, body: { mode?: GameMode; fen?: string; aiColor?: Color; timeControl?: { initialSeconds: number; incrementSeconds?: number } }) {
    const id = randomId();
    const state = createState(body);
    await this.dbs.db.insert(games).values({ id, userId, ...serialize(state), updatedAt: new Date() });
    return present(id, state);
  }

  async get(userId: string, id: string) {
    const row = await this.load(userId, id);
    const state = hydrate(row);
    await this.save(id, state);
    return present(id, state);
  }

  async remove(userId: string, id: string) {
    await this.dbs.db.delete(games).where(and(eq(games.id, id), eq(games.userId, userId)));
  }

  async moves(userId: string, id: string, from?: string) {
    const row = await this.load(userId, id);
    const state = hydrate(row);
    const m = legalMoves(state, from);
    await this.save(id, state);
    return { gameId: id, from: from ?? null, count: m.length, moves: m };
  }

  async makeMove(userId: string, id: string, body: { san?: string; from?: string; to?: string; promotion?: 'q' | 'r' | 'b' | 'n' }) {
    const row = await this.load(userId, id);
    const state = hydrate(row);
    const r = move(state, body);
    if ('error' in r) return r;
    await this.save(id, state);
    return { move: r.move, state: present(id, state) };
  }

  async makeAiMove(userId: string, id: string) {
    const row = await this.load(userId, id);
    const state = hydrate(row);
    const r = await aiMove(state);
    if ('error' in r) return r;
    await this.save(id, state);
    return { move: r.move, state: present(id, state) };
  }

  async makeResign(userId: string, id: string, color: Color) {
    const row = await this.load(userId, id);
    const state = hydrate(row);
    resign(state, color);
    await this.save(id, state);
    return present(id, state);
  }

  private async load(userId: string, id: string) {
    const rows = await this.dbs.db.select().from(games).where(and(eq(games.id, id), eq(games.userId, userId))).limit(1);
    const row = rows[0];
    if (!row) throw new NotFoundException('Game not found');
    return row as any;
  }

  private async save(id: string, state: any) {
    await this.dbs.db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
  }
}
