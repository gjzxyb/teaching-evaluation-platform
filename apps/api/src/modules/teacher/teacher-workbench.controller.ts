import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  TeacherWorkbenchService,
  type CreateSelfEvaluationInput
} from './teacher-workbench.service.js';

@Controller('teacher-workbench')
export class TeacherWorkbenchController {
  constructor(private readonly teacherWorkbenchService: TeacherWorkbenchService) {}

  @Get('teachers/:teacherId/results')
  getResultOverview(@Param('teacherId') teacherId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.teacherWorkbenchService.getResultOverview(tenantId, teacherId));
  }

  @Post('self-evaluations')
  createSelfEvaluation(@Body() input: CreateSelfEvaluationInput) {
    return apiSuccess(this.teacherWorkbenchService.createSelfEvaluation(input));
  }

  @Get('teachers/:teacherId/growth-archive')
  getGrowthArchive(@Param('teacherId') teacherId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.teacherWorkbenchService.getGrowthArchive(tenantId, teacherId));
  }
}
