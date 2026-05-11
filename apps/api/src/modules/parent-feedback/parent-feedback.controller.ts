import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  ParentFeedbackService,
  type HandleParentFeedbackInput,
  type ParentFeedbackCategory,
  type ParentFeedbackRiskLevel,
  type ParentFeedbackStatus,
  type SubmitParentFeedbackInput
} from './parent-feedback.service.js';

@Controller('parent-feedback')
export class ParentFeedbackController {
  constructor(private readonly parentFeedbackService: ParentFeedbackService) {}

  @Post()
  submitFeedback(@Body() input: SubmitParentFeedbackInput) {
    return apiSuccess(this.parentFeedbackService.submitFeedback(input));
  }

  @Get()
  listFeedback(
    @Query('tenantId') tenantId?: string,
    @Query('parentUserId') parentUserId?: string,
    @Query('studentId') studentId?: string,
    @Query('classOrgId') classOrgId?: string,
    @Query('category') category?: ParentFeedbackCategory,
    @Query('status') status?: ParentFeedbackStatus,
    @Query('riskLevel') riskLevel?: ParentFeedbackRiskLevel
  ) {
    return apiSuccess(
      this.parentFeedbackService.listFeedback({
        tenantId,
        parentUserId,
        studentId,
        classOrgId,
        category,
        status,
        riskLevel
      })
    );
  }

  @Post(':feedbackId/handle')
  markHandled(
    @Param('feedbackId') feedbackId: string,
    @Query('tenantId') tenantId = 'demo',
    @Body() input: HandleParentFeedbackInput
  ) {
    return apiSuccess(this.parentFeedbackService.markHandled(tenantId, feedbackId, input));
  }
}
