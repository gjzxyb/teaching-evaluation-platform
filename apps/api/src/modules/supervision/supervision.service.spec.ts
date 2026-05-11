import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from '../evaluation/evaluation.service.js';
import { ImprovementService } from '../improvement/improvement.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { SupervisionService } from './supervision.service.js';

function createService() {
  const reportsService = new ReportsService(new EvaluationService());
  return new SupervisionService(new ImprovementService(reportsService));
}

test('creates classroom observation tasks for supervisors', () => {
  const service = createService();
  const task = service.createObservationTask({
    tenantId: 'demo',
    courseId: 'course-demo-1',
    teacherId: 'teacher-demo-1',
    classOrgId: 'org-class-demo',
    supervisorUserId: 'u-supervisor-1',
    scheduledAt: '2026-06-01T09:00:00.000Z'
  });

  assert.equal(task.status, 'scheduled');
  assert.equal(service.listObservationTasks({ tenantId: 'demo', supervisorUserId: 'u-supervisor-1' }).length, 1);
  assert.equal(service.listObservationTasks({ tenantId: 'other' }).length, 0);
});

test('submits classroom observation and auto creates improvement ticket for low score', () => {
  const service = createService();
  const task = service.createObservationTask({
    tenantId: 'demo',
    courseId: 'course-demo-1',
    teacherId: 'teacher-demo-1',
    classOrgId: 'org-class-demo',
    supervisorUserId: 'u-supervisor-1',
    scheduledAt: '2026-06-01T09:00:00.000Z'
  });

  const observation = service.submitObservation({
    tenantId: 'demo',
    taskId: task.id,
    supervisorUserId: 'u-supervisor-1',
    scores: [
      { dimension: 'class-design', score: 2 },
      { dimension: 'student-engagement', score: 4 }
    ],
    comments: '课堂设计目标不够聚焦',
    improvementThreshold: 3,
    dueDate: '2026-06-15'
  });

  assert.equal(observation.status, 'submitted');
  assert.equal(observation.improvementTicketIds.length, 1);
  assert.equal(service.getObservation(task.tenantId, observation.id).scores[0]?.dimension, 'class-design');
});
