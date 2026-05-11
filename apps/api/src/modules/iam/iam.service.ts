import { Injectable, NotFoundException } from '@nestjs/common';
import {
  collectGrantedPermissions,
  createTenantScopeGrant,
  type DataScopeGrant,
  type PermissionCode,
  type UserRole,
  type UserSummary
} from '@tep/shared';

type IamUser = UserSummary & {
  teacherId?: string;
  studentId?: string;
  orgIds?: string[];
};

const users: IamUser[] = [
  {
    id: 'u-admin-1',
    tenantId: 'demo',
    displayName: '平台管理员',
    userType: 'admin',
    roles: ['super-admin'],
    orgIds: ['org-root-demo']
  },
  {
    id: 'u-student-1',
    tenantId: 'demo',
    displayName: '学生甲',
    userType: 'student',
    roles: ['student'],
    studentId: 'student-demo-1'
  },
  {
    id: 'u-teacher-1',
    tenantId: 'demo',
    displayName: '教师甲',
    userType: 'teacher',
    roles: ['teacher'],
    teacherId: 'teacher-demo-1',
    orgIds: ['org-college-demo']
  }
];

export interface UserAccessDetails {
  user: UserSummary;
  roles: UserRole[];
  permissions: PermissionCode[];
  dataScopes: DataScopeGrant[];
}

export type ResourceType = 'tenant' | 'org' | 'teacher' | 'student' | 'template' | 'report';

export interface ResourceAccessRequest {
  tenantId: string;
  resourceType: ResourceType;
  resourceId: string;
  orgId?: string;
}

@Injectable()
export class IamService {
  getUserAccess(tenantId: string, userId: string): UserAccessDetails {
    const user = this.requireUser(tenantId, userId);

    return {
      user,
      roles: user.roles,
      permissions: collectGrantedPermissions(user.roles),
      dataScopes: this.resolveDataScopes(user)
    };
  }

  canAccessResource(tenantId: string, userId: string, resource: ResourceAccessRequest): boolean {
    if (resource.tenantId !== tenantId) {
      return false;
    }

    const user = this.requireUser(tenantId, userId);
    if (user.roles.includes('super-admin') || user.roles.includes('school-admin')) {
      return true;
    }

    if (resource.resourceType === 'teacher') {
      return user.teacherId === resource.resourceId;
    }
    if (resource.resourceType === 'student') {
      return user.studentId === resource.resourceId;
    }
    if (resource.resourceType === 'org') {
      return user.orgIds?.includes(resource.resourceId) ?? false;
    }
    if (resource.orgId) {
      return user.orgIds?.includes(resource.orgId) ?? false;
    }

    return false;
  }

  private requireUser(tenantId: string, userId: string): IamUser {
    const user = users.find((item) => item.tenantId === tenantId && item.id === userId);
    if (!user) {
      throw new NotFoundException('User access not found');
    }
    return user;
  }

  private resolveDataScopes(user: IamUser): DataScopeGrant[] {
    if (user.roles.includes('super-admin') || user.roles.includes('school-admin')) {
      return [createTenantScopeGrant(user.tenantId, user.roles)];
    }

    const permissions = collectGrantedPermissions(user.roles);
    const scopes: DataScopeGrant[] = [];
    if (user.teacherId) {
      scopes.push({ scopeType: 'self', scopeId: user.teacherId, permissions });
    }
    if (user.studentId) {
      scopes.push({ scopeType: 'self', scopeId: user.studentId, permissions });
    }
    for (const orgId of user.orgIds ?? []) {
      scopes.push({ scopeType: 'org', scopeId: orgId, permissions });
    }
    return scopes;
  }
}
