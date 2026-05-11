import { Injectable } from '@nestjs/common';

export interface TextAnalysisRequest {
  tenantId: string;
  taskId: string;
  comments: string[];
}

export interface TextKeyword {
  word: string;
  count: number;
}

export interface TextAnalysisResult {
  tenantId: string;
  taskId: string;
  provider: 'keyword-v1';
  keywords: TextKeyword[];
  analyzedAt: string;
}

export interface ManualSummaryInput {
  tenantId: string;
  taskId: string;
  authorUserId: string;
  summary: string;
}

export interface TextSummary {
  id: string;
  tenantId: string;
  taskId: string;
  authorUserId: string;
  source: 'manual';
  summary: string;
  createdAt: string;
}

export interface SummaryQuery {
  tenantId?: string;
  taskId?: string;
  authorUserId?: string;
}

const summaries: TextSummary[] = [];

@Injectable()
export class AnalysisService {
  analyzeTexts(input: TextAnalysisRequest): TextAnalysisResult {
    return {
      tenantId: input.tenantId,
      taskId: input.taskId,
      provider: 'keyword-v1',
      keywords: this.extractKeywords(input.comments),
      analyzedAt: new Date().toISOString()
    };
  }

  saveManualSummary(input: ManualSummaryInput): TextSummary {
    const summary: TextSummary = {
      id: `summary-${summaries.length + 1}`,
      tenantId: input.tenantId,
      taskId: input.taskId,
      authorUserId: input.authorUserId,
      source: 'manual',
      summary: input.summary,
      createdAt: new Date().toISOString()
    };
    summaries.push(summary);
    return { ...summary };
  }

  listSummaries(query: SummaryQuery = {}): TextSummary[] {
    return summaries
      .filter((summary) => !query.tenantId || summary.tenantId === query.tenantId)
      .filter((summary) => !query.taskId || summary.taskId === query.taskId)
      .filter((summary) => !query.authorUserId || summary.authorUserId === query.authorUserId)
      .map((summary) => ({ ...summary }))
      .reverse();
  }

  private extractKeywords(comments: string[]): TextKeyword[] {
    const counts = new Map<string, number>();
    const firstSeen = new Map<string, number>();
    let position = 0;
    for (const comment of comments) {
      for (const word of comment.split(/[\s,，。；;！!？?]+/u)) {
        const normalized = word.trim();
        if (normalized.length < 2) {
          continue;
        }
        if (!firstSeen.has(normalized)) {
          firstSeen.set(normalized, position);
        }
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        position += 1;
      }
    }

    return [...counts.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1] || (firstSeen.get(left[0]) ?? 0) - (firstSeen.get(right[0]) ?? 0)
      )
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }
}
