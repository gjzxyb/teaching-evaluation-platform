import { Injectable, NotFoundException } from '@nestjs/common';
import { ImprovementService } from '../improvement/improvement.service.js';

export interface CreateObservationTaskInput {
  tenantId: string;
  courseId: string;
  teacherId: string;
  classOrgId: string;
  supervisorUserId: string;
  scheduledAt: string;
}

export interface ObservationTask {
  id: string;
  tenantId: string;
  courseId: string;
  teacherId: string;
  classOrgId: string;
  supervisorUserId: string;
  scheduledAt: string;
  status: 'scheduled' | 'submitted';
  createdAt: string;
}

export interface ObservationTaskQuery {
  tenantId?: string;
  supervisorUserId?: string;
  teacherId?: string;
  status?: ObservationTask['status'];
}

export interface ObservationScore {
  dimension: string;
  score: number;
}

export interface SubmitObservationInput {
  tenantId: string;
  taskId: string;
  supervisorUserId: string;
  scores: ObservationScore[];
  comments: string;
  improvementThreshold: number;
  dueDate: string;
}

export interface ClassroomObservation {
  id: string;
  tenantId: string;
  taskId: string;
  supervisorUserId: string;
  teacherId: string;
  scores: ObservationScore[];
  comments: string;
  status: 'submitted';
  improvementTicketIds: string[];
  submittedAt: string;
}

export interface ClassroomObservationQuery {
  tenantId?: string;
  teacherId?: string;
  taskId?: string;
  supervisorUserId?: string;
}

@Injectable()
export class SupervisionService {
  private readonly tasks: ObservationTask[] = [];
  private readonly observations: ClassroomObservation[] = [];

  constructor(private readonly improvementService: ImprovementService) {}

  createObservationTask(input: CreateObservationTaskInput): ObservationTask {
    const task: ObservationTask = {
      id: `observation-task-${this.tasks.length + 1}`,
      tenantId: input.tenantId,
      courseId: input.courseId,
      teacherId: input.teacherId,
      classOrgId: input.classOrgId,
      supervisorUserId: input.supervisorUserId,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    this.tasks.push(task);
    return { ...task };
  }

  listObservationTasks(query: ObservationTaskQuery = {}): ObservationTask[] {
    return this.tasks
      .filter((task) => !query.tenantId || task.tenantId === query.tenantId)
      .filter((task) => !query.supervisorUserId || task.supervisorUserId === query.supervisorUserId)
      .filter((task) => !query.teacherId || task.teacherId === query.teacherId)
      .filter((task) => !query.status || task.status === query.status)
      .map((task) => ({ ...task }))
      .reverse();
  }

  submitObservation(input: SubmitObservationInput): ClassroomObservation {
    const task = this.requireTask(input.tenantId, input.taskId);
    const ticketIds = this.createImprovementTickets(input, task);
    const observation: ClassroomObservation = {
      id: `observation-${this.observations.length + 1}`,
      tenantId: input.tenantId,
      taskId: input.taskId,
      supervisorUserId: input.supervisorUserId,
      teacherId: task.teacherId,
      scores: input.scores.map((score) => ({ ...score })),
      comments: input.comments,
      status: 'submitted',
      improvementTicketIds: ticketIds,
      submittedAt: new Date().toISOString()
    };
    task.status = 'submitted';
    this.observations.push(observation);
    return this.cloneObservation(observation);
  }

  getObservation(tenantId: string, observationId: string): ClassroomObservation {
    const observation = this.observations.find((item) => item.tenantId === tenantId && item.id === observationId);
    if (!observation) {
      throw new NotFoundException('Classroom observation not found');
    }
    return this.cloneObservation(observation);
  }

  listObservations(query: ClassroomObservationQuery = {}): ClassroomObservation[] {
    return this.observations
      .filter((observation) => !query.tenantId || observation.tenantId === query.tenantId)
      .filter((observation) => !query.teacherId || observation.teacherId === query.teacherId)
      .filter((observation) => !query.taskId || observation.taskId === query.taskId)
      .filter((observation) => !query.supervisorUserId || observation.supervisorUserId === query.supervisorUserId)
      .map((observation) => this.cloneObservation(observation))
      .reverse();
  }

  private createImprovementTickets(input: SubmitObservationInput, task: ObservationTask): string[] {
    return input.scores
      .filter((score) => score.score < input.improvementThreshold)
      .map((score) =>
        this.improvementService.createObservationTicket({
          tenantId: input.tenantId,
          sourceId: `${input.taskId}:${score.dimension}`,
          ownerUserId: task.teacherId,
          problemDesc: `Observation dimension ${score.dimension} score ${score.score} is below ${input.improvementThreshold}`,
          dueDate: input.dueDate
        }).id
      );
  }

  private requireTask(tenantId: string, taskId: string): ObservationTask {
    const task = this.tasks.find((item) => item.tenantId === tenantId && item.id === taskId);
    if (!task) {
      throw new NotFoundException('Observation task not found');
    }
    return task;
  }

  private cloneObservation(observation: ClassroomObservation): ClassroomObservation {
    return {
      ...observation,
      scores: observation.scores.map((score) => ({ ...score })),
      improvementTicketIds: [...observation.improvementTicketIds]
    };
  }
}
