import { Controller, Get, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { NotificationService, type NotificationStatus } from './notification.service.js';

@Controller('notify/logs')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(
    @Query('tenantId') tenantId?: string,
    @Query('bizType') bizType?: string,
    @Query('bizId') bizId?: string,
    @Query('recipientUserId') recipientUserId?: string,
    @Query('status') status?: NotificationStatus
  ) {
    return apiSuccess(this.notificationService.list({ tenantId, bizType, bizId, recipientUserId, status }));
  }
}
