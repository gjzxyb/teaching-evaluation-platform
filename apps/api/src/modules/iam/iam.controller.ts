import { Controller, Get, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { IamService } from './iam.service.js';

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('access')
  getAccess(@Query('tenantId') tenantId = 'demo', @Query('userId') userId = 'u-admin-1') {
    return apiSuccess(this.iamService.getUserAccess(tenantId, userId));
  }
}
