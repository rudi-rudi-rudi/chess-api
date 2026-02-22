import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessService } from '../src/modules/chess/chess.service.js';
import { createState, serialize } from '../src/modules/chess/chess.engine.js';

function makeDbMock(row?: any) {
  const db: any = {
    insert: () => ({ values: async () => undefined }),
    delete: () => ({ where: async () => undefined }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (n?: number) => {
            const arr = row ? [row] : [];
            const chain: any = Promise.resolve(n ? arr.slice(0, n) : arr);
            chain.offset = async () => arr;
            return chain;
          },
          orderBy: () => ({
            limit: () => ({
              offset: async () => (row ? [row] : []),
            }),
          }),
        }),
      }),
    }),
  };
  return { db };
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
