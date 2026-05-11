import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  ExportService,
  type CreateReportExportInput,
  type ExportFormat,
  type ExportJobStatus,
  type ReportExportType
} from './export.service.js';

@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('reports')
  createReportExport(@Body() input: CreateReportExportInput) {
    return apiSuccess(this.exportService.createReportExport(input));
  }

  @Get()
  listExportJobs(
    @Query('tenantId') tenantId?: string,
    @Query('requesterUserId') requesterUserId?: string,
    @Query('taskId') taskId?: string,
    @Query('reportType') reportType?: ReportExportType,
    @Query('format') _format?: ExportFormat,
    @Query('status') status?: ExportJobStatus
  ) {
    return apiSuccess(
      this.exportService.listExportJobs({ tenantId, requesterUserId, taskId, reportType, status })
    );
  }
}
