import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  StorageService,
  type CreateUploadTargetInput,
  type StoredObjectStatus
} from './storage.service.js';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-targets')
  createUploadTarget(@Body() input: CreateUploadTargetInput) {
    return apiSuccess(this.storageService.createUploadTarget(input));
  }

  @Get('objects')
  listObjects(
    @Query('tenantId') tenantId?: string,
    @Query('ownerUserId') ownerUserId?: string,
    @Query('status') status?: StoredObjectStatus
  ) {
    return apiSuccess(this.storageService.listObjects({ tenantId, ownerUserId, status }));
  }

  @Delete('objects/:objectId')
  deleteObject(@Param('objectId') objectId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.storageService.deleteObject(tenantId, objectId));
  }
}
