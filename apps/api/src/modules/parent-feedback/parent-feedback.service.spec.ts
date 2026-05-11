import test from 'node:test';
import assert from 'node:assert/strict';
import { ParentFeedbackService } from './parent-feedback.service.js';

test('submits parent feedback and lists it by tenant and student', () => {
  const service = new ParentFeedbackService();
  const feedback = service.submitFeedback({
    tenantId: 'demo',
    parentUserId: 'u-parent-1',
    studentId: 'student-demo-1',
    classOrgId: 'org-class-demo',
    category: 'course',
    rating: 4,
    content: '希望增加课堂互动反馈'
  });

  assert.equal(feedback.status, 'submitted');
  assert.equal(feedback.riskLevel, 'normal');
  assert.equal(service.listFeedback({ tenantId: 'demo', studentId: 'student-demo-1' }).length, 1);
  assert.equal(service.listFeedback({ tenantId: 'other' }).length, 0);
});

test('flags risky parent feedback and supports handling workflow', () => {
  const service = new ParentFeedbackService();
  const feedback = service.submitFeedback({
    tenantId: 'demo',
    parentUserId: 'u-parent-1',
    studentId: 'student-demo-1',
    classOrgId: 'org-class-demo',
    category: 'safety',
    rating: 1,
    content: '孩子被欺凌并且存在安全风险'
  });

  const handled = service.markHandled('demo', feedback.id, {
    handlerUserId: 'u-admin-1',
    result: '已转交年级组跟进'
  });

  assert.equal(feedback.riskLevel, 'high');
  assert.equal(handled.status, 'handled');
  assert.equal(handled.handlerUserId, 'u-admin-1');
});
