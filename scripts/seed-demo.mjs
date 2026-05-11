const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
const tenantId = process.env.TENANT_ID ?? 'demo';

const response = await fetch(`${apiBaseUrl}/eval/demo/seed?tenantId=${encodeURIComponent(tenantId)}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}'
});

const body = await response.text();
if (!response.ok) {
  console.error(`Demo seed failed: HTTP ${response.status}`);
  console.error(body);
  process.exit(1);
}

const envelope = JSON.parse(body);
if (envelope.code !== 0) {
  console.error(`Demo seed failed: ${envelope.message}`);
  process.exit(1);
}

console.log(`Demo task ready: ${envelope.data.task.id}`);
console.log(`Generated instances: ${envelope.data.instances.length}`);
