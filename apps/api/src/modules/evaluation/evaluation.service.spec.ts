import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from './evaluation.service.js';

test('creates task, saves draft, and submits a student response', () => {
  const service = new EvaluationService();

  const task = service.createTask({
    tenantId: 'demo',
    taskName: '2026 春季课程评价',
    schoolYear: '2025-2026',
    termCode: 'spring',
    templateId: 'tpl-course-basic',
    sampleThreshold: 2,
    createdBy: 'u-admin-1'
  });

  assert.equal(task.status, 'draft');
  service.publishTask('demo', task.id);

  const [instance] = service.getMyTasks('u-student-1');
  assert.equal(instance.status, 'pending');
  const detail = service.getInstanceDetail('demo', instance.id, 'u-student-1');
  assert.equal(detail.template.questions.length, 3);
  assert.equal(detail.draft, undefined);

  const draft = service.saveDraft(instance.id, {
    tenantId: 'demo',
    evaluatorUserId: 'u-student-1',
    answers: [
      { questionId: 'q1', scoreValue: 4 },
      { questionId: 'q2', scoreValue: 5 },
      { questionId: 'q3', textValue: '节奏清晰' }
    ]
  });

  assert.equal(draft.status, 'draft');
  assert.equal(service.getDraft('demo', instance.id, 'u-student-1')?.answers.length, 3);

  const response = service.submit(instance.id, {
    tenantId: 'demo',
    evaluatorUserId: 'u-student-1',
    answers: [
      { questionId: 'q1', scoreValue: 4 },
      { questionId: 'q2', scoreValue: 5 },
      { questionId: 'q3', textValue: '节奏清晰' }
    ]
  });

  assert.equal(response.status, 'submitted');
  assert.equal(response.totalScore, 9);
  assert.equal(response.instance.status, 'submitted');
  assert.equal(service.getHistory('demo', 'u-student-1').length, 1);
  assert.throws(
    () => service.submit(instance.id, {
      tenantId: 'demo',
      evaluatorUserId: 'u-student-1',
      answers: [{ questionId: 'q1', scoreValue: 5 }]
    }),
    /already submitted/
  );
});

test('creates a draft task, publishes it to generate instances, then closes it', () => {
  const service = new EvaluationService();

  const task = service.createTask({
    tenantId: 'demo',
    taskName: '期末课程评价',
    schoolYear: '2025-2026',
    termCode: 'spring',
    templateId: 'tpl-course-basic',
    sampleThreshold: 2,
    createdBy: 'u-admin-1'
  });

  assert.equal(task.status, 'draft');
  assert.equal(service.listTaskInstances('demo', task.id).length, 0);

  const published = service.publishTask('demo', task.id);
  assert.equal(published.status, 'running');
  assert.equal(service.getTask('demo', task.id).status, 'running');
  assert.equal(service.listTasks('demo').some((item) => item.id === task.id), true);
  assert.equal(service.listTaskInstances('demo', task.id).length, 1);

  const reminded = service.remindTask('demo', task.id);
  assert.equal(reminded.pendingCount, 1);

  const closed = service.closeTask('demo', task.id);
  assert.equal(closed.status, 'closed');
  const [expired] = service.listTaskInstances('demo', task.id);
  assert.equal(expired.status, 'expired');
  assert.throws(
    () => service.submit(expired.id, {
      tenantId: 'demo',
      evaluatorUserId: 'u-student-1',
      answers: [{ questionId: 'q1', scoreValue: 5 }]
    }),
    /Expired instance/
  );
});

test('rejects creating a task from an unpublished template', () => {
  const service = new EvaluationService({
    getTemplate: () => ({
      id: 'tpl-draft',
      tenantId: 'demo',
      templateName: '草稿模板',
      anonymousMode: 'anonymous',
      targetType: 'course',
      questions: [],
      templateType: 'common',
      ownerOrgId: 'org-school-demo',
      versionNo: 'draft',
      status: 'draft',
      allowTeacherAppend: false
    })
  });

  assert.throws(
    () => service.createTask({
      tenantId: 'demo',
      taskName: '草稿任务',
      schoolYear: '2025-2026',
      termCode: 'spring',
      templateId: 'tpl-draft',
      sampleThreshold: 2,
      createdBy: 'u-admin-1'
    }),
    /published template/
  );
});
