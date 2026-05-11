import { Injectable, NotFoundException } from '@nestjs/common';
import {
  collectGrantedPermissions,
  createTenantScopeGrant,
  type DataScopeGrant,
  type PermissionCode,
  type UserRole,
  type UserSummary
} from '@tep/shared';

const users: UserSummary[] = [
  {
    id: 'u-admin-1',
    tenantId: 'demo',
    displayName: '平台管理员',
    userType: 'admin',
    roles: ['super-admin']
  },
  {
    id: 'u-student-1',
    tenantId: 'demo',
    displayName: '学生甲',
    userType: 'student',
    roles: ['student']
  },
  {
    id: 'u-teacher-1',
    tenantId: 'demo',
    displayName: '教师甲',
    userType: 'teacher',
    roles: ['teacher']
  }
];

export interface UserAccessDetails {
  user: UserSummary;
  roles: UserRole[];
  permissions: PermissionCode[];
  dataScopes: DataScopeGrant[];
}

@Injectable()
export class IamService {
  getUserAccess(tenantId: string, userId: string): UserAccessDetails {
    const user = users.find((item) => item.tenantId === tenantId && item.id === userId);
    if (!user) {
      throw new NotFoundException('User access not found');
    }

    return {
      user,
      roles: user.roles,
      permissions: collectGrantedPermissions(user.roles),
      dataScopes: [createTenantScopeGrant(tenantId, user.roles)]
    };
  }
}
