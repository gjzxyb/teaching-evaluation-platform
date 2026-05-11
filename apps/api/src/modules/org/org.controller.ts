import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { OrgService, type CreateOrgUnitRequest } from './org.service.js';

@Controller('org-units')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get('tree')
  getTree(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.orgService.getOrgTree(tenantId));
  }

  @Post()
  create(@Body() input: CreateOrgUnitRequest) {
    return apiSuccess(this.orgService.createOrgUnit(input));
  }
}
