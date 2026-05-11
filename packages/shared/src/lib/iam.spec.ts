import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectGrantedPermissions,
  getDefaultPermissionsForRole,
  type UserRole
} from './iam.js';

test('returns stable default permissions for the configured role set', () => {
  const roles: UserRole[] = ['school-admin', 'teacher'];
  const permissions = collectGrantedPermissions(roles);

  assert.ok(permissions.includes('tenant.read'));
  assert.ok(permissions.includes('eval.task.manage'));
  assert.ok(permissions.includes('report.teacher.read'));
  assert.ok(permissions.includes('improvement.plan.manage'));
});

test('teacher role permissions do not include tenant management', () => {
  const permissions = getDefaultPermissionsForRole('teacher');

  assert.ok(permissions.includes('report.teacher.read'));
  assert.equal(permissions.includes('tenant.manage'), false);
});
