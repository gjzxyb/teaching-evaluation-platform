import { Controller, Get, Param, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { ReportsService } from './reports.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('teacher/:teacherId')
  getTeacherReport(
    @Param('teacherId') teacherId: string,
    @Query('tenantId') tenantId = 'demo'
  ) {
    return apiSuccess(this.reportsService.getTeacherReport(tenantId, teacherId));
  }

  @Get('completion/:taskId')
  getCompletionReport(@Param('taskId') taskId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.reportsService.getCompletionReport(tenantId, taskId));
  }

  @Get('average/:taskId')
  getAverageReport(@Param('taskId') taskId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.reportsService.getAverageReport(tenantId, taskId));
  }

  @Get('dimensions/:taskId')
  getDimensionReport(@Param('taskId') taskId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.reportsService.getDimensionReport(tenantId, taskId));
  }
}
