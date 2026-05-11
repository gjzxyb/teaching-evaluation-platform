import type { UserRole } from './domain.js';

export type { UserRole } from './domain.js';

export type PermissionCode =
  | 'tenant.read'
  | 'tenant.manage'
  | 'iam.read'
  | 'iam.manage'
  | 'org.read'
  | 'org.manage'
  | 'master-data.read'
  | 'master-data.manage'
  | 'template.read'
  | 'template.manage'
  | 'eval.task.read'
  | 'eval.task.manage'
  | 'submission.manage'
  | 'report.teacher.read'
  | 'report.org.read'
  | 'improvement.plan.manage'
  | 'audit.read';

export interface DataScopeGrant {
  scopeType: 'tenant' | 'org' | 'self';
  scopeId: string;
  permissions: PermissionCode[];
}

const rolePermissionMap: Record<UserRole, PermissionCode[]> = {
  'super-admin': [
    'tenant.read',
    'tenant.manage',
    'iam.read',
    'iam.manage',
    'org.read',
    'org.manage',
    'master-data.read',
    'master-data.manage',
    'template.read',
    'template.manage',
    'eval.task.read',
    'eval.task.manage',
    'submission.manage',
    'report.teacher.read',
    'report.org.read',
    'improvement.plan.manage',
    'audit.read'
  ],
  'school-admin': [
    'tenant.read',
    'iam.read',
    'org.read',
    'org.manage',
    'master-data.read',
    'master-data.manage',
    'template.read',
    'template.manage',
    'eval.task.read',
    'eval.task.manage',
    'report.teacher.read',
    'report.org.read',
    'improvement.plan.manage',
    'audit.read'
  ],
  teacher: [
    'template.read',
    'eval.task.read',
    'submission.manage',
    'report.teacher.read',
    'improvement.plan.manage'
  ],
  student: ['eval.task.read', 'submission.manage'],
  supervisor: [
    'template.read',
    'eval.task.read',
    'submission.manage',
    'report.teacher.read',
    'improvement.plan.manage'
  ],
  parent: ['eval.task.read', 'submission.manage']
};

export function getDefaultPermissionsForRole(role: UserRole): PermissionCode[] {
  return [...rolePermissionMap[role]];
}

export function collectGrantedPermissions(roles: UserRole[]): PermissionCode[] {
  return [...new Set(roles.flatMap((role) => rolePermissionMap[role]))];
}

export function createTenantScopeGrant(
  tenantId: string,
  roles: UserRole[]
): DataScopeGrant {
  return {
    scopeType: 'tenant',
    scopeId: tenantId,
    permissions: collectGrantedPermissions(roles)
  };
}
