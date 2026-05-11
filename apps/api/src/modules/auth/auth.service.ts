import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  collectGrantedPermissions,
  issueSessionToken,
  type AuthSource,
  type PlatformSession,
  type SessionTokenPayload,
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
  externalId?: string;
  displayName?: string;
  payload?: Record<string, unknown>;
}

export interface ProfileResult {
  tenant: TenantSummary;
  user: UserSummary;
  permissions: PlatformSession['permissions'];
}

export interface LogoutResult {
  tenantId: string;
  userId: string;
  revoked: boolean;
}

interface NormalizedSsoIdentity {
  externalId: string;
  displayName: string;
}

interface SsoProviderAdapter {
  provider: SsoCallbackRequest['provider'];
  normalize(payload: Record<string, unknown>, fallback: SsoCallbackRequest): NormalizedSsoIdentity | undefined;
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

const ssoAdapters: SsoProviderAdapter[] = [
  {
    provider: 'oidc',
    normalize(payload, fallback) {
      const externalId = readString(payload.sub) ?? fallback.externalId;
      const displayName = readString(payload.name) ?? readString(payload.preferred_username) ?? fallback.displayName;
      return externalId && displayName ? { externalId, displayName } : undefined;
    }
  },
  {
    provider: 'oauth2',
    normalize(payload, fallback) {
      const externalId = readString(payload.id) ?? readString(payload.sub) ?? fallback.externalId;
      const displayName = readString(payload.name) ?? readString(payload.login) ?? fallback.displayName;
      return externalId && displayName ? { externalId, displayName } : undefined;
    }
  },
  {
    provider: 'cas',
    normalize(payload, fallback) {
      const externalId = readString(payload.user) ?? readString(payload.uid) ?? fallback.externalId;
      const displayName = readString(payload.displayName) ?? readString(payload.name) ?? fallback.displayName;
      return externalId && displayName ? { externalId, displayName } : undefined;
    }
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

    const identity = this.normalizeSsoIdentity(input);
    const role: UserRole = identity.externalId.startsWith('teacher') ? 'teacher' : 'student';
    const user: UserSummary = {
      id: `sso-${input.provider}-${identity.externalId}`,
      tenantId: input.tenantId,
      displayName: identity.displayName,
      userType: role === 'teacher' ? 'teacher' : 'student',
      roles: [role]
    };

    return this.createSession(user, tenant, 'sso');
  }

  getProfile(authorizationHeader: string | undefined): ProfileResult {
    const payload = this.parseAuthorizationHeader(authorizationHeader);
    const tenant = tenants[payload.tenantId];
    if (!tenant || tenant.status === 'disabled') {
      throw new UnauthorizedException('Unknown tenant');
    }

    const user = users.find((item) => item.tenantId === payload.tenantId && item.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    return {
      tenant,
      user,
      permissions: collectGrantedPermissions(user.roles)
    };
  }

  logout(authorizationHeader: string | undefined): LogoutResult {
    const payload = this.parseAuthorizationHeader(authorizationHeader);
    return {
      tenantId: payload.tenantId,
      userId: payload.sub,
      revoked: true
    };
  }

  private normalizeSsoIdentity(input: SsoCallbackRequest): NormalizedSsoIdentity {
    const adapter = ssoAdapters.find((item) => item.provider === input.provider);
    const identity = adapter?.normalize(input.payload ?? {}, input);
    if (!identity) {
      throw new UnauthorizedException(`Invalid SSO payload for ${input.provider}`);
    }
    return identity;
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

  private parseAuthorizationHeader(authorizationHeader: string | undefined): SessionTokenPayload {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const encoded = authorizationHeader.slice('Bearer '.length).trim();
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<SessionTokenPayload>;
      if (!payload.sub || !payload.tenantId || !Array.isArray(payload.roles)) {
        throw new Error('Invalid token payload');
      }
      return {
        sub: payload.sub,
        tenantId: payload.tenantId,
        roles: payload.roles
      };
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
