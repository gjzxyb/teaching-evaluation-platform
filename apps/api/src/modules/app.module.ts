import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis/analysis.controller.js';
import { AnalysisService } from './analysis/analysis.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AuditController } from './audit/audit.controller.js';
import { AUDIT_LOG_REPOSITORY, createAuditLogRepository } from './audit/audit.repository.js';
import { AuditService } from './audit/audit.service.js';
import { CompositeAnalysisController } from './composite-analysis/composite-analysis.controller.js';
import { CompositeAnalysisService } from './composite-analysis/composite-analysis.service.js';
import { EvaluationController } from './evaluation/evaluation.controller.js';
import { EvaluationService } from './evaluation/evaluation.service.js';
import { ExportController } from './export/export.controller.js';
import { ExportService } from './export/export.service.js';
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
import { ParentFeedbackController } from './parent-feedback/parent-feedback.controller.js';
import { ParentFeedbackService } from './parent-feedback/parent-feedback.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ReportsService } from './reports/reports.service.js';
import { StorageController } from './storage/storage.controller.js';
import { StorageService } from './storage/storage.service.js';
import { SupervisionController } from './supervision/supervision.controller.js';
import { SupervisionService } from './supervision/supervision.service.js';
import { TemplateCenterController } from './template-center/template-center.controller.js';
import { TemplateCenterService } from './template-center/template-center.service.js';
import { TeacherWorkbenchController } from './teacher/teacher-workbench.controller.js';
import { TeacherWorkbenchService } from './teacher/teacher-workbench.service.js';
import { TenantContextService } from './tenant/tenant-context.service.js';
import { TenantController } from './tenant/tenant.controller.js';

@Module({
  controllers: [
    AnalysisController,
    AuthController,
    AuditController,
    CompositeAnalysisController,
    EvaluationController,
    ExportController,
    IamController,
    ImprovementController,
    MasterDataController,
    NotificationController,
    OrgController,
    ParentFeedbackController,
    ReportsController,
    StorageController,
    SupervisionController,
    TemplateCenterController,
    TeacherWorkbenchController,
    TenantController
  ],
  providers: [
    AnalysisService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useFactory: createAuditLogRepository
    },
    {
      provide: AuditService,
      useFactory: (repository) => new AuditService(repository),
      inject: [AUDIT_LOG_REPOSITORY]
    },
    AuthService,
    CompositeAnalysisService,
    EvaluationService,
    ExportService,
    IamService,
    ImprovementService,
    MasterDataService,
    {
      provide: NOTIFICATION_LOG_REPOSITORY,
      useFactory: createNotificationLogRepository
    },
    {
      provide: NotificationService,
      useFactory: (repository) => new NotificationService(repository),
      inject: [NOTIFICATION_LOG_REPOSITORY]
    },
    OrgService,
    ParentFeedbackService,
    ReportsService,
    StorageService,
    SupervisionService,
    TemplateCenterService,
    TeacherWorkbenchService,
    TenantContextService
  ]
})
export class AppModule {}
