import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  aggregateTeacherReport,
  assertTenantOwnership,
  buildInitialInstances,
  createDraftResponse,
  submitResponse,
  type EvaluationAnswerInput,
  type EvaluationInstance,
  type EvaluationResponse,
  type EvaluationTask,
  type EvaluationTemplate,
  type TeacherReport,
  type UserSummary
} from '@tep/shared';
import { TemplateCenterService } from '../template-center/template-center.service.js';

export interface CreateTaskRequest {
  tenantId: string;
  taskName: string;
  schoolYear: string;
  termCode: string;
  templateId: string;
  sampleThreshold: number;
  resultReleaseTime?: string;
  createdBy: string;
}

export interface DraftSubmissionRequest {
  tenantId: string;
  evaluatorUserId: string;
  answers: EvaluationAnswerInput[];
}

export interface SubmitSubmissionRequest extends DraftSubmissionRequest {}

export interface TaskReminderResult {
  taskId: string;
  pendingCount: number;
  notifiedUserIds: string[];
}

export interface InstanceDetail {
  instance: EvaluationInstance;
  task: EvaluationTask;
  template: EvaluationTemplate;
  draft?: EvaluationResponse;
}

export interface TaskReportDataset {
  task: EvaluationTask;
  template: EvaluationTemplate;
  instances: EvaluationInstance[];
  responses: EvaluationResponse[];
}

interface TemplateReader {
  getTemplate(tenantId: string, templateId: string): EvaluationTemplate & { status?: string };
}

const users: UserSummary[] = [
  {
    id: 'u-student-1',
    tenantId: 'demo',
    displayName: '学生甲',
    userType: 'student',
    roles: ['student']
  }
];

@Injectable()
export class EvaluationService {
  private readonly tasks = new Map<string, EvaluationTask>();
  private readonly instances = new Map<string, EvaluationInstance>();
  private readonly responses = new Map<string, EvaluationResponse>();
  private readonly templatesByTask = new Map<string, EvaluationTemplate>();

  constructor(private readonly templateReader: TemplateReader = new TemplateCenterService()) {}

  createTask(input: CreateTaskRequest): EvaluationTask {
    const template = this.templateReader.getTemplate(input.tenantId, input.templateId);
    if (template.tenantId !== input.tenantId || template.status !== 'published') {
      throw new BadRequestException('Task requires a published template');
    }

    const task: EvaluationTask = {
      id: `task-${this.tasks.size + 1}`,
      tenantId: input.tenantId,
      taskName: input.taskName,
      schoolYear: input.schoolYear,
      termCode: input.termCode,
      templateId: input.templateId,
      sampleThreshold: input.sampleThreshold,
      resultReleaseTime: input.resultReleaseTime,
      status: 'draft'
    };

    this.tasks.set(task.id, task);
    this.templatesByTask.set(task.id, template);
    return { ...task };
  }

  getTask(tenantId: string, taskId: string): EvaluationTask {
    return { ...this.requireTask(tenantId, taskId) };
  }

  listTasks(tenantId: string): EvaluationTask[] {
    return [...this.tasks.values()]
      .filter((task) => task.tenantId === tenantId)
      .map((task) => ({ ...task }));
  }

  publishTask(tenantId: string, taskId: string): EvaluationTask {
    const task = this.requireTask(tenantId, taskId);
    if (task.status === 'closed') {
      throw new BadRequestException('Closed task cannot be published');
    }

    const template = this.requireTaskTemplate(task.id);
    if (this.listTaskInstances(tenantId, task.id).length === 0) {
      buildInitialInstances(task, template, users).forEach((instance) => {
        this.instances.set(instance.id, instance);
      });
    }
    task.status = 'running';
    return { ...task };
  }

  closeTask(tenantId: string, taskId: string): EvaluationTask {
    const task = this.requireTask(tenantId, taskId);
    task.status = 'closed';

    for (const instance of this.instances.values()) {
      if (instance.tenantId === tenantId && instance.taskId === taskId && instance.status !== 'submitted') {
        instance.status = 'expired';
      }
    }
    return { ...task };
  }

  remindTask(tenantId: string, taskId: string): TaskReminderResult {
    this.requireTask(tenantId, taskId);
    const pendingInstances = this.listTaskInstances(tenantId, taskId)
      .filter((instance) => instance.status === 'pending' || instance.status === 'draft');

    return {
      taskId,
      pendingCount: pendingInstances.length,
      notifiedUserIds: pendingInstances.map((instance) => instance.evaluatorUserId)
    };
  }

  listTaskInstances(tenantId: string, taskId: string): EvaluationInstance[] {
    return [...this.instances.values()]
      .filter((instance) => instance.tenantId === tenantId && instance.taskId === taskId)
      .map((instance) => ({ ...instance }));
  }

