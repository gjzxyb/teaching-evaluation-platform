import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  AnalysisService,
  type ManualSummaryInput,
  type TextAnalysisRequest
} from './analysis.service.js';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('texts/analyze')
  analyzeTexts(@Body() input: TextAnalysisRequest) {
    return apiSuccess(this.analysisService.analyzeTexts(input));
  }

  @Post('summaries')
  saveManualSummary(@Body() input: ManualSummaryInput) {
    return apiSuccess(this.analysisService.saveManualSummary(input));
  }

  @Get('summaries')
  listSummaries(
    @Query('tenantId') tenantId?: string,
    @Query('taskId') taskId?: string,
    @Query('authorUserId') authorUserId?: string
  ) {
    return apiSuccess(this.analysisService.listSummaries({ tenantId, taskId, authorUserId }));
  }
}
