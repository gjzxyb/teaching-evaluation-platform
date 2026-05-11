import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service.js';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportJobStatus = 'pending' | 'completed' | 'failed';
export type ReportExportType = 'completion' | 'average' | 'dimensions' | 'teacher';

export interface CreateReportExportInput {
  tenantId: string;
  requesterUserId: string;
  taskId: string;
  reportType: ReportExportType;
  format: ExportFormat;
  payload: Record<string, unknown>;
}

export interface ExportJob {
  id: string;
  tenantId: string;
  requesterUserId: string;
  taskId: string;
  reportType: ReportExportType;
  format: ExportFormat;
  status: ExportJobStatus;
  filename: string;
  objectId?: string;
  objectKey?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface ExportJobQuery {
  tenantId?: string;
  requesterUserId?: string;
  taskId?: string;
  reportType?: ReportExportType;
  status?: ExportJobStatus;
}

@Injectable()
export class ExportService {
  private readonly jobs: ExportJob[] = [];

  constructor(private readonly storageService: StorageService) {}

  createReportExport(input: CreateReportExportInput): ExportJob {
    const filename = `${input.taskId}-${input.reportType}.${input.format}`;
    const createdAt = new Date().toISOString();
    const uploadTarget = this.storageService.createUploadTarget({
      tenantId: input.tenantId,
      ownerUserId: input.requesterUserId,
      filename,
      contentType: this.resolveContentType(input.format),
      size: JSON.stringify(input.payload).length
    });
    const job: ExportJob = {
      id: `export-${this.jobs.length + 1}`,
      tenantId: input.tenantId,
      requesterUserId: input.requesterUserId,
      taskId: input.taskId,
      reportType: input.reportType,
      format: input.format,
      status: 'completed',
      filename,
      objectId: uploadTarget.objectId,
      objectKey: uploadTarget.objectKey,
      payload: { ...input.payload },
      createdAt,
      completedAt: new Date().toISOString()
    };
    this.jobs.push(job);
    return this.cloneJob(job);
  }

  listExportJobs(query: ExportJobQuery = {}): ExportJob[] {
    return this.jobs
      .filter((job) => !query.tenantId || job.tenantId === query.tenantId)
      .filter((job) => !query.requesterUserId || job.requesterUserId === query.requesterUserId)
      .filter((job) => !query.taskId || job.taskId === query.taskId)
      .filter((job) => !query.reportType || job.reportType === query.reportType)
      .filter((job) => !query.status || job.status === query.status)
      .map((job) => this.cloneJob(job))
      .reverse();
  }

  private resolveContentType(format: ExportFormat): string {
    if (format === 'xlsx') {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    if (format === 'pdf') {
      return 'application/pdf';
    }
    return 'text/csv';
  }

  private cloneJob(job: ExportJob): ExportJob {
    return { ...job, payload: { ...job.payload } };
  }
}
