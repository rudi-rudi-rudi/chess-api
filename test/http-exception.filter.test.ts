import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

function makeHost(url = '/games') {
  const payload: any = { statusCode: null, body: null };
  const response = {
    status(code: number) {
      payload.statusCode = code;
      return this;
    },
    json(body: unknown) {
      payload.body = body;
      return this;
    },
  };

  const host: any = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }),
    }),
  };

  return { host, payload };
}

test('http exception filter shapes known HttpException', () => {
  const filter = new HttpExceptionFilter();
  const { host, payload } = makeHost('/billing/checkout-session');

  filter.catch(new BadRequestException('Missing priceId'), host);

  assert.equal(payload.statusCode, 400);
  assert.equal((payload.body as any).error.statusCode, 400);
  assert.equal((payload.body as any).error.message, 'Missing priceId');
  assert.equal((payload.body as any).path, '/billing/checkout-session');
  assert.ok((payload.body as any).timestamp);
});

test('http exception filter shapes unknown exception as 500', () => {
  const filter = new HttpExceptionFilter();
  const { host, payload } = makeHost('/games/abc');

  filter.catch(new Error('boom'), host);

  assert.equal(payload.statusCode, 500);
  assert.equal((payload.body as any).error.message, 'Internal server error');
  assert.equal((payload.body as any).path, '/games/abc');
});

test('http exception filter joins validation message arrays', () => {
  const filter = new HttpExceptionFilter();
  const { host, payload } = makeHost('/games');

  filter.catch(
    new BadRequestException({
      message: ['mode must be one of: pvp, pve', 'timeControl.initialSeconds must be a positive number'],
      error: 'Bad Request',
      statusCode: 400,
    }),
    host,
  );

  assert.equal(payload.statusCode, 400);
  assert.equal(
    (payload.body as any).error.message,
    'mode must be one of: pvp, pve, timeControl.initialSeconds must be a positive number',
  );
  assert.equal((payload.body as any).error.code, 'Bad Request');
});
