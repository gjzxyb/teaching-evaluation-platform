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

export interface ImportError {
  rowIndex: number;
  message: string;
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: ImportError[];
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

    return {
      successCount,
      failureCount: errors.length,
      errors
    };
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
}
