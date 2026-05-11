import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { apiSuccess } from '@tep/shared';
import { MasterDataService, type TeacherImportRow } from './master-data.service.js';

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

  @Post('teachers/import')
  importTeachers(
    @Query('tenantId') tenantId = 'demo',
    @Body() rows: TeacherImportRow[]
  ) {
    return apiSuccess(this.masterDataService.importTeachers(tenantId, rows));
  }
}
