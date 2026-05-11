import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';
import {
  EvaluationService,
  type CreateTaskRequest,
  type DraftSubmissionRequest,
  type SubmitSubmissionRequest
} from './evaluation.service.js';

@Controller('eval')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {}

  @Get('my-tasks/:userId')
  getMyTasks(@Param('userId') userId: string) {
    return apiSuccess(this.evaluationService.getMyTasks(userId));
  }

  @Get('history/:userId')
  getHistory(@Param('userId') userId: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.evaluationService.getHistory(tenantId, userId));
  }

  @Post('demo/seed')
  seedDemoData(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.evaluationService.seedDemoData(tenantId));
  }

  @Post('tasks')
  createTask(@Body() input: CreateTaskRequest) {
    const task = this.evaluationService.createTask(input);
    this.auditService.record({
      action: 'eval.task.create',
      actorId: input.createdBy,
      tenantId: input.tenantId,
      target: task.id
    });
    return apiSuccess(task);
  }

  @Get('tasks')
  listTasks(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.evaluationService.listTasks(tenantId));
  }

  @Get('tasks/:id')
  getTask(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.evaluationService.getTask(tenantId, id));
  }

  @Post('tasks/:id/publish')
  publishTask(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    const task = this.evaluationService.publishTask(tenantId, id);
    this.auditService.record({
      action: 'eval.task.publish',
      actorId: 'system',
      tenantId,
      target: id
    });
    return apiSuccess(task);
  }

  @Post('tasks/:id/close')
  closeTask(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    const task = this.evaluationService.closeTask(tenantId, id);
    this.auditService.record({
      action: 'eval.task.close',
      actorId: 'system',
      tenantId,
      target: id
    });
    return apiSuccess(task);
  }

  @Post('tasks/:id/remind')
  remindTask(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    const result = this.evaluationService.remindTask(tenantId, id);
    for (const userId of result.notifiedUserIds) {
      this.notificationService.record({
        tenantId,
        channel: 'in_app',
        recipientUserId: userId,
        bizType: 'eval.task.remind',
        bizId: id,
        status: 'sent',
        payload: { taskId: id }
      });
    }
    return apiSuccess(result);
  }

  @Get('tasks/:id/instances')
  listTaskInstances(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.evaluationService.listTaskInstances(tenantId, id));
  }

  @Get('instances/:instanceId')
  getInstanceDetail(
    @Param('instanceId') instanceId: string,
    @Query('tenantId') tenantId = 'demo',
    @Query('userId') userId = 'u-student-1'
  ) {
    return apiSuccess(this.evaluationService.getInstanceDetail(tenantId, instanceId, userId));
  }

  @Get('instances/:instanceId/draft')
  getDraft(
    @Param('instanceId') instanceId: string,
    @Query('tenantId') tenantId = 'demo',
    @Query('userId') userId = 'u-student-1'
  ) {
    return apiSuccess(this.evaluationService.getDraft(tenantId, instanceId, userId) ?? null);
  }

  @Post('instances/:instanceId/draft')
  saveDraft(
    @Param('instanceId') instanceId: string,
    @Body() input: DraftSubmissionRequest
  ) {
    return apiSuccess(this.evaluationService.saveDraft(instanceId, input));
  }

  @Post('instances/:instanceId/submit')
  submit(
    @Param('instanceId') instanceId: string,
    @Body() input: SubmitSubmissionRequest
  ) {
    const response = this.evaluationService.submit(instanceId, input);
    this.auditService.record({
      action: 'eval.response.submit',
      actorId: input.evaluatorUserId,
      tenantId: input.tenantId,
      target: instanceId
    });
    return apiSuccess(response);
  }
}
