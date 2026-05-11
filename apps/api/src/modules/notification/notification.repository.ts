import { queryPostgres } from '../../infrastructure/database/postgres.js';
import type { NotificationLog } from './notification.service.js';

export const NOTIFICATION_LOG_REPOSITORY = Symbol('NOTIFICATION_LOG_REPOSITORY');

export interface NotificationLogRepository {
  save(log: NotificationLog): void | Promise<void>;
}

export class PostgresNotificationLogRepository implements NotificationLogRepository {
  async save(log: NotificationLog): Promise<void> {
    await queryPostgres(
      `insert into notify_log
        (id, tenant_id, channel, recipient_user_id, biz_type, biz_id, status, payload, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
      [
        log.id,
        log.tenantId,
        log.channel,
        log.recipientUserId,
        log.bizType,
        log.bizId,
        log.status,
        JSON.stringify(log.payload),
        log.createdAt
      ]
    );
  }
}

export function createNotificationLogRepository(): NotificationLogRepository | undefined {
  return process.env.DATABASE_URL ? new PostgresNotificationLogRepository() : undefined;
}
