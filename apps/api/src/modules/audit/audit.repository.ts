import { queryPostgres } from '../../infrastructure/database/postgres.js';
import type { AuditEvent } from './audit.service.js';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface AuditLogRepository {
  save(event: AuditEvent): void | Promise<void>;
}

export class PostgresAuditLogRepository implements AuditLogRepository {
  async save(event: AuditEvent): Promise<void> {
    await queryPostgres(
      `insert into audit_log
        (id, tenant_id, actor_user_id, action, module, target_type, target_id, detail, trace_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
      [
        `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        event.tenantId,
        event.actorId,
        event.action,
        event.action.split('.')[0] ?? 'system',
        'resource',
        event.target,
        JSON.stringify({ target: event.target }),
        null
      ]
    );
  }
}

export function createAuditLogRepository(): AuditLogRepository | undefined {
  return process.env.DATABASE_URL ? new PostgresAuditLogRepository() : undefined;
}
