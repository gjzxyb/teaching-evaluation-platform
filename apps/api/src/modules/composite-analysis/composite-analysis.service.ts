import { Injectable } from '@nestjs/common';
import { ParentFeedbackService } from '../parent-feedback/parent-feedback.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { SupervisionService } from '../supervision/supervision.service.js';
import { TeacherWorkbenchService } from '../teacher/teacher-workbench.service.js';

export interface TeacherCompositeProfile {
  tenantId: string;
  teacherId: string;
  generatedAt: string;
  studentEvaluation: {
    submittedCount: number;
    averageScore: number;
    keywords: string[];
  };
  supervision: {
    observationCount: number;
    lowScoreDimensions: string[];
  };
  parentFeedback: {
    feedbackCount: number;
    highRiskCount: number;
  };
  growth: {
    selfEvaluationCount: number;
  };
  riskSignals: string[];
}

@Injectable()
export class CompositeAnalysisService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly supervisionService: SupervisionService,
    private readonly parentFeedbackService: ParentFeedbackService,
    private readonly teacherWorkbenchService: TeacherWorkbenchService
  ) {}

  getTeacherCompositeProfile(tenantId: string, teacherId: string): TeacherCompositeProfile {
    const teacherReport = this.reportsService.getTeacherReport(tenantId, teacherId);
    const observations = this.supervisionService.listObservations({ tenantId, teacherId });
    const classOrgIds = new Set(
      this.supervisionService
        .listObservationTasks({ tenantId, teacherId })
        .map((task) => task.classOrgId)
    );
    const parentFeedback = [...classOrgIds].flatMap((classOrgId) =>
      this.parentFeedbackService.listFeedback({ tenantId, classOrgId })
    );
    const highRiskFeedback = parentFeedback.filter((feedback) => feedback.riskLevel === 'high');
    const archive = this.teacherWorkbenchService.getGrowthArchive(tenantId, teacherId);
    const lowScoreDimensions = [
      ...new Set(
        observations.flatMap((observation) =>
          observation.scores.filter((score) => score.score < 3).map((score) => score.dimension)
        )
      )
    ];

    return {
      tenantId,
      teacherId,
      generatedAt: new Date().toISOString(),
      studentEvaluation: {
        submittedCount: teacherReport.submittedCount,
        averageScore: teacherReport.averageScore,
        keywords: [...teacherReport.keywords]
      },
      supervision: {
        observationCount: observations.length,
        lowScoreDimensions
      },
      parentFeedback: {
        feedbackCount: parentFeedback.length,
        highRiskCount: highRiskFeedback.length
      },
      growth: {
        selfEvaluationCount: archive.selfEvaluations.length
      },
      riskSignals: this.buildRiskSignals(lowScoreDimensions, highRiskFeedback.length)
    };
  }

  private buildRiskSignals(lowScoreDimensions: string[], highRiskFeedbackCount: number): string[] {
    const signals = lowScoreDimensions.map((dimension) => `low-observation-score:${dimension}`);
    if (highRiskFeedbackCount > 0) {
      signals.push(`high-risk-parent-feedback:${highRiskFeedbackCount}`);
    }
    return signals;
  }
}
