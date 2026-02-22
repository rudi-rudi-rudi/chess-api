import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessService } from '../src/modules/chess/chess.service.js';
import { createState, serialize } from '../src/modules/chess/chess.engine.js';

function makeDbMock(row?: any) {
  const state: any = {
    gameRow: row || null,
    players: [] as any[],
    gamePlayers: [] as any[],
  };

  const db: any = {
    insert: () => ({
      values: async (v: any) => {
        if (v.displayName) {
          state.players.push(v);
        } else if (v.gameId && v.playerId) {
          state.gamePlayers.push(v);
        } else if (v.id && v.userId && v.fen) {
          state.gameRow = v;
        }
      },
    }),
    delete: () => ({
      where: async () => {
        state.players = [];
      },
    }),
    update: () => ({
      set: (v: any) => ({
        where: async () => {
          if (v.playerId && state.gamePlayers.length) {
            state.gamePlayers[0] = { ...state.gamePlayers[0], ...v };
          }
          if (state.players.length && (v.displayName !== undefined || v.rating !== undefined || v.externalAppUserId !== undefined)) {
            state.players[0] = { ...state.players[0], ...v };
          }
          if (state.gameRow) state.gameRow = { ...state.gameRow, ...v };
        },
      }),
    }),
    select: () => ({
      from: (table: any) => ({
        where: () => ({
          limit: async (n?: number) => {
            const name = table?.[Symbol.for('drizzle:Name')] || table?._?.name || '';
            if (name === 'games') return state.gameRow ? [state.gameRow].slice(0, n ?? 1) : [];
            if (name === 'players') return state.players.slice(0, n ?? state.players.length);
            if (name === 'game_players') return state.gamePlayers.slice(0, n ?? state.gamePlayers.length);
            return [];
          },
          orderBy: () => ({
            limit: () => ({
              offset: async () => (state.players.length ? state.players : state.gameRow ? [state.gameRow] : []),
            }),
          }),
          offset: async () => (state.players.length ? state.players : []),
        }),
      }),
    }),
  };
  return { db, state };
}

test('chess service create returns game id', async () => {
  const svc = new ChessService(makeDbMock() as any);
  const game = await svc.create('u1', { mode: 'pvp' });
  assert.equal(typeof game.id, 'string');
});

test('chess service move flow works', async () => {
  const state = createState({ mode: 'pvp' });
  const row = { id: 'g1', userId: 'u1', ...serialize(state) };
  const svc = new ChessService(makeDbMock(row) as any);
  const out: any = await svc.makeMove('u1', 'g1', { from: 'e2', to: 'e4' });
  assert.equal(out.move.san, 'e4');
});

test('chess service list returns paginated items', async () => {
  const state = createState({ mode: 'pvp' });
  const row = { id: 'g1', userId: 'u1', ...serialize(state) };
  const svc = new ChessService(makeDbMock(row) as any);
  const out: any = await svc.list('u1', { page: 1, limit: 20 });
  assert.equal(out.page, 1);
  assert.equal(out.limit, 20);
  assert.equal(out.items.length, 1);
});

test('chess service creates and lists players', async () => {
  const mock = makeDbMock();
  const svc = new ChessService(mock as any);
  await svc.createPlayer('u1', { displayName: 'Magnus', rating: 2850, externalAppUserId: 'ext-1' });
  const out: any = await svc.listPlayers('u1', { page: 1, limit: 20 });
  assert.equal(out.items.length, 1);
  assert.equal(out.items[0].displayName, 'Magnus');
});

test('chess service assigns player to game color', async () => {
  const gameState = createState({ mode: 'pvp' });
  const row = { id: 'g1', userId: 'u1', ...serialize(gameState) };
  const mock = makeDbMock(row);
  mock.state.players.push({ id: 'p1', userId: 'u1', displayName: 'Player 1', rating: 1200, updatedAt: new Date(), createdAt: new Date() });

  const svc = new ChessService(mock as any);
  const out: any = await svc.assignPlayerToGame('u1', 'g1', { playerId: 'p1', color: 'w' });
  assert.equal(out.ok, true);
});

test('chess service updates owned player', async () => {
  const mock = makeDbMock();
  mock.state.players.push({ id: 'p1', userId: 'u1', displayName: 'Old', rating: 1200, externalAppUserId: null, updatedAt: new Date(), createdAt: new Date() });
  const svc = new ChessService(mock as any);
  const out: any = await svc.updatePlayer('u1', 'p1', { displayName: 'New Name', rating: 1300 });
  assert.equal(out.displayName, 'New Name');
  assert.equal(out.rating, 1300);
});

test('chess service deletes owned player', async () => {
  const mock = makeDbMock();
  mock.state.players.push({ id: 'p1', userId: 'u1', displayName: 'Delete Me', rating: 1200, updatedAt: new Date(), createdAt: new Date() });
  const svc = new ChessService(mock as any);
  await svc.deletePlayer('u1', 'p1');
  const listed: any = await svc.listPlayers('u1', { page: 1, limit: 20 });
  assert.equal(listed.items.length, 0);
});
