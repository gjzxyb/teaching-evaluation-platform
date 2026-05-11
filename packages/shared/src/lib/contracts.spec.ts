import test from 'node:test';
import assert from 'node:assert/strict';
import { apiError, apiSuccess, createTraceId } from './contracts.js';

test('creates success envelope with supplied trace id', () => {
  const envelope = apiSuccess({ ok: true }, 'trace-fixed');

  assert.equal(envelope.code, 0);
  assert.equal(envelope.traceId, 'trace-fixed');
  assert.deepEqual(envelope.data, { ok: true });
});

test('creates error envelope with supplied trace id', () => {
  const envelope = apiError(401, 'Unauthorized', 'trace-error');

  assert.equal(envelope.code, 401);
  assert.equal(envelope.message, 'Unauthorized');
  assert.equal(envelope.traceId, 'trace-error');
  assert.equal(envelope.data, null);
});

test('generates trace ids with stable prefix and entropy', () => {
  const traceId = createTraceId();

  assert.match(traceId, /^trace-[a-z0-9]+-[a-z0-9]+$/);
});
