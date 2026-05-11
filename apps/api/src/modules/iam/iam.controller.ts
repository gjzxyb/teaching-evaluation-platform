import { Controller, Get, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { IamService, type ResourceType } from './iam.service.js';

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('access')
  getAccess(@Query('tenantId') tenantId = 'demo', @Query('userId') userId = 'u-admin-1') {
    return apiSuccess(this.iamService.getUserAccess(tenantId, userId));
  }

  @Get('can-access')
  canAccessResource(
    @Query('tenantId') tenantId = 'demo',
    @Query('userId') userId = 'u-admin-1',
    @Query('resourceTenantId') resourceTenantId = tenantId,
    @Query('resourceType') resourceType: ResourceType = 'tenant',
    @Query('resourceId') resourceId = tenantId,
    @Query('orgId') orgId?: string
  ) {
    return apiSuccess({
      allowed: this.iamService.canAccessResource(tenantId, userId, {
        tenantId: resourceTenantId,
        resourceType,
        resourceId,
        orgId
      })
    });
  }
}
