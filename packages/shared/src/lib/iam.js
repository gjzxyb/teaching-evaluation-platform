const rolePermissionMap = {
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
export function getDefaultPermissionsForRole(role) {
    return [...rolePermissionMap[role]];
}
export function collectGrantedPermissions(roles) {
    return [...new Set(roles.flatMap((role) => rolePermissionMap[role]))];
}
export function createTenantScopeGrant(tenantId, roles) {
    return {
        scopeType: 'tenant',
        scopeId: tenantId,
        permissions: collectGrantedPermissions(roles)
    };
}
