import {
  fallbackCompositeProfile,
  fallbackImprovements,
  fallbackLogs,
  fallbackParentFeedback,
  fallbackTasks,
  fallbackSupervision,
  fallbackTemplates,
  fallbackTeacherOverview
} from './fixtures.js';
import type { PlatformSession } from '@tep/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TENANT_ID = 'demo';
const SESSION_STORAGE_KEY = 'tep.admin.session';

export interface AdminTemplateRow {
  name: string;
  type: string;
  version: string;
  status: string;
  questions: number;
}

export interface AdminTaskRow {
  name: string;
  stage: string;
  completion: string;
  template: string;
}

export interface AdminImprovementRow {
  id: string;
  owner: string;
  problem: string;
  status: string;
  due: string;
}

export interface AdminLogRow {
  type: string;
  action: string;
  target: string;
  result: string;
}

export interface AdminReportSummary {
  completionRate: string;
  completionText: string;
  dimensions: string[][];
}

export interface AdminTeacherOverview {
  teacherId: string;
  submittedCount: number;
  averageScore: number;
  keywords: string[];
  selfEvaluations: Array<{
    taskId: string;
    strengths: string;
    weaknesses: string;
    improvementPlan: string;
  }>;
}

export interface AdminSupervisionSummary {
  tasks: string[][];
  observations: string[][];
}

export interface AdminParentFeedbackRow {
  id: string;
  studentId: string;
  classOrgId: string;
  category: string;
  riskLevel: string;
  status: string;
}

export interface AdminCompositeProfile {
  teacherId: string;
  averageScore: number;
  observationCount: number;
  highRiskCount: number;
  selfEvaluationCount: number;
  riskSignals: string[];
}

export interface AdminData {
  source: 'api' | 'fallback';
  templates: AdminTemplateRow[];
  tasks: AdminTaskRow[];
  improvements: AdminImprovementRow[];
  logs: AdminLogRow[];
  report: AdminReportSummary;
  teacherOverview: AdminTeacherOverview;
  supervision: AdminSupervisionSummary;
  parentFeedback: AdminParentFeedbackRow[];
  compositeProfile: AdminCompositeProfile;
}

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL);
}

export function getStoredSession(): PlatformSession | undefined {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as PlatformSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return undefined;
  }
}

