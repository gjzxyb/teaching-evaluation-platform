import { Inject, Injectable, Optional } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY, AuditLogRepository } from './audit.repository.js';

export interface AuditEvent {
  action: string;
  actorId: string;
  tenantId: string;
  target: string;
}

export interface AuditQuery {
  tenantId?: string;
  action?: string;
  actorId?: string;
  target?: string;
}

@Injectable()
export class AuditService {
  private readonly events: AuditEvent[] = [];

  constructor(
    @Optional()
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly repository?: AuditLogRepository
  ) {}

  record(event: AuditEvent) {
    this.events.push(event);
    void Promise.resolve(this.repository?.save(event)).catch(() => undefined);
  }

  list(query: AuditQuery = {}) {
    return this.events
      .filter((event) => !query.tenantId || event.tenantId === query.tenantId)
      .filter((event) => !query.action || event.action === query.action)
      .filter((event) => !query.actorId || event.actorId === query.actorId)
      .filter((event) => !query.target || event.target === query.target)
      .map((event) => ({ ...event }));
  }
}
