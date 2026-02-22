import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard.js';

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
            selectCall += 1;
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
  const mock = makeDbMock({ monthly: 0, apiId: 'k-allow' });
  const guard = new ApiKeyGuard(mock as any);
  const context = makeContext('chess_key_123');
  const ok = await guard.canActivate(context);
  assert.equal(ok, true);
  assert.equal(context.switchToHttp().getRequest().apiUserId, 'u1');
});

test('api key guard enforces free monthly quota', async () => {
  const mock = makeDbMock({ tier: 'free', monthly: 10000, apiId: 'k-monthly' });
  const guard = new ApiKeyGuard(mock as any);
  const context = makeContext('chess_key_abc');
  await assert.rejects(() => guard.canActivate(context));
});
