import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service.js';

export interface TeacherResultOverview {
  tenantId: string;
  teacherId: string;
  submittedCount: number;
  averageScore: number;
  keywords: string[];
}

export interface CreateSelfEvaluationInput {
  tenantId: string;
  teacherId: string;
  taskId: string;
  strengths: string;
  weaknesses: string;
  improvementPlan: string;
}

export interface TeacherSelfEvaluation {
  id: string;
  tenantId: string;
  teacherId: string;
  taskId: string;
  strengths: string;
  weaknesses: string;
  improvementPlan: string;
  status: 'submitted';
  createdAt: string;
}

export interface TeacherGrowthArchive {
  tenantId: string;
  teacherId: string;
  resultOverview: TeacherResultOverview;
  selfEvaluations: TeacherSelfEvaluation[];
}

@Injectable()
export class TeacherWorkbenchService {
  private readonly selfEvaluations: TeacherSelfEvaluation[] = [];

  constructor(private readonly reportsService: ReportsService) {}

  getResultOverview(tenantId: string, teacherId: string): TeacherResultOverview {
    const report = this.reportsService.getTeacherReport(tenantId, teacherId);
    return {
      tenantId,
      teacherId,
      submittedCount: report.submittedCount,
      averageScore: report.averageScore,
      keywords: [...report.keywords]
    };
  }

  createSelfEvaluation(input: CreateSelfEvaluationInput): TeacherSelfEvaluation {
    const selfEvaluation: TeacherSelfEvaluation = {
      id: `teacher-self-${this.selfEvaluations.length + 1}`,
      tenantId: input.tenantId,
      teacherId: input.teacherId,
      taskId: input.taskId,
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      improvementPlan: input.improvementPlan,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    this.selfEvaluations.push(selfEvaluation);
    return { ...selfEvaluation };
  }

  getGrowthArchive(tenantId: string, teacherId: string): TeacherGrowthArchive {
    return {
      tenantId,
      teacherId,
      resultOverview: this.getResultOverview(tenantId, teacherId),
      selfEvaluations: this.selfEvaluations
        .filter((item) => item.tenantId === tenantId && item.teacherId === teacherId)
        .map((item) => ({ ...item }))
        .reverse()
    };
  }
}
