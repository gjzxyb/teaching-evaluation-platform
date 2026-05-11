import test from 'node:test';
import assert from 'node:assert/strict';
import { NotificationLog, NotificationService } from './notification.service.js';

test('records and filters notification logs by tenant and business target', () => {
  const service = new NotificationService();
  service.record({
    tenantId: 'demo',
    channel: 'in_app',
    recipientUserId: 'u-student-1',
    bizType: 'eval.task.remind',
    bizId: 'task-1',
    status: 'sent',
    payload: { message: '请完成评价' }
  });
  service.record({
    tenantId: 'other',
    channel: 'in_app',
    recipientUserId: 'u-student-2',
    bizType: 'eval.task.remind',
    bizId: 'task-1',
    status: 'sent',
    payload: {}
  });

  const logs = service.list({ tenantId: 'demo', bizType: 'eval.task.remind', bizId: 'task-1' });

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.recipientUserId, 'u-student-1');
});

test('persists notification logs through the optional repository', () => {
  const saved: NotificationLog[] = [];
  const service = new NotificationService({
    save(log) {
      saved.push(log);
    }
  });

  const log = service.record({
    tenantId: 'demo',
    channel: 'email',
    recipientUserId: 'u-teacher-1',
    bizType: 'improvement.ticket.created',
    bizId: 'ticket-1',
    payload: { title: '整改任务' }
  });

  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.id, log.id);
  assert.equal(saved[0]?.status, 'sent');
  assert.equal(service.list({ tenantId: 'demo', status: 'sent' }).length, 1);
});
