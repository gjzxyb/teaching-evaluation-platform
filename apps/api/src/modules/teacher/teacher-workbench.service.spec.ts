import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from '../evaluation/evaluation.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { TeacherWorkbenchService } from './teacher-workbench.service.js';

function createVisibleTeacherReport() {
  const evaluationService = new EvaluationService();
  const task = evaluationService.createTask({
    tenantId: 'demo',
    taskName: '教师端结果任务',
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
      { questionId: 'q3', textValue: '课堂 清晰 互动' }
    ]
  });
  return { reportsService: new ReportsService(evaluationService), task };
}

test('returns released teacher result overview for a tenant scoped teacher', () => {
  const { reportsService } = createVisibleTeacherReport();
  const service = new TeacherWorkbenchService(reportsService);

  const overview = service.getResultOverview('demo', 'teacher-demo-1');

  assert.equal(overview.teacherId, 'teacher-demo-1');
  assert.equal(overview.submittedCount, 1);
  assert.equal(overview.averageScore, 9);
  assert.deepEqual(overview.keywords, ['课堂', '清晰', '互动']);
});

test('records teacher self evaluation and exposes it in growth archive', () => {
  const { reportsService } = createVisibleTeacherReport();
  const service = new TeacherWorkbenchService(reportsService);

  const selfReview = service.createSelfEvaluation({
    tenantId: 'demo',
    teacherId: 'teacher-demo-1',
    taskId: 'task-self-1',
    strengths: '课堂目标清晰',
    weaknesses: '互动覆盖面不足',
    improvementPlan: '增加分组讨论'
  });

  const archive = service.getGrowthArchive('demo', 'teacher-demo-1');

  assert.equal(selfReview.status, 'submitted');
  assert.equal(archive.teacherId, 'teacher-demo-1');
  assert.equal(archive.selfEvaluations.length, 1);
  assert.equal(archive.selfEvaluations[0]?.improvementPlan, '增加分组讨论');
});
