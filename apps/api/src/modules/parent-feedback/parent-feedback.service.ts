import { Injectable, NotFoundException } from '@nestjs/common';

export type ParentFeedbackCategory = 'course' | 'homework' | 'safety' | 'communication' | 'other';
export type ParentFeedbackRiskLevel = 'normal' | 'high';
export type ParentFeedbackStatus = 'submitted' | 'handled';

export interface SubmitParentFeedbackInput {
  tenantId: string;
  parentUserId: string;
  studentId: string;
  classOrgId: string;
  category: ParentFeedbackCategory;
  rating: number;
  content: string;
}

export interface ParentFeedback {
  id: string;
  tenantId: string;
  parentUserId: string;
  studentId: string;
  classOrgId: string;
  category: ParentFeedbackCategory;
  rating: number;
  content: string;
  riskLevel: ParentFeedbackRiskLevel;
  status: ParentFeedbackStatus;
  handlerUserId?: string;
  handlingResult?: string;
  submittedAt: string;
  handledAt?: string;
}

export interface ParentFeedbackQuery {
  tenantId?: string;
  parentUserId?: string;
  studentId?: string;
  classOrgId?: string;
  category?: ParentFeedbackCategory;
  status?: ParentFeedbackStatus;
  riskLevel?: ParentFeedbackRiskLevel;
}

export interface HandleParentFeedbackInput {
  handlerUserId: string;
  result: string;
}

@Injectable()
export class ParentFeedbackService {
  private readonly feedbackItems: ParentFeedback[] = [];

  submitFeedback(input: SubmitParentFeedbackInput): ParentFeedback {
    const feedback: ParentFeedback = {
      id: `parent-feedback-${this.feedbackItems.length + 1}`,
      tenantId: input.tenantId,
      parentUserId: input.parentUserId,
      studentId: input.studentId,
      classOrgId: input.classOrgId,
      category: input.category,
      rating: input.rating,
      content: input.content,
      riskLevel: this.resolveRiskLevel(input),
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };
    this.feedbackItems.push(feedback);
    return { ...feedback };
  }

  listFeedback(query: ParentFeedbackQuery = {}): ParentFeedback[] {
    return this.feedbackItems
      .filter((feedback) => !query.tenantId || feedback.tenantId === query.tenantId)
      .filter((feedback) => !query.parentUserId || feedback.parentUserId === query.parentUserId)
      .filter((feedback) => !query.studentId || feedback.studentId === query.studentId)
      .filter((feedback) => !query.classOrgId || feedback.classOrgId === query.classOrgId)
      .filter((feedback) => !query.category || feedback.category === query.category)
      .filter((feedback) => !query.status || feedback.status === query.status)
      .filter((feedback) => !query.riskLevel || feedback.riskLevel === query.riskLevel)
      .map((feedback) => ({ ...feedback }))
      .reverse();
  }

  markHandled(tenantId: string, feedbackId: string, input: HandleParentFeedbackInput): ParentFeedback {
    const feedback = this.feedbackItems.find((item) => item.tenantId === tenantId && item.id === feedbackId);
    if (!feedback) {
      throw new NotFoundException('Parent feedback not found');
    }

    feedback.status = 'handled';
    feedback.handlerUserId = input.handlerUserId;
    feedback.handlingResult = input.result;
    feedback.handledAt = new Date().toISOString();
    return { ...feedback };
  }

  private resolveRiskLevel(input: SubmitParentFeedbackInput): ParentFeedbackRiskLevel {
    const riskyWords = ['欺凌', '安全', '伤害', '风险', '投诉'];
    if (input.rating <= 2 || riskyWords.some((word) => input.content.includes(word))) {
      return 'high';
    }
    return 'normal';
  }
}
