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

test('imports student rows and records an import job', () => {
  const service = new MasterDataService();
  const result = service.importStudents('demo', [
    { studentNo: 'S010', studentName: '学生十', classOrgId: 'org-class-demo' },
    { studentNo: 'S011', studentName: '', classOrgId: 'org-class-demo' }
  ]);

  assert.equal(result.successCount, 1);
  assert.equal(result.failureCount, 1);
  assert.match(result.errors[0]?.message ?? '', /studentName/);
  assert.ok(service.listStudents('demo').some((student) => student.studentNo === 'S010'));

  const jobs = service.listImportJobs({ tenantId: 'demo', entityType: 'student' });
  assert.equal(jobs[0]?.id, result.jobId);
  assert.equal(jobs[0]?.status, 'partial_failed');
});

test('imports course rows and updates existing records by course code', () => {
  const service = new MasterDataService();
  const firstResult = service.importCourses('demo', [
    { courseCode: 'C010', courseName: '大学物理', ownerOrgId: 'org-college-demo' }
  ]);
  const secondResult = service.importCourses('demo', [
    { courseCode: 'C010', courseName: '大学物理 I', ownerOrgId: 'org-college-demo' }
  ]);

  assert.equal(firstResult.successCount, 1);
  assert.equal(secondResult.successCount, 1);
  assert.equal(
    service.listCourses('demo').find((course) => course.courseCode === 'C010')?.courseName,
    '大学物理 I'
  );
});

test('runs external full sync through an adapter and records a sync job', () => {
  const service = new MasterDataService();
  const result = service.runSyncJob({
    tenantId: 'demo',
    entityType: 'student',
    syncType: 'full',
    source: 'mock-sis'
  });

  assert.equal(result.status, 'success');
  assert.equal(result.successCount, 2);
  assert.equal(result.failureCount, 0);
  assert.ok(service.listStudents('demo').some((student) => student.studentNo === 'S100'));

  const jobs = service.listImportJobs({ tenantId: 'demo', entityType: 'student' });
  assert.equal(jobs[0]?.id, result.jobId);
  assert.equal(jobs[0]?.source, 'mock-sis');
  assert.equal(jobs[0]?.syncType, 'full');
});

test('records failed sync jobs when an adapter is unavailable', () => {
  const service = new MasterDataService();
  const result = service.runSyncJob({
    tenantId: 'demo',
    entityType: 'teacher',
    syncType: 'incremental',
    source: 'missing-source'
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.successCount, 0);
  assert.match(result.errors[0]?.message ?? '', /missing-source/);
});
