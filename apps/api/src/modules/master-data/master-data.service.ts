import { Injectable } from '@nestjs/common';

export interface TeacherRecord {
  id: string;
  tenantId: string;
  teacherNo: string;
  teacherName: string;
  orgId: string;
}

export interface StudentRecord {
  id: string;
  tenantId: string;
  studentNo: string;
  studentName: string;
  classOrgId: string;
}

export interface CourseRecord {
  id: string;
  tenantId: string;
  courseCode: string;
  courseName: string;
  ownerOrgId: string;
}

export interface TeacherImportRow {
  teacherNo: string;
  teacherName: string;
  orgId: string;
}

export interface StudentImportRow {
  studentNo: string;
  studentName: string;
  classOrgId: string;
}

export interface CourseImportRow {
  courseCode: string;
  courseName: string;
  ownerOrgId: string;
}

export interface ImportError {
  rowIndex: number;
  message: string;
}

export interface ImportResult {
  jobId: string;
  status?: ImportJobStatus;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
}

export type MasterDataEntityType = 'teacher' | 'student' | 'course';
export type SyncType = 'full' | 'incremental';
export type ImportJobStatus = 'success' | 'partial_failed' | 'failed';

export interface ImportJob {
  id: string;
  tenantId: string;
  entityType: MasterDataEntityType;
  mode: 'manual' | 'external';
  source?: string;
  syncType?: SyncType;
  status: ImportJobStatus;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
  createdAt: string;
}

export interface ImportJobQuery {
  tenantId?: string;
  entityType?: MasterDataEntityType;
  status?: ImportJobStatus;
}

export interface SyncJobRequest {
  tenantId: string;
  entityType: MasterDataEntityType;
  syncType: SyncType;
  source: string;
}

type SyncRowSet = TeacherImportRow[] | StudentImportRow[] | CourseImportRow[];

interface MasterDataSyncAdapter {
  source: string;
  pull(entityType: MasterDataEntityType, syncType: SyncType): SyncRowSet | undefined;
}

const teachers: TeacherRecord[] = [
  {
    id: 'teacher-demo-1',
    tenantId: 'demo',
    teacherNo: 'T001',
    teacherName: '教师甲',
    orgId: 'org-college-demo'
  }
];

const students: StudentRecord[] = [
  {
    id: 'student-demo-1',
    tenantId: 'demo',
    studentNo: 'S001',
    studentName: '学生甲',
    classOrgId: 'org-class-demo'
  }
];

const courses: CourseRecord[] = [
  {
    id: 'course-demo-1',
    tenantId: 'demo',
    courseCode: 'C001',
    courseName: '高等数学 A',
    ownerOrgId: 'org-college-demo'
  }
];

const importJobs: ImportJob[] = [];

const syncAdapters: MasterDataSyncAdapter[] = [
  {
    source: 'mock-sis',
    pull(entityType) {
      if (entityType === 'teacher') {
        return [
          { teacherNo: 'T100', teacherName: '同步教师甲', orgId: 'org-college-demo' },
          { teacherNo: 'T101', teacherName: '同步教师乙', orgId: 'org-college-demo' }
        ];
      }
      if (entityType === 'student') {
        return [
          { studentNo: 'S100', studentName: '同步学生甲', classOrgId: 'org-class-demo' },
          { studentNo: 'S101', studentName: '同步学生乙', classOrgId: 'org-class-demo' }
        ];
      }
      return [
        { courseCode: 'C100', courseName: '同步课程甲', ownerOrgId: 'org-college-demo' },
        { courseCode: 'C101', courseName: '同步课程乙', ownerOrgId: 'org-college-demo' }
      ];
    }
  }
];

@Injectable()
export class MasterDataService {
  listTeachers(tenantId: string): TeacherRecord[] {
    return teachers.filter((teacher) => teacher.tenantId === tenantId);
  }

  listStudents(tenantId: string): StudentRecord[] {
    return students.filter((student) => student.tenantId === tenantId);
  }

  listCourses(tenantId: string): CourseRecord[] {
    return courses.filter((course) => course.tenantId === tenantId);
  }

