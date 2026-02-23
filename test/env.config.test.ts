import test from 'node:test'
import assert from 'node:assert/strict'
import { loadEnv } from '../src/config/env.js'

test('loadEnv parses valid env and defaults APP_URL/PORT', () => {
  const env = loadEnv({
    DATABASE_URL: 'https://db.example.com',
    GOOGLE_CLIENT_ID: 'google-client-id-123456',
  } as any)

  assert.equal(env.PORT, 3000)
  assert.equal(env.APP_URL, 'http://localhost:3001')
})

test('loadEnv throws for invalid DATABASE_URL', () => {
  assert.throws(() =>
    loadEnv({
      DATABASE_URL: 'not-a-url',
      GOOGLE_CLIENT_ID: 'google-client-id-123456',
      APP_URL: 'http://localhost:3001',
    } as any),
  )
})

test('loadEnv parses optional public app url and stripe vars', () => {
  const env = loadEnv({
    DATABASE_URL: 'https://db.example.com',
    GOOGLE_CLIENT_ID: 'google-client-id-123456',
    NEXT_PUBLIC_APP_URL: 'https://app.example.com',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    STRIPE_PRICE_PRO: 'price_123',
  } as any)

  assert.equal(env.NEXT_PUBLIC_APP_URL, 'https://app.example.com')
  assert.equal(env.STRIPE_SECRET_KEY, 'sk_test_123')
  assert.equal(env.STRIPE_WEBHOOK_SECRET, 'whsec_123')
  assert.equal(env.STRIPE_PRICE_PRO, 'price_123')
})

test('loadEnv throws for invalid APP_URL', () => {
  assert.throws(() =>
    loadEnv({
      DATABASE_URL: 'https://db.example.com',
      GOOGLE_CLIENT_ID: 'google-client-id-123456',
      APP_URL: 'not-a-url',
    } as any),
  )
})
