import test from 'node:test';
import assert from 'node:assert/strict';
import { BillingService } from '../src/modules/billing/billing.service.js';

function makeDbMock(planRow: any = null) {
  const calls: any = { inserted: null, updated: null };
  const db: any = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (planRow ? [planRow] : []) }) }) }),
    insert: () => ({ values: async (v: any) => (calls.inserted = v) }),
    update: () => ({ set: (v: any) => ({ where: async () => (calls.updated = v) }) }),
  };
  return { db, calls };
}

test('billing service returns existing stripe customer id', async () => {
  const mock = makeDbMock({ stripeCustomerId: 'cus_existing', tier: 'pro', status: 'active' });
  const billing = new BillingService(mock as any);

  const out = await billing.ensureStripeCustomer('u1', 'u1@example.com');
  assert.equal(out, 'cus_existing');
  assert.equal(mock.calls.inserted, null);
  assert.equal(mock.calls.updated, null);
});

test('billing service creates stripe customer and updates existing plan row', async () => {
  const mock = makeDbMock({ stripeCustomerId: null, tier: 'free', status: 'active' });
  const billing = new BillingService(mock as any);

  (billing as any).stripe = {
    customers: {
      create: async () => ({ id: 'cus_new' }),
    },
  };

  const out = await billing.ensureStripeCustomer('u1', 'u1@example.com', 'User One');
  assert.equal(out, 'cus_new');
  assert.equal(mock.calls.updated.stripeCustomerId, 'cus_new');
});

test('billing service creates stripe customer and inserts missing plan row', async () => {
  const mock = makeDbMock();
  const billing = new BillingService(mock as any);

  (billing as any).stripe = {
    customers: {
      create: async () => ({ id: 'cus_inserted' }),
    },
  };

  const out = await billing.ensureStripeCustomer('u2', 'u2@example.com');
  assert.equal(out, 'cus_inserted');
  assert.equal(mock.calls.inserted.userId, 'u2');
  assert.equal(mock.calls.inserted.stripeCustomerId, 'cus_inserted');
});

test('billing service creates checkout session', async () => {
  const prevPrice = process.env.STRIPE_PRICE_PRO;
  process.env.STRIPE_PRICE_PRO = 'price_test_123';

  const mock = makeDbMock({ stripeCustomerId: 'cus_existing', tier: 'pro', status: 'active' });
  const billing = new BillingService(mock as any);

  (billing as any).stripe = {
    checkout: {
      sessions: {
        create: async () => ({ id: 'cs_123', url: 'https://checkout.stripe.test/session' }),
      },
    },
  };

  const out = await billing.createCheckoutSession({ userId: 'u1', email: 'u1@example.com' });
  assert.equal(out.sessionId, 'cs_123');
  assert.ok(out.url?.includes('checkout.stripe.test'));

  process.env.STRIPE_PRICE_PRO = prevPrice;
});

test('billing service rejects checkout without price configuration', async () => {
  const prevPrice = process.env.STRIPE_PRICE_PRO;
  delete process.env.STRIPE_PRICE_PRO;

  const mock = makeDbMock({ stripeCustomerId: 'cus_existing', tier: 'free', status: 'active' });
  const billing = new BillingService(mock as any);
  (billing as any).stripe = { checkout: { sessions: { create: async () => ({ id: 'x', url: 'x' }) } } };

  await assert.rejects(() => billing.createCheckoutSession({ userId: 'u1', email: 'u1@example.com' }));

  process.env.STRIPE_PRICE_PRO = prevPrice;
});
