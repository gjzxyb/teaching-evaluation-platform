import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  SupervisionService,
  type CreateObservationTaskInput,
  type ObservationTask,
  type SubmitObservationInput
} from './supervision.service.js';

@Controller('supervision')
export class SupervisionController {
  constructor(private readonly supervisionService: SupervisionService) {}

  @Post('observation-tasks')
  createObservationTask(@Body() input: CreateObservationTaskInput) {
    return apiSuccess(this.supervisionService.createObservationTask(input));
  }

  @Get('observation-tasks')
  listObservationTasks(
    @Query('tenantId') tenantId?: string,
    @Query('supervisorUserId') supervisorUserId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: ObservationTask['status']
  ) {
    return apiSuccess(
      this.supervisionService.listObservationTasks({ tenantId, supervisorUserId, teacherId, status })
    );
  }

  @Post('observations')
  submitObservation(@Body() input: SubmitObservationInput) {
    return apiSuccess(this.supervisionService.submitObservation(input));
  }

  @Get('observations/:observationId')
  getObservation(@Param('observationId') observationId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.supervisionService.getObservation(tenantId, observationId));
  }

  @Get('observations')
  listObservations(
    @Query('tenantId') tenantId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('taskId') taskId?: string,
    @Query('supervisorUserId') supervisorUserId?: string
  ) {
    return apiSuccess(
      this.supervisionService.listObservations({ tenantId, teacherId, taskId, supervisorUserId })
    );
  }
}
