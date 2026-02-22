import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequestLogLine } from '../src/common/middleware/request-logging.middleware.js';

test('request log line includes requestId, route, status and duration', () => {
  const line = buildRequestLogLine({
    requestId: 'req_123',
    method: 'POST',
    url: '/games',
    statusCode: 201,
    durationMs: 42,
  });

  assert.equal(line, '[req_123] POST /games -> 201 42ms');
});

test('request log line has safe defaults', () => {
  const line = buildRequestLogLine({ requestId: 'req_456' });
  assert.equal(line, '[req_456] UNKNOWN / -> 0 0ms');
});
