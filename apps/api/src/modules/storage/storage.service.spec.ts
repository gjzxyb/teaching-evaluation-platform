import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from './storage.service.js';

test('creates an upload target and records object metadata within tenant boundary', () => {
  const service = new StorageService();
  const target = service.createUploadTarget({
    tenantId: 'demo',
    ownerUserId: 'u-admin-1',
    filename: 'report.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024
  });

  assert.equal(target.provider, 'local');
  assert.match(target.objectKey, /^demo\//);
  assert.equal(service.listObjects({ tenantId: 'demo' })[0]?.id, target.objectId);
  assert.equal(service.listObjects({ tenantId: 'other' }).length, 0);
});

test('marks an object as deleted without removing audit metadata', () => {
  const service = new StorageService();
  const target = service.createUploadTarget({
    tenantId: 'demo',
    ownerUserId: 'u-admin-1',
    filename: 'attachment.pdf',
    contentType: 'application/pdf',
    size: 2048
  });

  const deleted = service.deleteObject('demo', target.objectId);

  assert.equal(deleted.status, 'deleted');
  assert.equal(service.listObjects({ tenantId: 'demo', status: 'available' }).length, 0);
  assert.equal(service.listObjects({ tenantId: 'demo', status: 'deleted' })[0]?.id, target.objectId);
});
