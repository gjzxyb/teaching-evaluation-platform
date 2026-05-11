import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from '../evaluation/evaluation.service.js';
import { ImprovementService } from '../improvement/improvement.service.js';
import { ParentFeedbackService } from '../parent-feedback/parent-feedback.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { SupervisionService } from '../supervision/supervision.service.js';
import { TeacherWorkbenchService } from '../teacher/teacher-workbench.service.js';
import { CompositeAnalysisService } from './composite-analysis.service.js';

function createServices() {
  const evaluationService = new EvaluationService();
  const reportsService = new ReportsService(evaluationService);
  const improvementService = new ImprovementService(reportsService);
  const supervisionService = new SupervisionService(improvementService);
  const parentFeedbackService = new ParentFeedbackService();
  const teacherWorkbenchService = new TeacherWorkbenchService(reportsService);
  const compositeService = new CompositeAnalysisService(
    reportsService,
    supervisionService,
    parentFeedbackService,
    teacherWorkbenchService
  );
  return {
    compositeService,
    evaluationService,
    supervisionService,
    parentFeedbackService,
    teacherWorkbenchService
  };
}

function submitStudentEvaluation(evaluationService: EvaluationService) {
  const task = evaluationService.createTask({
    tenantId: 'demo',
    taskName: '综合分析任务',
    schoolYear: '2025-2026',
    termCode: 'spring',
    templateId: 'tpl-course-basic',
    sampleThreshold: 1,
    createdBy: 'u-admin-1'
  });
  evaluationService.publishTask('demo', task.id);
  const [instance] = evaluationService.listTaskInstances('demo', task.id);
  evaluationService.submit(instance.id, {
    tenantId: 'demo',
    evaluatorUserId: instance.evaluatorUserId,
    answers: [
      { questionId: 'q1', scoreValue: 4 },
      { questionId: 'q2', scoreValue: 5 },
      { questionId: 'q3', textValue: '课堂 清晰' }
    ]
  });
}

test('builds teacher composite profile from evaluation, observation, parent feedback, and self review', () => {
  const {
    compositeService,
    evaluationService,
    supervisionService,
    parentFeedbackService,
    teacherWorkbenchService
  } = createServices();
  submitStudentEvaluation(evaluationService);
  const observationTask = supervisionService.createObservationTask({
    tenantId: 'demo',
    courseId: 'course-demo-1',
    teacherId: 'teacher-demo-1',
    classOrgId: 'org-class-demo',
    supervisorUserId: 'u-supervisor-1',
    scheduledAt: '2026-06-01T09:00:00.000Z'
  });
  supervisionService.submitObservation({
    tenantId: 'demo',
    taskId: observationTask.id,
    supervisorUserId: 'u-supervisor-1',
    scores: [{ dimension: 'class-design', score: 2 }],
    comments: '目标不够聚焦',
    improvementThreshold: 3,
    dueDate: '2026-06-15'
  });
  parentFeedbackService.submitFeedback({
    tenantId: 'demo',
    parentUserId: 'u-parent-1',
    studentId: 'student-demo-1',
    classOrgId: 'org-class-demo',
    category: 'safety',
    rating: 1,
    content: '存在安全风险'
  });
  teacherWorkbenchService.createSelfEvaluation({
    tenantId: 'demo',
    teacherId: 'teacher-demo-1',
    taskId: 'task-self-1',
    strengths: '表达清晰',
    weaknesses: '互动不足',
    improvementPlan: '增加讨论'
  });

  const profile = compositeService.getTeacherCompositeProfile('demo', 'teacher-demo-1');

  assert.equal(profile.teacherId, 'teacher-demo-1');
  assert.equal(profile.studentEvaluation.averageScore, 9);
  assert.equal(profile.supervision.observationCount, 1);
  assert.deepEqual(profile.supervision.lowScoreDimensions, ['class-design']);
  assert.equal(profile.parentFeedback.highRiskCount, 1);
  assert.equal(profile.growth.selfEvaluationCount, 1);
  assert.equal(profile.riskSignals.length, 2);
});
