export type UserRole =
  | 'super-admin'
  | 'school-admin'
  | 'teacher'
  | 'student'
  | 'supervisor'
  | 'parent';

export type AuthSource = 'local' | 'sso';

export interface TenantSummary {
  id: string;
  code: string;
  name: string;
  deploymentMode: 'private' | 'saas';
  status?: 'active' | 'disabled';
}

export interface UserSummary {
  id: string;
  tenantId: string;
  displayName: string;
  userType: 'admin' | 'teacher' | 'student' | 'parent';
  roles: UserRole[];
}

export interface PlatformSession {
  token: string;
  source: AuthSource;
  tenant: TenantSummary;
  user: UserSummary;
  permissions: import('./iam.js').PermissionCode[];
}

export interface EvaluationQuestion {
  id: string;
  title: string;
  type: 'single' | 'multi' | 'text' | 'rating';
  indicatorKey: string;
  maxScore?: number;
}

export interface EvaluationTemplate {
  id: string;
  tenantId: string;
  templateName: string;
  anonymousMode: 'anonymous' | 'semi' | 'real';
  targetType: 'course' | 'classroom' | 'teacher' | 'class';
  questions: EvaluationQuestion[];
}

export interface EvaluationTask {
  id: string;
  tenantId: string;
  taskName: string;
  schoolYear: string;
  termCode: string;
  templateId: string;
  sampleThreshold: number;
  resultReleaseTime?: string;
  status: 'draft' | 'running' | 'closed';
}

export interface EvaluationInstance {
  id: string;
  tenantId: string;
  taskId: string;
  evaluatorUserId: string;
  targetTeacherId: string;
  targetId: string;
  status: 'pending' | 'draft' | 'submitted' | 'expired';
}

export interface EvaluationAnswerInput {
  questionId: string;
  scoreValue?: number;
  optionValue?: string | string[];
  textValue?: string;
}

export interface EvaluationResponse {
  instance: EvaluationInstance;
  status: 'draft' | 'submitted';
  totalScore: number;
  answers: EvaluationAnswerInput[];
  submittedAt?: string;
}

export interface TeacherReport {
  tenantId: string;
  teacherId: string;
  submittedCount: number;
  averageScore: number;
  keywords: string[];
}

export interface SessionTokenPayload {
  sub: string;
  tenantId: string;
  roles: UserRole[];
}

export function issueSessionToken(payload: SessionTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function buildInitialInstances(
  task: EvaluationTask,
  template: EvaluationTemplate,
  students: UserSummary[]
): EvaluationInstance[] {
  return students
    .filter((user) => user.tenantId === task.tenantId && user.roles.includes('student'))
    .map((user, index) => ({
      id: `${task.id}-instance-${index + 1}`,
      tenantId: task.tenantId,
      taskId: task.id,
      evaluatorUserId: user.id,
      targetTeacherId: 'teacher-demo-1',
      targetId: `${template.targetType}-demo-1`,
      status: 'pending'
    }));
}

export function createDraftResponse(
  instance: EvaluationInstance,
  template: EvaluationTemplate,
  answers: EvaluationAnswerInput[]
): EvaluationResponse {
  validateAnswers(template, answers);
  return {
    instance: { ...instance, status: 'draft' },
    status: 'draft',
    totalScore: computeTotalScore(answers),
    answers
  };
}

export function submitResponse(
  instance: EvaluationInstance,
  template: EvaluationTemplate,
  answers: EvaluationAnswerInput[]
): EvaluationResponse {
  validateAnswers(template, answers);
  return {
    instance: { ...instance, status: 'submitted' },
    status: 'submitted',
    totalScore: computeTotalScore(answers),
    answers,
    submittedAt: new Date().toISOString()
  };
}

export function aggregateTeacherReport(
  tenantId: string,
  teacherId: string,
  responses: EvaluationResponse[]
): TeacherReport {
  const submitted = responses.filter((response) => response.status === 'submitted');
  const totalScore = submitted.reduce((sum, response) => sum + response.totalScore, 0);
  const allTexts = submitted.flatMap((response) =>
    response.answers.map((answer) => answer.textValue ?? '').filter(Boolean)
  );

  return {
    tenantId,
    teacherId,
    submittedCount: submitted.length,
    averageScore: submitted.length === 0 ? 0 : Number((totalScore / submitted.length).toFixed(2)),
    keywords: extractKeywords(allTexts)
  };
}

function computeTotalScore(answers: EvaluationAnswerInput[]): number {
  return answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0);
}

function validateAnswers(template: EvaluationTemplate, answers: EvaluationAnswerInput[]) {
  const questionIds = new Set(template.questions.map((question) => question.id));
  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      throw new Error(`Unknown question: ${answer.questionId}`);
    }
  }
}

function extractKeywords(comments: string[]): string[] {
  const counts = new Map<string, number>();
  for (const comment of comments) {
    for (const word of comment.split(/[\s,，。；;！!？?]+/u)) {
      const normalized = word.trim();
      if (normalized.length < 2) {
        continue;
      }
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([word]) => word);
}
