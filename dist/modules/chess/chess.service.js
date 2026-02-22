var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { games } from '../../database/schema.js';
import { randomId } from '../../config/crypto.js';
import { aiMove, createState, hydrate, legalMoves, move, present, resign, serialize } from './chess.engine.js';
let ChessService = class ChessService {
    dbs;
    constructor(dbs) {
        this.dbs = dbs;
    }
    async create(userId, body) {
        const id = randomId();
        const state = createState(body);
        await this.dbs.db.insert(games).values({ id, userId, ...serialize(state), updatedAt: new Date() });
        return present(id, state);
    }
    async get(userId, id) {
        const row = await this.load(userId, id);
        const state = hydrate(row);
        await this.save(id, state);
        return present(id, state);
    }
    async remove(userId, id) {
        await this.dbs.db.delete(games).where(and(eq(games.id, id), eq(games.userId, userId)));
    }
    async moves(userId, id, from) {
        const row = await this.load(userId, id);
        const state = hydrate(row);
        const m = legalMoves(state, from);
        await this.save(id, state);
        return { gameId: id, from: from ?? null, count: m.length, moves: m };
    }
    async makeMove(userId, id, body) {
        const row = await this.load(userId, id);
        const state = hydrate(row);
        const r = move(state, body);
        if ('error' in r)
            return r;
        await this.save(id, state);
        return { move: r.move, state: present(id, state) };
    }
    async makeAiMove(userId, id) {
        const row = await this.load(userId, id);
        const state = hydrate(row);
        const r = await aiMove(state);
        if ('error' in r)
            return r;
        await this.save(id, state);
        return { move: r.move, state: present(id, state) };
    }
    async makeResign(userId, id, color) {
        const row = await this.load(userId, id);
        const state = hydrate(row);
        resign(state, color);
        await this.save(id, state);
        return present(id, state);
    }
    async load(userId, id) {
        const rows = await this.dbs.db.select().from(games).where(and(eq(games.id, id), eq(games.userId, userId))).limit(1);
        const row = rows[0];
        if (!row)
            throw new NotFoundException('Game not found');
        return row;
    }
    async save(id, state) {
        await this.dbs.db.update(games).set({ ...serialize(state), updatedAt: new Date() }).where(eq(games.id, id));
    }
};
ChessService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], ChessService);
export { ChessService };
//# sourceMappingURL=chess.service.js.map