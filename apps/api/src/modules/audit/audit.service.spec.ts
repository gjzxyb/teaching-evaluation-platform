import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditEvent, AuditService } from './audit.service.js';

test('records audit events and filters by tenant, action, and target', () => {
  const service = new AuditService();
  service.record({
    action: 'eval.response.submit',
    actorId: 'u-student-1',
    tenantId: 'demo',
    target: 'instance-1'
  });
  service.record({
    action: 'eval.response.submit',
    actorId: 'u-student-2',
    tenantId: 'other',
    target: 'instance-1'
  });

  const logs = service.list({
    tenantId: 'demo',
    action: 'eval.response.submit',
    target: 'instance-1'
  });

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.actorId, 'u-student-1');
});

test('persists audit events through the optional repository', () => {
  const saved: AuditEvent[] = [];
  const service = new AuditService({
    save(event) {
      saved.push(event);
    }
  });

  service.record({
    action: 'template.publish',
    actorId: 'u-admin-1',
    tenantId: 'demo',
    target: 'template-1'
  });

  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.action, 'template.publish');
  assert.equal(service.list({ tenantId: 'demo' }).length, 1);
});
