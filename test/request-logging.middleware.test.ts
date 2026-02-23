import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequestLogLine, RequestLoggingMiddleware } from '../src/common/middleware/request-logging.middleware.js';

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

test('request logging middleware keeps incoming x-request-id', () => {
  const middleware = new RequestLoggingMiddleware();

  const headers: Record<string, string> = {};
  const listeners: Record<string, () => void> = {};
  const req: any = {
    headers: { 'x-request-id': 'req_incoming_12345' },
    method: 'GET',
    url: '/health',
  };
  const res: any = {
    statusCode: 200,
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    on: (event: string, cb: () => void) => {
      listeners[event] = cb;
    },
  };

  let called = false;
  middleware.use(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.requestId, 'req_incoming_12345');
  assert.equal(headers['x-request-id'], 'req_incoming_12345');
  assert.equal(typeof listeners.finish, 'function');
});

test('request logging middleware generates request id when missing/invalid', () => {
  const middleware = new RequestLoggingMiddleware();

  const headers: Record<string, string> = {};
  const req: any = {
    headers: { 'x-request-id': 'abc' },
    method: 'GET',
    url: '/health',
  };
  const res: any = {
    statusCode: 200,
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    on: () => undefined,
  };

  middleware.use(req, res, () => undefined);

  assert.equal(typeof req.requestId, 'string');
  assert.ok(req.requestId.length > 10);
  assert.equal(headers['x-request-id'], req.requestId);
  assert.notEqual(req.requestId, 'abc');
});
