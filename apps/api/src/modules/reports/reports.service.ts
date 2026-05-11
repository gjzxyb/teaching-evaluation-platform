import { Injectable } from '@nestjs/common';
import type { EvaluationAnswerInput } from '@tep/shared';
import { EvaluationService } from '../evaluation/evaluation.service.js';

export interface CompletionReport {
  taskId: string;
  totalCount: number;
  submittedCount: number;
  pendingCount: number;
  completionRate: number;
}

export interface ScoreReport {
  taskId: string;
  visible: boolean;
  submittedCount: number;
  averageScore?: number;
  reason?: 'sample-threshold' | 'not-released';
}

export interface DimensionReport {
  taskId: string;
  visible: boolean;
  items: Array<{
    indicatorKey: string;
    averageScore: number;
    answerCount: number;
  }>;
  reason?: 'sample-threshold' | 'not-released';
}

@Injectable()
export class ReportsService {
  constructor(private readonly evaluationService: EvaluationService) {}

  getTeacherReport(tenantId: string, teacherId: string) {
    return this.evaluationService.getTeacherReport(tenantId, teacherId);
  }

  getCompletionReport(tenantId: string, taskId: string): CompletionReport {
    const dataset = this.evaluationService.getTaskReportDataset(tenantId, taskId);
    const submittedCount = dataset.instances.filter((instance) => instance.status === 'submitted').length;
    const totalCount = dataset.instances.length;

    return {
      taskId,
      totalCount,
      submittedCount,
      pendingCount: totalCount - submittedCount,
      completionRate: totalCount === 0 ? 0 : Number((submittedCount / totalCount).toFixed(4))
    };
  }

  getAverageReport(tenantId: string, taskId: string): ScoreReport {
    const dataset = this.evaluationService.getTaskReportDataset(tenantId, taskId);
    const visibility = this.resolveVisibility(dataset.task.sampleThreshold, dataset.task.resultReleaseTime, dataset.responses.length);
    if (!visibility.visible) {
      return {
        taskId,
        visible: false,
        submittedCount: dataset.responses.length,
        reason: visibility.reason
      };
    }

    const totalScore = dataset.responses.reduce((sum, response) => sum + response.totalScore, 0);
    return {
      taskId,
      visible: true,
      submittedCount: dataset.responses.length,
      averageScore: dataset.responses.length === 0 ? 0 : Number((totalScore / dataset.responses.length).toFixed(2))
    };
  }

  getDimensionReport(tenantId: string, taskId: string): DimensionReport {
    const dataset = this.evaluationService.getTaskReportDataset(tenantId, taskId);
    const visibility = this.resolveVisibility(dataset.task.sampleThreshold, dataset.task.resultReleaseTime, dataset.responses.length);
    if (!visibility.visible) {
      return {
        taskId,
        visible: false,
        items: [],
        reason: visibility.reason
      };
    }

    const questionMap = new Map(dataset.template.questions.map((question) => [question.id, question]));
    const buckets = new Map<string, number[]>();

    for (const response of dataset.responses) {
      for (const answer of response.answers) {
        this.addScoreToDimension(questionMap, buckets, answer);
      }
    }

    return {
      taskId,
      visible: true,
      items: [...buckets.entries()].map(([indicatorKey, scores]) => ({
        indicatorKey,
        averageScore: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)),
        answerCount: scores.length
      }))
    };
  }

  private addScoreToDimension(
    questionMap: Map<string, { indicatorKey: string }>,
    buckets: Map<string, number[]>,
    answer: EvaluationAnswerInput
  ) {
    if (typeof answer.scoreValue !== 'number') {
      return;
    }
    const question = questionMap.get(answer.questionId);
    if (!question) {
      return;
    }

    const scores = buckets.get(question.indicatorKey) ?? [];
    scores.push(answer.scoreValue);
    buckets.set(question.indicatorKey, scores);
  }

  private resolveVisibility(
    sampleThreshold: number,
    resultReleaseTime: string | undefined,
    submittedCount: number
  ): { visible: true } | { visible: false; reason: 'sample-threshold' | 'not-released' } {
    if (resultReleaseTime && new Date(resultReleaseTime).getTime() > Date.now()) {
      return { visible: false, reason: 'not-released' };
    }
    if (submittedCount < sampleThreshold) {
      return { visible: false, reason: 'sample-threshold' };
    }
    return { visible: true };
  }
}
