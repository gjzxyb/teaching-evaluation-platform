import { Body, Controller, Post } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { AuditService } from '../audit/audit.service.js';
import { AuthService, type LoginRequest, type SsoCallbackRequest } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService
  ) {}

  @Post('login')
  login(@Body() input: LoginRequest) {
    const session = this.authService.login(input);
    this.auditService.record({
      action: 'auth.login',
      actorId: session.user.id,
      tenantId: session.tenant.id,
      target: 'session'
    });
    return apiSuccess(session);
  }

  @Post('sso/callback')
  ssoCallback(@Body() input: SsoCallbackRequest) {
    const session = this.authService.handleSsoCallback(input);
    this.auditService.record({
      action: 'auth.sso.callback',
      actorId: session.user.id,
      tenantId: session.tenant.id,
      target: input.provider
    });
    return apiSuccess(session);
  }
}
