import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EvaluationQuestion, EvaluationTemplate } from '@tep/shared';

export interface IndicatorRecord {
  id: string;
  tenantId: string;
  indicatorCode: string;
  indicatorName: string;
  description: string;
  status: 'enabled' | 'disabled';
}

export interface QuestionRecord extends EvaluationQuestion {
  tenantId: string;
  indicatorId: string;
  status: 'enabled' | 'disabled';
}

export interface TemplateRecord extends EvaluationTemplate {
  templateType: 'university' | 'k12' | 'common';
  ownerOrgId: string;
  versionNo: string;
  status: 'draft' | 'published' | 'disabled';
  allowTeacherAppend: boolean;
}

export interface CreateIndicatorRequest {
  tenantId: string;
  indicatorCode: string;
  indicatorName: string;
  description?: string;
}

export interface CreateQuestionRequest {
  tenantId: string;
  title: string;
  type: EvaluationQuestion['type'];
  indicatorId: string;
  maxScore?: number;
}

export interface CreateTemplateRequest {
  tenantId: string;
  templateName: string;
  templateType: TemplateRecord['templateType'];
  targetType: EvaluationTemplate['targetType'];
  ownerOrgId: string;
  anonymousMode: EvaluationTemplate['anonymousMode'];
  allowTeacherAppend: boolean;
  questionIds: string[];
}

const indicators: IndicatorRecord[] = [
  {
    id: 'indicator-goal',
    tenantId: 'demo',
    indicatorCode: 'teaching-goal',
    indicatorName: '教学目标',
    description: '课程目标是否清晰可达',
    status: 'enabled'
  },
  {
    id: 'indicator-class-control',
    tenantId: 'demo',
    indicatorCode: 'class-control',
    indicatorName: '课堂组织',
    description: '课堂组织是否有序',
    status: 'enabled'
  },
  {
    id: 'indicator-comments',
    tenantId: 'demo',
    indicatorCode: 'comments',
    indicatorName: '文本意见',
    description: '开放文本反馈',
    status: 'enabled'
  }
];

const questions: QuestionRecord[] = [
  {
    id: 'q1',
    tenantId: 'demo',
    title: '课程目标是否清晰',
    type: 'rating',
    indicatorId: 'indicator-goal',
    indicatorKey: 'teaching-goal',
    maxScore: 5,
    status: 'enabled'
  },
  {
    id: 'q2',
    tenantId: 'demo',
    title: '课堂组织是否有序',
    type: 'rating',
    indicatorId: 'indicator-class-control',
    indicatorKey: 'class-control',
    maxScore: 5,
    status: 'enabled'
  },
  {
    id: 'q3',
    tenantId: 'demo',
    title: '请填写意见',
    type: 'text',
    indicatorId: 'indicator-comments',
    indicatorKey: 'comments',
    status: 'enabled'
  }
];

const templates: TemplateRecord[] = [
  {
    id: 'tpl-course-basic',
    tenantId: 'demo',
    templateName: '课堂教学评价模板',
    templateType: 'university',
    targetType: 'course',
    ownerOrgId: 'org-college-demo',
    versionNo: 'v1',
    status: 'published',
    allowTeacherAppend: true,
    anonymousMode: 'anonymous',
    questions: [questions[0]!, questions[1]!, questions[2]!]
  }
];

@Injectable()
export class TemplateCenterService {
  createIndicator(input: CreateIndicatorRequest): IndicatorRecord {
    if (!input.indicatorCode.trim()) {
      throw new BadRequestException('indicatorCode is required');
    }
    if (!input.indicatorName.trim()) {
      throw new BadRequestException('indicatorName is required');
    }

    const duplicate = indicators.find(
      (indicator) => indicator.tenantId === input.tenantId && indicator.indicatorCode === input.indicatorCode
    );
    if (duplicate) {
      throw new BadRequestException('indicatorCode already exists');
    }

    const indicator: IndicatorRecord = {
      id: `indicator-${input.indicatorCode}`,
      tenantId: input.tenantId,
      indicatorCode: input.indicatorCode,
      indicatorName: input.indicatorName,
      description: input.description ?? '',
      status: 'enabled'
    };
    indicators.push(indicator);
    return indicator;
  }

