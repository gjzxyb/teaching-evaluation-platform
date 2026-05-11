import test from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisService } from './analysis.service.js';

test('aggregates keywords from text comments within a tenant and task', () => {
  const service = new AnalysisService();
  const result = service.analyzeTexts({
    tenantId: 'demo',
    taskId: 'task-1',
    comments: ['讲解 清晰 互动 充分', '课堂 互动 清晰', '作业 反馈 及时']
  });

  assert.equal(result.tenantId, 'demo');
  assert.equal(result.taskId, 'task-1');
  assert.deepEqual(result.keywords.slice(0, 2), [
    { word: '清晰', count: 2 },
    { word: '互动', count: 2 }
  ]);
  assert.equal(result.provider, 'keyword-v1');
});

test('saves and returns manual summaries separately from keyword analysis', () => {
  const service = new AnalysisService();
  const summary = service.saveManualSummary({
    tenantId: 'demo',
    taskId: 'task-1',
    authorUserId: 'u-admin-1',
    summary: '学生普遍认可课堂互动，但希望反馈更及时。'
  });

  assert.equal(summary.source, 'manual');
  assert.equal(service.listSummaries({ tenantId: 'demo', taskId: 'task-1' })[0]?.id, summary.id);
  assert.equal(service.listSummaries({ tenantId: 'other' }).length, 0);
});
