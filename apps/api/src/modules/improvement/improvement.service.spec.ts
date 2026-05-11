import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationService } from '../evaluation/evaluation.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { ImprovementService } from './improvement.service.js';

function createTaskWithLowScore() {
  const evaluationService = new EvaluationService();
  const task = evaluationService.createTask({
    tenantId: 'demo',
    taskName: '2026 春季课程评价',
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
      { questionId: 'q1', scoreValue: 3 },
      { questionId: 'q2', scoreValue: 5 },
      { questionId: 'q3', textValue: '目标说明还需要更清楚' }
    ]
  });
  return { task, reportsService: new ReportsService(evaluationService) };
}

test('automatically creates improvement tickets for low score dimensions', () => {
  const { task, reportsService } = createTaskWithLowScore();
  const service = new ImprovementService(reportsService);

  const tickets = service.generateTicketsFromTask('demo', task.id, {
    threshold: 4,
    ownerUserId: 'u-teacher-1',
    dueDate: '2026-06-30'
  });

  assert.equal(tickets.length, 1);
  assert.equal(tickets[0]?.sourceType, 'report');
  assert.equal(tickets[0]?.problemDesc.includes('teaching-goal'), true);
  assert.equal(tickets[0]?.status, 'open');
});

test('updates root cause and action plan, reviews, and closes a ticket', () => {
  const { task, reportsService } = createTaskWithLowScore();
  const service = new ImprovementService(reportsService);
  const [ticket] = service.generateTicketsFromTask('demo', task.id, {
    threshold: 4,
    ownerUserId: 'u-teacher-1',
    dueDate: '2026-06-30'
  });

  const processing = service.updateActionPlan('demo', ticket.id, {
    rootCause: '目标呈现不够具体',
    actionPlan: '下次课前展示分层目标和达成标准'
  });
  const reviewed = service.reviewTicket('demo', ticket.id, '复评通过');
  const closed = service.closeTicket('demo', ticket.id);

  assert.equal(processing.status, 'processing');
  assert.equal(reviewed.status, 'done');
  assert.equal(reviewed.reviewResult, '复评通过');
  assert.equal(closed.status, 'closed');
});