  getInstanceDetail(tenantId: string, instanceId: string, evaluatorUserId: string): InstanceDetail {
    const instance = this.requireInstance(instanceId);
    assertTenantOwnership(instance.tenantId, tenantId);
    if (instance.evaluatorUserId !== evaluatorUserId) {
      throw new BadRequestException('Evaluator mismatch');
    }

    return {
      instance: { ...instance },
      task: { ...this.requireTask(tenantId, instance.taskId) },
      template: this.cloneTemplate(this.requireTaskTemplate(instance.taskId)),
      draft: this.getDraft(tenantId, instanceId, evaluatorUserId)
    };
  }

  getDraft(tenantId: string, instanceId: string, evaluatorUserId: string): EvaluationResponse | undefined {
    const instance = this.requireInstance(instanceId);
    assertTenantOwnership(instance.tenantId, tenantId);
    if (instance.evaluatorUserId !== evaluatorUserId) {
      throw new BadRequestException('Evaluator mismatch');
    }

    const response = this.responses.get(instanceId);
    if (!response || response.status !== 'draft') {
      return undefined;
    }
    return this.cloneResponse(response);
  }

  getHistory(tenantId: string, evaluatorUserId: string): EvaluationResponse[] {
    return [...this.responses.values()]
      .filter((response) =>
        response.status === 'submitted' &&
        response.instance.tenantId === tenantId &&
        response.instance.evaluatorUserId === evaluatorUserId
      )
      .map((response) => this.cloneResponse(response));
  }

  getMyTasks(userId: string): EvaluationInstance[] {
    return [...this.instances.values()]
      .filter((instance) => instance.evaluatorUserId === userId)
      .map((instance) => ({ ...instance }));
  }

  saveDraft(instanceId: string, input: DraftSubmissionRequest): EvaluationResponse {
    const instance = this.requireInstance(instanceId);
    assertTenantOwnership(instance.tenantId, input.tenantId);
    if (instance.evaluatorUserId !== input.evaluatorUserId) {
      throw new BadRequestException('Evaluator mismatch');
    }

    const template = this.requireTaskTemplate(instance.taskId);
    const draft = createDraftResponse(instance, template, input.answers);
    this.responses.set(instanceId, draft);
    instance.status = 'draft';
    return draft;
  }

  submit(instanceId: string, input: SubmitSubmissionRequest): EvaluationResponse {
    const instance = this.requireInstance(instanceId);
    assertTenantOwnership(instance.tenantId, input.tenantId);
    if (instance.evaluatorUserId !== input.evaluatorUserId) {
      throw new BadRequestException('Evaluator mismatch');
    }
    if (instance.status === 'expired') {
      throw new BadRequestException('Expired instance cannot be submitted');
    }
    if (instance.status === 'submitted') {
      throw new BadRequestException('Instance already submitted');
    }

    const template = this.requireTaskTemplate(instance.taskId);
    const response = submitResponse(instance, template, input.answers);
    this.responses.set(instanceId, response);
    this.instances.set(instanceId, response.instance);
    return response;
  }

  getTeacherReport(tenantId: string, teacherId: string): TeacherReport {
    const taskResponses = [...this.responses.values()].filter((response) => {
      return response.instance.tenantId === tenantId && response.instance.targetTeacherId === teacherId;
    });

    return aggregateTeacherReport(tenantId, teacherId, taskResponses);
  }

  getTaskReportDataset(tenantId: string, taskId: string): TaskReportDataset {
    const task = this.requireTask(tenantId, taskId);
    return {
      task: { ...task },
      template: this.cloneTemplate(this.requireTaskTemplate(taskId)),
      instances: this.listTaskInstances(tenantId, taskId),
      responses: [...this.responses.values()]
        .filter((response) => response.instance.tenantId === tenantId && response.instance.taskId === taskId)
        .map((response) => this.cloneResponse(response))
    };
  }

  private requireTask(tenantId: string, taskId: string): EvaluationTask {
    const task = this.tasks.get(taskId);
    if (!task || task.tenantId !== tenantId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private requireTaskTemplate(taskId: string): EvaluationTemplate {
    const template = this.templatesByTask.get(taskId);
    if (!template) {
      throw new NotFoundException('Task template not found');
    }
    return template;
  }

  private requireInstance(instanceId: string): EvaluationInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new NotFoundException('Instance not found');
    }
    return instance;
  }

  private cloneTemplate(template: EvaluationTemplate): EvaluationTemplate {
    return {
      ...template,
      questions: template.questions.map((question) => ({ ...question }))
    };
  }

  private cloneResponse(response: EvaluationResponse): EvaluationResponse {
    return {
      ...response,
      instance: { ...response.instance },
      answers: response.answers.map((answer) => ({ ...answer }))
    };
  }
}
