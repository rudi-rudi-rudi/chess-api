import test from 'node:test';
import assert from 'node:assert/strict';
import { UsersService } from '../src/modules/users/users.service.js';

function makeDbMock() {
  const calls: any = { inserted: null, updated: null };
  const db: any = {
    select: () => ({ from: () => ({ where: async () => [] }) }),
    insert: () => ({ values: async (v: any) => (calls.inserted = v) }),
    update: () => ({ set: (v: any) => ({ where: async () => (calls.updated = v) }) }),
  };
  return { db, calls };
}

test('users service creates api key', async () => {
  const mock = makeDbMock();
  const users = new UsersService(mock as any);
  const out = await users.createApiKey('u1', 'main');
  assert.ok(out.apiKey.startsWith('chess_'));
  assert.equal(mock.calls.inserted.userId, 'u1');
});

test('users service revokes api key', async () => {
  const mock = makeDbMock();
  const users = new UsersService(mock as any);
  await users.revokeApiKey('u1', 'k1');
  assert.equal(mock.calls.updated.active, false);
});
