import test from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from '../src/modules/health/health.controller.js';

test('health root and api shape', () => {
  const h = new HealthController();
  const root = h.root();
  const api = h.api();
  assert.equal(root.ok, true);
  assert.equal(typeof api.message, 'string');
  assert.ok(Array.isArray(api.chess));
});
