import test from 'node:test';
import assert from 'node:assert/strict';
import { MasterDataService } from './master-data.service.js';

test('lists tenant-scoped teachers, students, and courses', () => {
  const service = new MasterDataService();

  assert.equal(service.listTeachers('demo').length, 1);
  assert.equal(service.listStudents('demo').length, 1);
  assert.equal(service.listCourses('demo').length, 1);
  assert.equal(service.listTeachers('other').length, 0);
});

test('imports teacher rows and reports row validation errors', () => {
  const service = new MasterDataService();
  const result = service.importTeachers('demo', [
    { teacherNo: 'T002', teacherName: '教师乙', orgId: 'org-college-demo' },
    { teacherNo: '', teacherName: '缺编号', orgId: 'org-college-demo' }
  ]);

  assert.equal(result.successCount, 1);
  assert.equal(result.failureCount, 1);
  assert.match(result.errors[0]?.message ?? '', /teacherNo/);
  assert.ok(service.listTeachers('demo').some((teacher) => teacher.teacherNo === 'T002'));
});
