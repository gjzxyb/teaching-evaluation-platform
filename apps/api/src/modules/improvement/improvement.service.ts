import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service.js';

export type ImprovementStatus = 'open' | 'processing' | 'done' | 'closed';

export interface ImprovementTicket {
  id: string;
  tenantId: string;
  sourceType: 'response' | 'observation' | 'report';
  sourceId: string;
  ownerUserId: string;
  problemDesc: string;
  rootCause?: string;
  actionPlan?: string;
  dueDate: string;
  status: ImprovementStatus;
  reviewResult?: string;
}

export interface GenerateTicketOptions {
  threshold: number;
  ownerUserId: string;
  dueDate: string;
}

export interface UpdateActionPlanRequest {
  rootCause: string;
  actionPlan: string;
}

export interface CreateObservationTicketInput {
  tenantId: string;
  sourceId: string;
  ownerUserId: string;
  problemDesc: string;
  dueDate: string;
}

const tickets: ImprovementTicket[] = [];

@Injectable()
export class ImprovementService {
  constructor(private readonly reportsService: ReportsService) {}

  generateTicketsFromTask(
    tenantId: string,
    taskId: string,
    options: GenerateTicketOptions
  ): ImprovementTicket[] {
    const dimensionReport = this.reportsService.getDimensionReport(tenantId, taskId);
    if (!dimensionReport.visible) {
      return [];
    }

    const created: ImprovementTicket[] = [];
    for (const item of dimensionReport.items) {
      if (item.averageScore >= options.threshold) {
        continue;
      }

      const existing = tickets.find((ticket) =>
        ticket.tenantId === tenantId &&
        ticket.sourceType === 'report' &&
        ticket.sourceId === `${taskId}:${item.indicatorKey}`
      );
      if (existing) {
        created.push({ ...existing });
        continue;
      }

      const ticket: ImprovementTicket = {
        id: `improvement-${tickets.length + 1}`,
        tenantId,
        sourceType: 'report',
        sourceId: `${taskId}:${item.indicatorKey}`,
        ownerUserId: options.ownerUserId,
        problemDesc: `Dimension ${item.indicatorKey} average score ${item.averageScore} is below ${options.threshold}`,
        dueDate: options.dueDate,
        status: 'open'
      };
      tickets.push(ticket);
      created.push({ ...ticket });
    }

    return created;
  }

  listTickets(tenantId: string): ImprovementTicket[] {
    return tickets
      .filter((ticket) => ticket.tenantId === tenantId)
      .map((ticket) => ({ ...ticket }));
  }

  createObservationTicket(input: CreateObservationTicketInput): ImprovementTicket {
    const existing = tickets.find((ticket) =>
      ticket.tenantId === input.tenantId &&
      ticket.sourceType === 'observation' &&
      ticket.sourceId === input.sourceId
    );
    if (existing) {
      return { ...existing };
    }

    const ticket: ImprovementTicket = {
      id: `improvement-${tickets.length + 1}`,
      tenantId: input.tenantId,
      sourceType: 'observation',
      sourceId: input.sourceId,
      ownerUserId: input.ownerUserId,
      problemDesc: input.problemDesc,
      dueDate: input.dueDate,
      status: 'open'
    };
    tickets.push(ticket);
    return { ...ticket };
  }

  getTicket(tenantId: string, ticketId: string): ImprovementTicket {
    return { ...this.requireTicket(tenantId, ticketId) };
  }

  updateActionPlan(
    tenantId: string,
    ticketId: string,
    input: UpdateActionPlanRequest
  ): ImprovementTicket {
    if (!input.rootCause.trim()) {
      throw new BadRequestException('rootCause is required');
    }
    if (!input.actionPlan.trim()) {
      throw new BadRequestException('actionPlan is required');
    }

    const ticket = this.requireTicket(tenantId, ticketId);
    ticket.rootCause = input.rootCause;
    ticket.actionPlan = input.actionPlan;
    ticket.status = 'processing';
    return { ...ticket };
  }

  reviewTicket(tenantId: string, ticketId: string, reviewResult: string): ImprovementTicket {
    if (!reviewResult.trim()) {
      throw new BadRequestException('reviewResult is required');
    }

    const ticket = this.requireTicket(tenantId, ticketId);
    ticket.reviewResult = reviewResult;
    ticket.status = 'done';
    return { ...ticket };
  }

  closeTicket(tenantId: string, ticketId: string): ImprovementTicket {
    const ticket = this.requireTicket(tenantId, ticketId);
    if (ticket.status !== 'done') {
      throw new BadRequestException('Only reviewed tickets can be closed');
    }
    ticket.status = 'closed';
    return { ...ticket };
  }

  private requireTicket(tenantId: string, ticketId: string): ImprovementTicket {
    const ticket = tickets.find((item) => item.tenantId === tenantId && item.id === ticketId);
    if (!ticket) {
      throw new NotFoundException('Improvement ticket not found');
    }
    return ticket;
  }
}
