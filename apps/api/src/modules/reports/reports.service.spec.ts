import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from '../evaluation/evaluation.service.js';
import { ReportsService } from './reports.service.js';

function createSubmittedTask(sampleThreshold = 1, resultReleaseTime?: string) {
  const evaluationService = new EvaluationService();
  const task = evaluationService.createTask({
    tenantId: 'demo',
    taskName: '2026 春季课程评价',
    schoolYear: '2025-2026',
    termCode: 'spring',
    templateId: 'tpl-course-basic',
    sampleThreshold,
    resultReleaseTime,
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
      { questionId: 'q3', textValue: '课堂节奏清晰' }
    ]
  });
  return { evaluationService, task };
}

test('calculates completion and average score for a task', () => {
  const { evaluationService, task } = createSubmittedTask();
  const service = new ReportsService(evaluationService);

  const report = service.getCompletionReport('demo', task.id);
  const average = service.getAverageReport('demo', task.id);

  assert.equal(report.totalCount, 1);
  assert.equal(report.submittedCount, 1);
  assert.equal(report.completionRate, 1);
  assert.equal(average.visible, true);
  assert.equal(average.averageScore, 9);
});

test('calculates dimension score by template indicator', () => {
  const { evaluationService, task } = createSubmittedTask();
  const service = new ReportsService(evaluationService);

  const dimensions = service.getDimensionReport('demo', task.id);

  assert.deepEqual(dimensions.items.map((item) => item.indicatorKey), ['teaching-goal', 'class-control']);
  assert.equal(dimensions.items[0]?.averageScore, 4);
  assert.equal(dimensions.items[1]?.averageScore, 5);
});

test('hides score reports when sample threshold or release time blocks visibility', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const thresholdBlocked = createSubmittedTask(2);
  const releaseBlocked = createSubmittedTask(1, future);

  const thresholdReport = new ReportsService(thresholdBlocked.evaluationService)
    .getAverageReport('demo', thresholdBlocked.task.id);
  const releaseReport = new ReportsService(releaseBlocked.evaluationService)
    .getAverageReport('demo', releaseBlocked.task.id);

  assert.equal(thresholdReport.visible, false);
  assert.equal(thresholdReport.reason, 'sample-threshold');
  assert.equal(releaseReport.visible, false);
  assert.equal(releaseReport.reason, 'not-released');
});
