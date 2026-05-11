import { Controller, Get, Param, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { CompositeAnalysisService } from './composite-analysis.service.js';

@Controller('composite-analysis')
export class CompositeAnalysisController {
  constructor(private readonly compositeAnalysisService: CompositeAnalysisService) {}

  @Get('teachers/:teacherId/profile')
  getTeacherCompositeProfile(
    @Param('teacherId') teacherId: string,
    @Query('tenantId') tenantId = 'demo'
  ) {
    return apiSuccess(this.compositeAnalysisService.getTeacherCompositeProfile(tenantId, teacherId));
  }
}
