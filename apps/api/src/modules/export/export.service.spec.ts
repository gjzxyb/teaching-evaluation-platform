import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from '../storage/storage.service.js';
import { ExportService } from './export.service.js';

test('creates a completed report export job backed by a storage object', () => {
  const storageService = new StorageService();
  const service = new ExportService(storageService);

  const job = service.createReportExport({
    tenantId: 'demo',
    requesterUserId: 'u-admin-1',
    taskId: 'task-1',
    reportType: 'completion',
    format: 'xlsx',
    payload: { submittedCount: 10, totalCount: 12 }
  });

  assert.equal(job.status, 'completed');
  assert.equal(job.format, 'xlsx');
  assert.equal(job.reportType, 'completion');
  assert.match(job.filename, /task-1-completion\.xlsx$/);
  assert.ok(job.objectId);
  assert.equal(storageService.listObjects({ tenantId: 'demo' })[0]?.id, job.objectId);
});

test('lists export jobs by tenant, requester, and task', () => {
  const service = new ExportService(new StorageService());
  service.createReportExport({
    tenantId: 'demo',
    requesterUserId: 'u-admin-1',
    taskId: 'task-1',
    reportType: 'dimensions',
    format: 'csv',
    payload: { items: [] }
  });
  service.createReportExport({
    tenantId: 'other',
    requesterUserId: 'u-admin-2',
    taskId: 'task-1',
    reportType: 'dimensions',
    format: 'csv',
    payload: { items: [] }
  });

  const jobs = service.listExportJobs({
    tenantId: 'demo',
    requesterUserId: 'u-admin-1',
    taskId: 'task-1'
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.tenantId, 'demo');
});
