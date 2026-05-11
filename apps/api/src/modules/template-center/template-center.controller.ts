import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  TemplateCenterService,
  type CreateIndicatorRequest,
  type CreateQuestionRequest,
  type CreateTemplateRequest
} from './template-center.service.js';

@Controller()
export class TemplateCenterController {
  constructor(private readonly templateCenterService: TemplateCenterService) {}

  @Get('indicators')
  listIndicators(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.templateCenterService.listIndicators(tenantId));
  }

  @Post('indicators')
  createIndicator(@Body() input: CreateIndicatorRequest) {
    return apiSuccess(this.templateCenterService.createIndicator(input));
  }

  @Get('questions')
  listQuestions(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.templateCenterService.listQuestions(tenantId));
  }

  @Post('questions')
  createQuestion(@Body() input: CreateQuestionRequest) {
    return apiSuccess(this.templateCenterService.createQuestion(input));
  }

  @Get('templates')
  listTemplates(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.templateCenterService.listTemplates(tenantId));
  }

  @Post('templates')
  createTemplate(@Body() input: CreateTemplateRequest) {
    return apiSuccess(this.templateCenterService.createTemplate(input));
  }

  @Post('templates/:id/publish')
  publishTemplate(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.templateCenterService.publishTemplate(tenantId, id));
  }

  @Post('templates/:id/copy')
  copyTemplate(
    @Param('id') id: string,
    @Query('tenantId') tenantId = 'demo',
    @Body('templateName') templateName: string
  ) {
    return apiSuccess(this.templateCenterService.copyTemplate(tenantId, id, templateName));
  }
}
