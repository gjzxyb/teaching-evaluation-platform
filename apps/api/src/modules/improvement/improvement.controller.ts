import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';
import {
  ImprovementService,
  type GenerateTicketOptions,
  type UpdateActionPlanRequest
} from './improvement.service.js';

@Controller('improvement-tickets')
export class ImprovementController {
  constructor(
    private readonly improvementService: ImprovementService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {}

  @Get()
  listTickets(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.improvementService.listTickets(tenantId));
  }

  @Get(':id')
  getTicket(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.improvementService.getTicket(tenantId, id));
  }

  @Post('generate-from-task/:taskId')
  generateFromTask(
    @Param('taskId') taskId: string,
    @Query('tenantId') tenantId = 'demo',
    @Body() input: GenerateTicketOptions
  ) {
    const tickets = this.improvementService.generateTicketsFromTask(tenantId, taskId, input);
    for (const ticket of tickets) {
      this.auditService.record({
        action: 'improvement.ticket.create',
        actorId: 'system',
        tenantId,
        target: ticket.id
      });
      this.notificationService.record({
        tenantId,
        channel: 'in_app',
        recipientUserId: ticket.ownerUserId,
        bizType: 'improvement.ticket.create',
        bizId: ticket.id,
        status: 'sent',
        payload: { problemDesc: ticket.problemDesc, dueDate: ticket.dueDate }
      });
    }
    return apiSuccess(tickets);
  }

  @Put(':id')
  updateActionPlan(
    @Param('id') id: string,
    @Query('tenantId') tenantId = 'demo',
    @Body() input: UpdateActionPlanRequest
  ) {
    const ticket = this.improvementService.updateActionPlan(tenantId, id, input);
    this.auditService.record({
      action: 'improvement.ticket.update',
      actorId: ticket.ownerUserId,
      tenantId,
      target: id
    });
    return apiSuccess(ticket);
  }

  @Post(':id/review')
  reviewTicket(
    @Param('id') id: string,
    @Query('tenantId') tenantId = 'demo',
    @Body('reviewResult') reviewResult: string
  ) {
    const ticket = this.improvementService.reviewTicket(tenantId, id, reviewResult);
    this.auditService.record({
      action: 'improvement.ticket.review',
      actorId: 'system',
      tenantId,
      target: id
    });
    return apiSuccess(ticket);
  }

  @Post(':id/close')
  closeTicket(@Param('id') id: string, @Query('tenantId') tenantId = 'demo') {
    const ticket = this.improvementService.closeTicket(tenantId, id);
    this.auditService.record({
      action: 'improvement.ticket.close',
      actorId: 'system',
      tenantId,
      target: id
    });
    return apiSuccess(ticket);
  }
}
