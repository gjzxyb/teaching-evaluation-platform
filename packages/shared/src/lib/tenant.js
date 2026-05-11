export function resolveTenantContext(input) {
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
export function assertTenantOwnership(actualTenantId, expectedTenantId) {
    if (actualTenantId !== expectedTenantId) {
        throw new Error(`Tenant mismatch: expected ${expectedTenantId}, got ${actualTenantId}`);
    }
}
