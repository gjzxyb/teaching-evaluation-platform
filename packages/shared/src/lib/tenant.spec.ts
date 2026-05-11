import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTenantOwnership, resolveTenantContext } from './tenant.js';

test('resolves tenant from header before host fallback', () => {
  const resolved = resolveTenantContext({
    tenantId: 'school-a',
    host: 'school-b.example.com'
  });

  assert.deepEqual(resolved, {
    tenantId: 'school-a',
    source: 'header'
  });
});

test('throws when tenant ownership check fails', () => {
  assert.throws(
    () => assertTenantOwnership('tenant-a', 'tenant-b'),
    /Tenant mismatch/
  );
});
