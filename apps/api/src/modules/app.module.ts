import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AuditController } from './audit/audit.controller.js';
import { AUDIT_LOG_REPOSITORY, createAuditLogRepository } from './audit/audit.repository.js';
import { AuditService } from './audit/audit.service.js';
import { EvaluationController } from './evaluation/evaluation.controller.js';
import { EvaluationService } from './evaluation/evaluation.service.js';
import { IamController } from './iam/iam.controller.js';
import { IamService } from './iam/iam.service.js';
import { ImprovementController } from './improvement/improvement.controller.js';
import { ImprovementService } from './improvement/improvement.service.js';
import { MasterDataController } from './master-data/master-data.controller.js';
import { MasterDataService } from './master-data/master-data.service.js';
import { NotificationController } from './notification/notification.controller.js';
import {
  createNotificationLogRepository,
  NOTIFICATION_LOG_REPOSITORY
} from './notification/notification.repository.js';
import { NotificationService } from './notification/notification.service.js';
import { OrgController } from './org/org.controller.js';
import { OrgService } from './org/org.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ReportsService } from './reports/reports.service.js';
import { TemplateCenterController } from './template-center/template-center.controller.js';
import { TemplateCenterService } from './template-center/template-center.service.js';
import { TenantContextService } from './tenant/tenant-context.service.js';
import { TenantController } from './tenant/tenant.controller.js';

@Module({
  controllers: [
    AuthController,
    AuditController,
    EvaluationController,
    IamController,
    ImprovementController,
    MasterDataController,
    NotificationController,
    OrgController,
    ReportsController,
    TemplateCenterController,
    TenantController
  ],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useFactory: createAuditLogRepository
    },
    AuditService,
    AuthService,
    EvaluationService,
    IamService,
    ImprovementService,
    MasterDataService,
    {
      provide: NOTIFICATION_LOG_REPOSITORY,
      useFactory: createNotificationLogRepository
    },
    NotificationService,
    OrgService,
    ReportsService,
    TemplateCenterService,
    TenantContextService
  ]
})
export class AppModule {}
