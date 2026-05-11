import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  NOTIFICATION_LOG_REPOSITORY,
  NotificationLogRepository
} from './notification.repository.js';

export type NotificationChannel = 'in_app' | 'sms' | 'email' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationLog {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  recipientUserId: string;
  bizType: string;
  bizId: string;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface CreateNotificationLog {
  tenantId: string;
  channel: NotificationChannel;
  recipientUserId: string;
  bizType: string;
  bizId: string;
  status?: NotificationStatus;
  payload: Record<string, unknown>;
}

export interface NotificationQuery {
  tenantId?: string;
  bizType?: string;
  bizId?: string;
  recipientUserId?: string;
  status?: NotificationStatus;
}

@Injectable()
export class NotificationService {
  private readonly logs: NotificationLog[] = [];

  constructor(
    @Optional()
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly repository?: NotificationLogRepository
  ) {}

  record(input: CreateNotificationLog): NotificationLog {
    const log: NotificationLog = {
      id: `notify-${this.logs.length + 1}`,
      tenantId: input.tenantId,
      channel: input.channel,
      recipientUserId: input.recipientUserId,
      bizType: input.bizType,
      bizId: input.bizId,
      status: input.status ?? 'sent',
      payload: input.payload,
      createdAt: new Date().toISOString()
    };
    this.logs.push(log);
    void Promise.resolve(this.repository?.save(log)).catch(() => undefined);
    return { ...log, payload: { ...log.payload } };
  }

  list(query: NotificationQuery = {}): NotificationLog[] {
    return this.logs
      .filter((log) => !query.tenantId || log.tenantId === query.tenantId)
      .filter((log) => !query.bizType || log.bizType === query.bizType)
      .filter((log) => !query.bizId || log.bizId === query.bizId)
      .filter((log) => !query.recipientUserId || log.recipientUserId === query.recipientUserId)
      .filter((log) => !query.status || log.status === query.status)
      .map((log) => ({ ...log, payload: { ...log.payload } }));
  }
}
