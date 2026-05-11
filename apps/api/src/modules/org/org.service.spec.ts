import test from 'node:test';
import assert from 'node:assert/strict';
import { OrgService } from './org.service.js';

test('returns a tenant-scoped organization tree', () => {
  const service = new OrgService();
  const tree = service.getOrgTree('demo');

  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.orgName, 'Demo School');
  assert.ok(tree[0]?.children.some((item) => item.orgType === 'college'));
});

test('creates a child organization under an existing parent', () => {
  const service = new OrgService();
  const org = service.createOrgUnit({
    tenantId: 'demo',
    parentId: 'org-school-demo',
    orgType: 'teaching_group',
    orgCode: 'math-group',
    orgName: '数学教研组'
  });

  assert.equal(org.parentId, 'org-school-demo');
  assert.ok(service.getOrgTree('demo')[0]?.children.some((item) => item.id === org.id));
});