  listIndicators(tenantId: string): IndicatorRecord[] {
    return indicators.filter((indicator) => indicator.tenantId === tenantId);
  }

  createQuestion(input: CreateQuestionRequest): QuestionRecord {
    const indicator = indicators.find(
      (item) => item.tenantId === input.tenantId && item.id === input.indicatorId && item.status === 'enabled'
    );
    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }
    if (!input.title.trim()) {
      throw new BadRequestException('question title is required');
    }
    if (input.type === 'rating' && (!input.maxScore || input.maxScore <= 0)) {
      throw new BadRequestException('rating question requires positive maxScore');
    }

    const question: QuestionRecord = {
      id: `question-${questions.length + 1}`,
      tenantId: input.tenantId,
      title: input.title,
      type: input.type,
      indicatorId: input.indicatorId,
      indicatorKey: indicator.indicatorCode,
      maxScore: input.maxScore,
      status: 'enabled'
    };
    questions.push(question);
    return question;
  }

  listQuestions(tenantId: string): QuestionRecord[] {
    return questions.filter((question) => question.tenantId === tenantId);
  }

  createTemplate(input: CreateTemplateRequest): TemplateRecord {
    if (!input.templateName.trim()) {
      throw new BadRequestException('templateName is required');
    }

    const templateQuestions = this.resolveQuestions(input.tenantId, input.questionIds);
    const template: TemplateRecord = {
      id: `template-${templates.length + 1}`,
      tenantId: input.tenantId,
      templateName: input.templateName,
      templateType: input.templateType,
      targetType: input.targetType,
      ownerOrgId: input.ownerOrgId,
      versionNo: 'draft',
      status: 'draft',
      allowTeacherAppend: input.allowTeacherAppend,
      anonymousMode: input.anonymousMode,
      questions: templateQuestions
    };
    templates.push(template);
    return this.cloneTemplate(template);
  }

  listTemplates(tenantId: string): TemplateRecord[] {
    return templates
      .filter((template) => template.tenantId === tenantId)
      .map((template) => this.cloneTemplate(template));
  }

  getTemplate(tenantId: string, templateId: string): TemplateRecord {
    const template = templates.find((item) => item.tenantId === tenantId && item.id === templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return this.cloneTemplate(template);
  }

  publishTemplate(tenantId: string, templateId: string): TemplateRecord {
    const template = this.requireTemplate(tenantId, templateId);
    if (template.questions.length === 0) {
      throw new BadRequestException('template requires at least one question');
    }

    const publishedCount = templates.filter(
      (item) => item.tenantId === tenantId && item.templateName === template.templateName && item.status === 'published'
    ).length;

    template.versionNo = `v${publishedCount + 1}`;
    template.status = 'published';
    return this.cloneTemplate(template);
  }

  copyTemplate(tenantId: string, templateId: string, templateName: string): TemplateRecord {
    const source = this.requireTemplate(tenantId, templateId);
    const copied: TemplateRecord = {
      ...source,
      id: `template-${templates.length + 1}`,
      templateName,
      versionNo: 'draft',
      status: 'draft',
      questions: [...source.questions]
    };
    templates.push(copied);
    return this.cloneTemplate(copied);
  }

  private resolveQuestions(tenantId: string, questionIds: string[]): QuestionRecord[] {
    return questionIds.map((questionId) => {
      const question = questions.find(
        (item) => item.tenantId === tenantId && item.id === questionId && item.status === 'enabled'
      );
      if (!question) {
        throw new NotFoundException(`Question not found: ${questionId}`);
      }
      return question;
    });
  }

  private requireTemplate(tenantId: string, templateId: string): TemplateRecord {
    const template = templates.find((item) => item.tenantId === tenantId && item.id === templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  private cloneTemplate(template: TemplateRecord): TemplateRecord {
    return {
      ...template,
      questions: template.questions.map((question) => ({ ...question }))
    };
  }
}
