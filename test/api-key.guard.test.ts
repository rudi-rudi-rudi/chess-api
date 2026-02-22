import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiKeyGuard, resetApiKeyRateLimitBuckets } from '../src/common/guards/api-key.guard.js';

function makeContext(key: string) {
  const req: any = { headers: { 'x-api-key': key } };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
}

function makeDbMock(opts?: { tier?: 'free' | 'pro'; monthly?: number; apiId?: string; userId?: string }) {
  const state = {
    tier: opts?.tier ?? 'free',
    monthly: opts?.monthly ?? 0,
    apiId: opts?.apiId ?? 'k1',
    userId: opts?.userId ?? 'u1',
  };

  let selectCall = 0;
  const db: any = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            selectCall = (selectCall % 3) + 1;
            if (selectCall === 1) return [{ id: state.apiId, userId: state.userId }]; // api_keys
            if (selectCall === 2) return [{ tier: state.tier }]; // plans
            if (selectCall === 3) return state.monthly > 0 ? [{ id: 'm1', requestCount: state.monthly }] : []; // usage
            return [];
          },
        }),
      }),
    }),
    insert: () => ({ values: async (v: any) => { state.monthly = v.requestCount; } }),
    update: () => ({ set: (v: any) => ({ where: async () => { if (typeof v.requestCount === 'number') state.monthly = v.requestCount; } }) }),
  };

  return { db, state };
}

test('api key guard allows request and sets apiUserId', async () => {
  resetApiKeyRateLimitBuckets();
  const mock = makeDbMock({ monthly: 0, apiId: 'k-allow' });
  const guard = new ApiKeyGuard(mock as any);
  const context = makeContext('chess_key_123');
  const ok = await guard.canActivate(context);
  assert.equal(ok, true);
  assert.equal(context.switchToHttp().getRequest().apiUserId, 'u1');
});

test('api key guard enforces free monthly quota', async () => {
  resetApiKeyRateLimitBuckets();
  const mock = makeDbMock({ tier: 'free', monthly: 10000, apiId: 'k-monthly' });
  const guard = new ApiKeyGuard(mock as any);
  const context = makeContext('chess_key_abc');
  await assert.rejects(() => guard.canActivate(context));
});

test('api key RPM limiting is isolated per key (not global)', async () => {
  resetApiKeyRateLimitBuckets();

  const mockA = makeDbMock({ tier: 'free', monthly: 0, apiId: 'key-A' });
  const guardA = new ApiKeyGuard(mockA as any);

  for (let i = 0; i < 30; i++) {
    const ok = await guardA.canActivate(makeContext('chess_key_A'));
    assert.equal(ok, true);
  }
  await assert.rejects(() => guardA.canActivate(makeContext('chess_key_A')));

  const mockB = makeDbMock({ tier: 'free', monthly: 0, apiId: 'key-B' });
  const guardB = new ApiKeyGuard(mockB as any);
  const okB = await guardB.canActivate(makeContext('chess_key_B'));
  assert.equal(okB, true);
});
