import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/modules/auth/auth.service.js';

function makeDbMock() {
  const db: any = {};
  db.select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => [],
      }),
      innerJoin: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }),
  });
  db.insert = () => ({ values: async () => undefined });
  return { db };
}

test('auth service returns null for missing bearer', async () => {
  const auth = new AuthService(makeDbMock() as any);
  const session = await auth.sessionFromBearer(undefined);
  assert.equal(session, null);
});

test('auth service loginWithGoogle validates token', async () => {
  const prev = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  const auth = new AuthService(makeDbMock() as any);

  (auth as any).google = {
    verifyIdToken: async () => ({
      getPayload: () => ({ email: 'a@b.com', name: 'A', picture: null }),
    }),
  };

  const result = await auth.loginWithGoogle('valid-id-token-123');
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(result.user.email, 'a@b.com');

  process.env.GOOGLE_CLIENT_ID = prev;
});
