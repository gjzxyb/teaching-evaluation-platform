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

test('creates an SSO session through provider adapters', () => {
  const service = new AuthService();
  const session = service.handleSsoCallback({
    provider: 'oidc',
    tenantId: 'demo',
    payload: {
      sub: 'teacher-100',
      name: '同步教师'
    }
  });

  assert.equal(session.source, 'sso');
  assert.equal(session.user.id, 'sso-oidc-teacher-100');
  assert.equal(session.user.displayName, '同步教师');
  assert.deepEqual(session.user.roles, ['teacher']);
});

test('rejects SSO callbacks for unsupported provider payloads', () => {
  const service = new AuthService();

  assert.throws(
    () => service.handleSsoCallback({
      provider: 'cas',
      tenantId: 'demo',
      payload: {}
    }),
    (error: unknown) => error instanceof UnauthorizedException
  );
});

test('returns profile from a previously issued session token', () => {
  const service = new AuthService();
  const session = service.login({
    tenantId: 'demo',
    username: 'admin',
    password: 'admin123'
  });

  const profile = service.getProfile(`Bearer ${session.token}`);

  assert.equal(profile.user.id, 'u-admin-1');
  assert.equal(profile.tenant.id, 'demo');
  assert.ok(profile.permissions.includes('tenant.manage'));
});

test('rejects malformed profile tokens', () => {
  const service = new AuthService();

  assert.throws(
    () => service.getProfile('Bearer not-a-valid-token'),
    (error: unknown) => error instanceof UnauthorizedException
  );
});

test('normalizes logout result for a valid token', () => {
  const service = new AuthService();
  const session = service.login({
    tenantId: 'demo',
    username: 'student',
    password: 'student123'
  });

  const result = service.logout(`Bearer ${session.token}`);

  assert.equal(result.userId, 'u-student-1');
  assert.equal(result.tenantId, 'demo');
  assert.equal(result.revoked, true);
});