  importTeachers(tenantId: string, rows: TeacherImportRow[]): ImportResult {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateTeacherRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = teachers.find(
        (teacher) => teacher.tenantId === tenantId && teacher.teacherNo === row.teacherNo
      );
      if (existing) {
        existing.teacherName = row.teacherName;
        existing.orgId = row.orgId;
      } else {
        teachers.push({
          id: `teacher-${tenantId}-${row.teacherNo}`,
          tenantId,
          teacherNo: row.teacherNo,
          teacherName: row.teacherName,
          orgId: row.orgId
        });
      }
      successCount += 1;
    });

    return this.recordImportJob(tenantId, 'teacher', successCount, errors);
  }

  importStudents(tenantId: string, rows: StudentImportRow[]): ImportResult {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateStudentRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = students.find(
        (student) => student.tenantId === tenantId && student.studentNo === row.studentNo
      );
      if (existing) {
        existing.studentName = row.studentName;
        existing.classOrgId = row.classOrgId;
      } else {
        students.push({
          id: `student-${tenantId}-${row.studentNo}`,
          tenantId,
          studentNo: row.studentNo,
          studentName: row.studentName,
          classOrgId: row.classOrgId
        });
      }
      successCount += 1;
    });

    return this.recordImportJob(tenantId, 'student', successCount, errors);
  }

  importCourses(tenantId: string, rows: CourseImportRow[]): ImportResult {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateCourseRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = courses.find(
        (course) => course.tenantId === tenantId && course.courseCode === row.courseCode
      );
      if (existing) {
        existing.courseName = row.courseName;
        existing.ownerOrgId = row.ownerOrgId;
      } else {
        courses.push({
          id: `course-${tenantId}-${row.courseCode}`,
          tenantId,
          courseCode: row.courseCode,
          courseName: row.courseName,
          ownerOrgId: row.ownerOrgId
        });
      }
      successCount += 1;
    });

    return this.recordImportJob(tenantId, 'course', successCount, errors);
  }

  runSyncJob(request: SyncJobRequest): ImportResult {
    const adapter = syncAdapters.find((candidate) => candidate.source === request.source);
    if (!adapter) {
      return this.recordImportJob(request.tenantId, request.entityType, 0, [
        { rowIndex: 0, message: `Sync adapter is not available: ${request.source}` }
      ], {
        mode: 'external',
        source: request.source,
        syncType: request.syncType
      });
    }

    const rows = adapter.pull(request.entityType, request.syncType);
    if (!rows) {
      return this.recordImportJob(request.tenantId, request.entityType, 0, [
        { rowIndex: 0, message: `Entity is not supported by adapter: ${request.entityType}` }
      ], {
        mode: 'external',
        source: request.source,
        syncType: request.syncType
      });
    }

    const result =
      request.entityType === 'teacher'
        ? this.applyTeacherRows(request.tenantId, rows as TeacherImportRow[])
        : request.entityType === 'student'
          ? this.applyStudentRows(request.tenantId, rows as StudentImportRow[])
          : this.applyCourseRows(request.tenantId, rows as CourseImportRow[]);

    return this.recordImportJob(request.tenantId, request.entityType, result.successCount, result.errors, {
      mode: 'external',
      source: request.source,
      syncType: request.syncType
    });
  }

  listImportJobs(query: ImportJobQuery = {}): ImportJob[] {
    return importJobs
      .filter((job) => !query.tenantId || job.tenantId === query.tenantId)
      .filter((job) => !query.entityType || job.entityType === query.entityType)
      .filter((job) => !query.status || job.status === query.status)
      .map((job) => ({ ...job, errors: job.errors.map((error) => ({ ...error })) }))
      .reverse();
  }

  private validateTeacherRow(row: TeacherImportRow): string | undefined {
    if (!row.teacherNo.trim()) {
      return 'teacherNo is required';
    }
    if (!row.teacherName.trim()) {
      return 'teacherName is required';
    }
    if (!row.orgId.trim()) {
      return 'orgId is required';
    }
    return undefined;
  }

  private validateStudentRow(row: StudentImportRow): string | undefined {
    if (!row.studentNo.trim()) {
      return 'studentNo is required';
    }
    if (!row.studentName.trim()) {
      return 'studentName is required';
    }
    if (!row.classOrgId.trim()) {
      return 'classOrgId is required';
    }
    return undefined;
  }

  private validateCourseRow(row: CourseImportRow): string | undefined {
    if (!row.courseCode.trim()) {
      return 'courseCode is required';
    }
    if (!row.courseName.trim()) {
      return 'courseName is required';
    }
    if (!row.ownerOrgId.trim()) {
      return 'ownerOrgId is required';
    }
    return undefined;
  }

  private applyTeacherRows(
    tenantId: string,
    rows: TeacherImportRow[]
  ): Pick<ImportResult, 'successCount' | 'errors'> {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateTeacherRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = teachers.find(
        (teacher) => teacher.tenantId === tenantId && teacher.teacherNo === row.teacherNo
      );
      if (existing) {
        existing.teacherName = row.teacherName;
        existing.orgId = row.orgId;
      } else {
        teachers.push({
          id: `teacher-${tenantId}-${row.teacherNo}`,
          tenantId,
          teacherNo: row.teacherNo,
          teacherName: row.teacherName,
          orgId: row.orgId
        });
      }
      successCount += 1;
    });

    return { successCount, errors };
  }

  private applyStudentRows(
    tenantId: string,
    rows: StudentImportRow[]
  ): Pick<ImportResult, 'successCount' | 'errors'> {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateStudentRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = students.find(
        (student) => student.tenantId === tenantId && student.studentNo === row.studentNo
      );
      if (existing) {
        existing.studentName = row.studentName;
        existing.classOrgId = row.classOrgId;
      } else {
        students.push({
          id: `student-${tenantId}-${row.studentNo}`,
          tenantId,
          studentNo: row.studentNo,
          studentName: row.studentName,
          classOrgId: row.classOrgId
        });
      }
      successCount += 1;
    });

    return { successCount, errors };
  }

  private applyCourseRows(
    tenantId: string,
    rows: CourseImportRow[]
  ): Pick<ImportResult, 'successCount' | 'errors'> {
    const errors: ImportError[] = [];
    let successCount = 0;

    rows.forEach((row, index) => {
      const validationError = this.validateCourseRow(row);
      if (validationError) {
        errors.push({ rowIndex: index + 1, message: validationError });
        return;
      }

      const existing = courses.find(
        (course) => course.tenantId === tenantId && course.courseCode === row.courseCode
      );
      if (existing) {
        existing.courseName = row.courseName;
        existing.ownerOrgId = row.ownerOrgId;
      } else {
        courses.push({
          id: `course-${tenantId}-${row.courseCode}`,
          tenantId,
          courseCode: row.courseCode,
          courseName: row.courseName,
          ownerOrgId: row.ownerOrgId
        });
      }
      successCount += 1;
    });

    return { successCount, errors };
  }

  private recordImportJob(
    tenantId: string,
    entityType: MasterDataEntityType,
    successCount: number,
    errors: ImportError[],
    options: Pick<ImportJob, 'mode' | 'source' | 'syncType'> = { mode: 'manual' }
  ): ImportResult {
    const failureCount = errors.length;
    const status: ImportJobStatus =
      failureCount === 0 ? 'success' : successCount === 0 ? 'failed' : 'partial_failed';
    const job: ImportJob = {
      id: `import-${tenantId}-${entityType}-${importJobs.length + 1}`,
      tenantId,
      entityType,
      mode: options.mode,
      source: options.source,
      syncType: options.syncType,
      status,
      successCount,
      failureCount,
      errors: errors.map((error) => ({ ...error })),
      createdAt: new Date().toISOString()
    };
    importJobs.push(job);

    return {
      jobId: job.id,
      status,
      successCount,
      failureCount,
      errors: errors.map((error) => ({ ...error }))
    };
  }
}
