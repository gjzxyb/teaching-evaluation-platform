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