export async function loginAdmin(username: string, password: string): Promise<PlatformSession> {
  const session = await postJson<PlatformSession>('/auth/login', {
    tenantId: TENANT_ID,
    username,
    password
  });
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function restoreAdminSession(): Promise<PlatformSession | undefined> {
  const session = getStoredSession();
  if (!session) {
    return undefined;
  }

  try {
    const profile = await getJson<Omit<PlatformSession, 'token' | 'source'>>('/auth/profile');
    return {
      ...session,
      tenant: profile.tenant,
      user: profile.user,
      permissions: profile.permissions
    };
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return undefined;
  }
}

export async function logoutAdmin(): Promise<void> {
  if (API_BASE_URL && getStoredSession()) {
    await postJson('/auth/logout', {}).catch(() => undefined);
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function loadAdminData(): Promise<AdminData> {
  if (!API_BASE_URL) {
    return getFallbackData();
  }

  try {
    const [
      templates,
      tasks,
      improvements,
      notifyLogs,
      auditLogs,
      teacherOverview,
      growthArchive,
      supervisionTasks,
      observations,
      parentFeedback,
      compositeProfile
    ] = await Promise.all([
      getJson<unknown[]>(`/templates?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/eval/tasks?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/improvement-tickets?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/notify/logs?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/audit-logs?tenantId=${TENANT_ID}`),
      getJson<any>(`/teacher-workbench/teachers/teacher-demo-1/results?tenantId=${TENANT_ID}`),
      getJson<any>(`/teacher-workbench/teachers/teacher-demo-1/growth-archive?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/supervision/observation-tasks?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/supervision/observations?tenantId=${TENANT_ID}`),
      getJson<unknown[]>(`/parent-feedback?tenantId=${TENANT_ID}`),
      getJson<any>(`/composite-analysis/teachers/teacher-demo-1/profile?tenantId=${TENANT_ID}`)
    ]);

    return {
      source: 'api',
      templates: templates.map(mapTemplate),
      tasks: tasks.map(mapTask),
      improvements: improvements.map(mapImprovement),
      logs: [...notifyLogs.map(mapNotificationLog), ...auditLogs.map(mapAuditLog)],
      report: {
        completionRate: tasks.length === 0 ? '0%' : '待生成',
        completionText: tasks.length === 0 ? '暂无运行任务' : '请进入任务详情生成报表',
        dimensions: [['teaching-goal', '-', '等待数据']]
      },
      teacherOverview: mapTeacherOverview(teacherOverview, growthArchive),
      supervision: {
        tasks: supervisionTasks.map(mapObservationTask),
        observations: observations.map(mapObservation)
      },
      parentFeedback: parentFeedback.map(mapParentFeedback),
      compositeProfile: mapCompositeProfile(compositeProfile)
    };
  } catch {
    return getFallbackData();
  }
}

function getFallbackData(): AdminData {
  return {
    source: 'fallback',
    templates: fallbackTemplates,
    tasks: fallbackTasks,
    improvements: fallbackImprovements,
    logs: fallbackLogs,
    report: {
      completionRate: '86%',
      completionText: '已提交 86 / 应提交 100',
      dimensions: [
        ['teaching-goal', '4.2', '正常'],
        ['class-control', '3.6', '触发整改'],
        ['comments', '-', '文本汇总']
      ]
    },
    teacherOverview: fallbackTeacherOverview,
    supervision: {
      tasks: fallbackSupervision.tasks.map((item) => [item.id, item.teacherId, item.supervisor, item.status, item.scheduledAt]),
      observations: fallbackSupervision.observations.map((item) => [item.id, item.teacherId, item.dimensions, item.tickets])
    },
    parentFeedback: fallbackParentFeedback,
    compositeProfile: fallbackCompositeProfile
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  const envelope = await response.json() as ApiEnvelope<T>;
  if (envelope.code !== 0) {
    throw new Error(envelope.message);
  }
  return envelope.data;
}

async function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  const envelope = await response.json() as ApiEnvelope<T>;
  if (envelope.code !== 0) {
    throw new Error(envelope.message);
  }
  return envelope.data;
}

function authHeaders(): Record<string, string> {
  const session = getStoredSession();
  return session ? { authorization: `Bearer ${session.token}` } : {};
}

function mapTemplate(item: any): AdminTemplateRow {
  return {
    name: item.templateName ?? item.name ?? '-',
    type: item.templateType ?? item.type ?? '-',
    version: item.versionNo ?? item.version ?? '-',
    status: item.status ?? '-',
    questions: Array.isArray(item.questions) ? item.questions.length : Number(item.questions ?? 0)
  };
}

function mapTask(item: any): AdminTaskRow {
  return {
    name: item.taskName ?? item.name ?? '-',
    stage: item.status ?? item.stage ?? '-',
    completion: item.completion ?? '-',
    template: item.templateId ?? item.template ?? '-'
  };
}

function mapImprovement(item: any): AdminImprovementRow {
  return {
    id: item.id ?? '-',
    owner: item.ownerUserId ?? item.owner ?? '-',
    problem: item.problemDesc ?? item.problem ?? '-',
    status: item.status ?? '-',
    due: item.dueDate ?? item.due ?? '-'
  };
}

function mapNotificationLog(item: any): AdminLogRow {
  return {
    type: '通知',
    action: item.bizType ?? '-',
    target: item.bizId ?? '-',
    result: item.status ?? '-'
  };
}

function mapAuditLog(item: any): AdminLogRow {
  return {
    type: '审计',
    action: item.action ?? '-',
    target: item.target ?? '-',
    result: 'recorded'
  };
}

function mapTeacherOverview(overview: any, archive: any): AdminTeacherOverview {
  return {
    teacherId: overview.teacherId ?? 'teacher-demo-1',
    submittedCount: Number(overview.submittedCount ?? 0),
    averageScore: Number(overview.averageScore ?? 0),
    keywords: Array.isArray(overview.keywords) ? overview.keywords : [],
    selfEvaluations: Array.isArray(archive.selfEvaluations)
      ? archive.selfEvaluations.map((item: any) => ({
          taskId: item.taskId ?? '-',
          strengths: item.strengths ?? '-',
          weaknesses: item.weaknesses ?? '-',
          improvementPlan: item.improvementPlan ?? '-'
        }))
      : []
  };
}

function mapObservationTask(item: any): string[] {
  return [
    item.id ?? '-',
    item.teacherId ?? '-',
    item.supervisorUserId ?? '-',
    item.status ?? '-',
    String(item.scheduledAt ?? '-')
  ];
}

function mapObservation(item: any): string[] {
  const dimensions = Array.isArray(item.scores)
    ? item.scores.map((score: any) => `${score.dimension}:${score.score}`).join(', ')
    : '-';
  return [
    item.id ?? '-',
    item.teacherId ?? '-',
    dimensions,
    String(Array.isArray(item.improvementTicketIds) ? item.improvementTicketIds.length : 0)
  ];
}

function mapParentFeedback(item: any): AdminParentFeedbackRow {
  return {
    id: item.id ?? '-',
    studentId: item.studentId ?? '-',
    classOrgId: item.classOrgId ?? '-',
    category: item.category ?? '-',
    riskLevel: item.riskLevel ?? '-',
    status: item.status ?? '-'
  };
}

function mapCompositeProfile(item: any): AdminCompositeProfile {
  return {
    teacherId: item.teacherId ?? 'teacher-demo-1',
    averageScore: Number(item.studentEvaluation?.averageScore ?? 0),
    observationCount: Number(item.supervision?.observationCount ?? 0),
    highRiskCount: Number(item.parentFeedback?.highRiskCount ?? 0),
    selfEvaluationCount: Number(item.growth?.selfEvaluationCount ?? 0),
    riskSignals: Array.isArray(item.riskSignals) ? item.riskSignals : []
  };
}
