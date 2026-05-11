import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  collectGrantedPermissions,
  issueSessionToken,
  type AuthSource,
  type PlatformSession,
  type TenantSummary,
  type UserRole,
  type UserSummary
} from '@tep/shared';

export interface LoginRequest {
  tenantId: string;
  username: string;
  password: string;
}

export interface SsoCallbackRequest {
  provider: 'cas' | 'oidc' | 'oauth2';
  tenantId: string;
  externalId: string;
  displayName: string;
}

const tenants: Record<string, TenantSummary> = {
  demo: { id: 'demo', code: 'demo', name: 'Demo School', deploymentMode: 'saas', status: 'active' },
  disabled: { id: 'disabled', code: 'disabled', name: 'Disabled School', deploymentMode: 'saas', status: 'disabled' }
};

const users: Array<UserSummary & { username?: string; password?: string; externalId?: string }> = [
  {
    id: 'u-admin-1',
    tenantId: 'demo',
    username: 'admin',
    password: 'admin123',
    displayName: '平台管理员',
    userType: 'admin',
    roles: ['super-admin']
  },
  {
    id: 'u-student-1',
    tenantId: 'demo',
    username: 'student',
    password: 'student123',
    displayName: '学生甲',
    userType: 'student',
    roles: ['student']
  }
];

@Injectable()
export class AuthService {
  login(input: LoginRequest): PlatformSession {
    const tenant = tenants[input.tenantId];
    if (!tenant || tenant.status === 'disabled') {
      throw new UnauthorizedException('Unknown tenant');
    }

    const user = users.find((item) =>
      item.tenantId === input.tenantId &&
      item.username === input.username &&
      item.password === input.password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user, tenant, 'local');
  }

  handleSsoCallback(input: SsoCallbackRequest): PlatformSession {
    const tenant = tenants[input.tenantId];
    if (!tenant || tenant.status === 'disabled') {
      throw new UnauthorizedException('Unknown tenant');
    }

    const role: UserRole = input.externalId.startsWith('teacher') ? 'teacher' : 'student';
    const user: UserSummary = {
      id: `sso-${input.provider}-${input.externalId}`,
      tenantId: input.tenantId,
      displayName: input.displayName,
      userType: role === 'teacher' ? 'teacher' : 'student',
      roles: [role]
    };

    return this.createSession(user, tenant, 'sso');
  }

  private createSession(
    user: UserSummary,
    tenant: TenantSummary,
    source: AuthSource
  ): PlatformSession {
    return {
      token: issueSessionToken({ sub: user.id, tenantId: tenant.id, roles: user.roles }),
      source,
      tenant,
      user,
      permissions: collectGrantedPermissions(user.roles)
    };
  }
}
