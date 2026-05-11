export interface TenantContextInput {
  tenantId?: string;
  host?: string;
}

export interface ResolvedTenantContext {
  tenantId: string;
  source: 'header' | 'host';
}

export function resolveTenantContext(input: TenantContextInput): ResolvedTenantContext {
  if (input.tenantId) {
    return { tenantId: input.tenantId, source: 'header' };
  }

  if (input.host) {
    const subdomain = input.host.split('.')[0];
    if (subdomain && subdomain !== 'localhost') {
      return { tenantId: subdomain, source: 'host' };
    }
  }

  return { tenantId: 'demo', source: 'host' };
}

export function assertTenantOwnership(actualTenantId: string, expectedTenantId: string) {
  if (actualTenantId !== expectedTenantId) {
    throw new Error(`Tenant mismatch: expected ${expectedTenantId}, got ${actualTenantId}`);
  }
}
