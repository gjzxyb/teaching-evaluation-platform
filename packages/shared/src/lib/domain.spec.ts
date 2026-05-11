import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateTeacherReport,
  buildInitialInstances,
  createDraftResponse,
  submitResponse,
  type EvaluationTemplate,
  type UserSummary
} from './domain.js';

const template: EvaluationTemplate = {
  id: 'template-1',
  tenantId: 'demo',
  templateName: '基础模板',
  anonymousMode: 'anonymous',
  targetType: 'course',
  questions: [
    { id: 'q1', title: '目标清晰', type: 'rating', indicatorKey: 'goal', maxScore: 5 },
    { id: 'q2', title: '文本建议', type: 'text', indicatorKey: 'comment' }
  ]
};

const students: UserSummary[] = [
  {
    id: 'student-1',
    tenantId: 'demo',
    displayName: '学生一',
    userType: 'student',
    roles: ['student']
  }
];

test('builds instances for student evaluators in the same tenant', () => {
  const instances = buildInitialInstances(
    {
      id: 'task-1',
      tenantId: 'demo',
      taskName: '任务',
      schoolYear: '2025-2026',
      termCode: 'spring',
      templateId: 'template-1',
      sampleThreshold: 2,
      status: 'running'
    },
    template,
    students
  );

  assert.equal(instances.length, 1);
  assert.equal(instances[0]?.evaluatorUserId, 'student-1');
});

test('creates draft and submitted responses and aggregates teacher report keywords', () => {
  const [instance] = buildInitialInstances(
    {
      id: 'task-2',
      tenantId: 'demo',
      taskName: '任务',
      schoolYear: '2025-2026',
      termCode: 'spring',
      templateId: 'template-1',
      sampleThreshold: 2,
      status: 'running'
    },
    template,
    students
  );

  const draft = createDraftResponse(instance, template, [
    { questionId: 'q1', scoreValue: 5 },
    { questionId: 'q2', textValue: '讲解 清晰' }
  ]);
  assert.equal(draft.status, 'draft');

  const submitted = submitResponse(instance, template, [
    { questionId: 'q1', scoreValue: 5 },
    { questionId: 'q2', textValue: '讲解 清晰' }
  ]);
  const report = aggregateTeacherReport('demo', instance.targetTeacherId, [submitted]);

  assert.equal(report.averageScore, 5);
  assert.deepEqual(report.keywords, ['讲解', '清晰']);
});
