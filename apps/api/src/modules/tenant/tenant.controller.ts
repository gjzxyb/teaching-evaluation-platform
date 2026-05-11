import { Controller, Get, Headers } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { TenantContextService } from './tenant-context.service.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantContextService: TenantContextService) {}

  @Get('resolve')
  resolve(@Headers('x-tenant-id') tenantId: string, @Headers('host') host: string) {
    return apiSuccess(this.tenantContextService.resolve({ tenantId, host }));
  }
}
