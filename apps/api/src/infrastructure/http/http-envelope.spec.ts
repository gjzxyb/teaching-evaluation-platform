import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { createErrorEnvelope, resolveRequestTraceId } from './http-envelope.js';

test('resolves request trace id from x-trace-id header', () => {
  assert.equal(resolveRequestTraceId({ 'x-trace-id': 'trace-from-client' }), 'trace-from-client');
});

test('generates trace id when request header is missing', () => {
  assert.match(resolveRequestTraceId({}), /^trace-[a-z0-9]+-[a-z0-9]+$/);
});

test('creates error envelope from Nest HTTP exception', () => {
  const envelope = createErrorEnvelope(new BadRequestException('invalid input'), 'trace-error');

  assert.equal(envelope.code, 400);
  assert.equal(envelope.message, 'invalid input');
  assert.equal(envelope.data, null);
  assert.equal(envelope.traceId, 'trace-error');
});
