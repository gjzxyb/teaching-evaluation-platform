import test from 'node:test';
import assert from 'node:assert/strict';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

test('rejects login when tenant is disabled', () => {
  const service = new AuthService();

  assert.throws(
    () => service.login({ tenantId: 'disabled', username: 'admin', password: 'admin123' }),
    (error: unknown) => error instanceof UnauthorizedException
  );
});

test('creates a local session with tenant-aware permissions', () => {
  const service = new AuthService();
  const session = service.login({
    tenantId: 'demo',
    username: 'admin',
    password: 'admin123'
  });

  assert.equal(session.tenant.id, 'demo');
  assert.ok(session.permissions.includes('tenant.manage'));
});
