import test from 'node:test';
import assert from 'node:assert/strict';
import { TemplateCenterService } from './template-center.service.js';

test('creates indicators and questions within a tenant', () => {
  const service = new TemplateCenterService();

  const indicator = service.createIndicator({
    tenantId: 'demo',
    indicatorCode: 'student-engagement',
    indicatorName: '学生参与',
    description: '课堂参与和互动情况'
  });
  const question = service.createQuestion({
    tenantId: 'demo',
    title: '学生参与度如何',
    type: 'rating',
    indicatorId: indicator.id,
    maxScore: 5
  });

  assert.equal(indicator.indicatorCode, 'student-engagement');
  assert.equal(question.indicatorId, indicator.id);
  assert.equal(service.listQuestions('demo').some((item) => item.id === question.id), true);
});

test('creates a draft template, publishes it as version 1, and copies it', () => {
  const service = new TemplateCenterService();
  const indicator = service.createIndicator({
    tenantId: 'demo',
    indicatorCode: 'goal-clarity',
    indicatorName: '目标清晰',
    description: '课程目标表达清晰'
  });
  const question = service.createQuestion({
    tenantId: 'demo',
    title: '课程目标是否清晰',
    type: 'rating',
    indicatorId: indicator.id,
    maxScore: 5
  });

  const template = service.createTemplate({
    tenantId: 'demo',
    templateName: '课程评价模板',
    templateType: 'university',
    targetType: 'course',
    ownerOrgId: 'org-college-demo',
    anonymousMode: 'anonymous',
    allowTeacherAppend: true,
    questionIds: [question.id]
  });
  const published = service.publishTemplate('demo', template.id);
  const copied = service.copyTemplate('demo', template.id, '课程评价模板副本');

  assert.equal(template.status, 'draft');
  assert.equal(published.status, 'published');
  assert.equal(published.versionNo, 'v1');
  assert.equal(published.questions[0]?.id, question.id);
  assert.equal(copied.status, 'draft');
  assert.equal(copied.templateName, '课程评价模板副本');
});

test('prevents publishing templates without questions', () => {
  const service = new TemplateCenterService();
  const template = service.createTemplate({
    tenantId: 'demo',
    templateName: '空模板',
    templateType: 'common',
    targetType: 'teacher',
    ownerOrgId: 'org-school-demo',
    anonymousMode: 'anonymous',
    allowTeacherAppend: false,
    questionIds: []
  });

  assert.throws(() => service.publishTemplate('demo', template.id), /at least one question/);
});
