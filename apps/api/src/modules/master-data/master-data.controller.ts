import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import {
  MasterDataService,
  type CourseImportRow,
  type ImportJobStatus,
  type MasterDataEntityType,
  type StudentImportRow,
  type SyncJobRequest,
  type TeacherImportRow
} from './master-data.service.js';

@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('teachers')
  listTeachers(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.masterDataService.listTeachers(tenantId));
  }

  @Get('students')
  listStudents(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.masterDataService.listStudents(tenantId));
  }

  @Get('courses')
  listCourses(@Query('tenantId') tenantId = 'demo') {
    return apiSuccess(this.masterDataService.listCourses(tenantId));
  }

  @Get('import-jobs')
  listImportJobs(
    @Query('tenantId') tenantId?: string,
    @Query('entityType') entityType?: MasterDataEntityType,
    @Query('status') status?: ImportJobStatus
  ) {
    return apiSuccess(this.masterDataService.listImportJobs({ tenantId, entityType, status }));
  }

  @Post('teachers/import')
  importTeachers(
    @Query('tenantId') tenantId = 'demo',
    @Body() rows: TeacherImportRow[]
  ) {
    return apiSuccess(this.masterDataService.importTeachers(tenantId, rows));
  }

  @Post('students/import')
  importStudents(
    @Query('tenantId') tenantId = 'demo',
    @Body() rows: StudentImportRow[]
  ) {
    return apiSuccess(this.masterDataService.importStudents(tenantId, rows));
  }

  @Post('courses/import')
  importCourses(
    @Query('tenantId') tenantId = 'demo',
    @Body() rows: CourseImportRow[]
  ) {
    return apiSuccess(this.masterDataService.importCourses(tenantId, rows));
  }

  @Post('sync-jobs')
  runSyncJob(@Body() request: SyncJobRequest) {
    return apiSuccess(this.masterDataService.runSyncJob(request));
  }
}
