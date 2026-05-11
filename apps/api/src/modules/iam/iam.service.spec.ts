import test from 'node:test';
import assert from 'node:assert/strict';
import { IamService } from './iam.service.js';

test('returns tenant-scoped access details for a known user', () => {
  const service = new IamService();
  const access = service.getUserAccess('demo', 'u-admin-1');

  assert.equal(access.user.id, 'u-admin-1');
  assert.ok(access.permissions.includes('tenant.manage'));
  assert.ok(access.dataScopes.some((scope) => scope.scopeType === 'tenant'));
});

test('allows tenant scoped admin to access resources in the same tenant', () => {
  const service = new IamService();

  assert.equal(
    service.canAccessResource('demo', 'u-admin-1', {
      tenantId: 'demo',
      resourceType: 'teacher',
      resourceId: 'teacher-demo-1'
    }),
    true
  );
});

test('allows teacher to access own teacher resource but rejects other teachers', () => {
  const service = new IamService();

  assert.equal(
    service.canAccessResource('demo', 'u-teacher-1', {
      tenantId: 'demo',
      resourceType: 'teacher',
      resourceId: 'teacher-demo-1'
    }),
    true
  );
  assert.equal(
    service.canAccessResource('demo', 'u-teacher-1', {
      tenantId: 'demo',
      resourceType: 'teacher',
      resourceId: 'teacher-other'
    }),
    false
  );
});

test('rejects resource access outside the resolved tenant boundary', () => {
  const service = new IamService();

  assert.equal(
    service.canAccessResource('demo', 'u-admin-1', {
      tenantId: 'other',
      resourceType: 'teacher',
      resourceId: 'teacher-demo-1'
    }),
    false
  );
});
