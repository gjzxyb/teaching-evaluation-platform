import { Controller, Get, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { AuditService } from './audit.service.js';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('target') target?: string
  ) {
    return apiSuccess(this.auditService.list({ tenantId, action, actorId, target }));
  }
}
