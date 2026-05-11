import { fallbackCompositeProfile, fallbackImprovements, fallbackLogs, fallbackParentFeedback, fallbackTasks, fallbackSupervision, fallbackTemplates, fallbackTeacherOverview } from './fixtures.js';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TENANT_ID = 'demo';
export async function loadAdminData() {
    if (!API_BASE_URL) {
        return getFallbackData();
    }
    try {
        const [templates, tasks, improvements, notifyLogs, auditLogs, teacherOverview, growthArchive, supervisionTasks, observations, parentFeedback, compositeProfile] = await Promise.all([
            getJson(`/templates?tenantId=${TENANT_ID}`),
            getJson(`/eval/tasks?tenantId=${TENANT_ID}`),
            getJson(`/improvement-tickets?tenantId=${TENANT_ID}`),
            getJson(`/notify/logs?tenantId=${TENANT_ID}`),
            getJson(`/audit-logs?tenantId=${TENANT_ID}`),
            getJson(`/teacher-workbench/teachers/teacher-demo-1/results?tenantId=${TENANT_ID}`),
            getJson(`/teacher-workbench/teachers/teacher-demo-1/growth-archive?tenantId=${TENANT_ID}`),
            getJson(`/supervision/observation-tasks?tenantId=${TENANT_ID}`),
            getJson(`/supervision/observations?tenantId=${TENANT_ID}`),
            getJson(`/parent-feedback?tenantId=${TENANT_ID}`),
            getJson(`/composite-analysis/teachers/teacher-demo-1/profile?tenantId=${TENANT_ID}`)
        ]);
        return {
            source: 'api',
            templates: templates.map(mapTemplate),
            tasks: tasks.map(mapTask),
            improvements: improvements.map(mapImprovement),
            logs: [...notifyLogs.map(mapNotificationLog), ...auditLogs.map(mapAuditLog)],
            report: {
                completionRate: tasks.length === 0 ? '0%' : '待生成',
                completionText: tasks.length === 0 ? '暂无运行任务' : '请进入任务详情生成报表',
                dimensions: [['teaching-goal', '-', '等待数据']]
            },
            teacherOverview: mapTeacherOverview(teacherOverview, growthArchive),
            supervision: {
                tasks: supervisionTasks.map(mapObservationTask),
                observations: observations.map(mapObservation)
            },
            parentFeedback: parentFeedback.map(mapParentFeedback),
            compositeProfile: mapCompositeProfile(compositeProfile)
        };
    }
    catch {
        return getFallbackData();
    }
}
function getFallbackData() {
    return {
        source: 'fallback',
        templates: fallbackTemplates,
        tasks: fallbackTasks,
        improvements: fallbackImprovements,
        logs: fallbackLogs,
        report: {
            completionRate: '86%',
            completionText: '已提交 86 / 应提交 100',
            dimensions: [
                ['teaching-goal', '4.2', '正常'],
                ['class-control', '3.6', '触发整改'],
                ['comments', '-', '文本汇总']
            ]
        },
        teacherOverview: fallbackTeacherOverview,
        supervision: {
            tasks: fallbackSupervision.tasks.map((item) => [item.id, item.teacherId, item.supervisor, item.status, item.scheduledAt]),
            observations: fallbackSupervision.observations.map((item) => [item.id, item.teacherId, item.dimensions, item.tickets])
        },
        parentFeedback: fallbackParentFeedback,
        compositeProfile: fallbackCompositeProfile
    };
}
async function getJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error(`Request failed: ${path}`);
    }
    const envelope = await response.json();
    if (envelope.code !== 0) {
        throw new Error(envelope.message);
    }
    return envelope.data;
}
function mapTemplate(item) {
    return {
        name: item.templateName ?? item.name ?? '-',
        type: item.templateType ?? item.type ?? '-',
        version: item.versionNo ?? item.version ?? '-',
        status: item.status ?? '-',
        questions: Array.isArray(item.questions) ? item.questions.length : Number(item.questions ?? 0)
    };
}
function mapTask(item) {
    return {
        name: item.taskName ?? item.name ?? '-',
        stage: item.status ?? item.stage ?? '-',
        completion: item.completion ?? '-',
        template: item.templateId ?? item.template ?? '-'
    };
}
function mapImprovement(item) {
    return {
        id: item.id ?? '-',
        owner: item.ownerUserId ?? item.owner ?? '-',
        problem: item.problemDesc ?? item.problem ?? '-',
        status: item.status ?? '-',
        due: item.dueDate ?? item.due ?? '-'
    };
}
function mapNotificationLog(item) {
    return {
        type: '通知',
        action: item.bizType ?? '-',
        target: item.bizId ?? '-',
        result: item.status ?? '-'
    };
}
function mapAuditLog(item) {
    return {
        type: '审计',
        action: item.action ?? '-',
        target: item.target ?? '-',
        result: 'recorded'
    };
}
function mapTeacherOverview(overview, archive) {
    return {
        teacherId: overview.teacherId ?? 'teacher-demo-1',
        submittedCount: Number(overview.submittedCount ?? 0),
        averageScore: Number(overview.averageScore ?? 0),
        keywords: Array.isArray(overview.keywords) ? overview.keywords : [],
        selfEvaluations: Array.isArray(archive.selfEvaluations)
            ? archive.selfEvaluations.map((item) => ({
                taskId: item.taskId ?? '-',
                strengths: item.strengths ?? '-',
                weaknesses: item.weaknesses ?? '-',
                improvementPlan: item.improvementPlan ?? '-'
            }))
            : []
    };
}
function mapObservationTask(item) {
    return [
        item.id ?? '-',
        item.teacherId ?? '-',
        item.supervisorUserId ?? '-',
        item.status ?? '-',
        String(item.scheduledAt ?? '-')
    ];
}
function mapObservation(item) {
    const dimensions = Array.isArray(item.scores)
        ? item.scores.map((score) => `${score.dimension}:${score.score}`).join(', ')
        : '-';
    return [
        item.id ?? '-',
        item.teacherId ?? '-',
        dimensions,
        String(Array.isArray(item.improvementTicketIds) ? item.improvementTicketIds.length : 0)
    ];
}
function mapParentFeedback(item) {
    return {
        id: item.id ?? '-',
        studentId: item.studentId ?? '-',
        classOrgId: item.classOrgId ?? '-',
        category: item.category ?? '-',
        riskLevel: item.riskLevel ?? '-',
        status: item.status ?? '-'
    };
}
function mapCompositeProfile(item) {
    return {
        teacherId: item.teacherId ?? 'teacher-demo-1',
        averageScore: Number(item.studentEvaluation?.averageScore ?? 0),
        observationCount: Number(item.supervision?.observationCount ?? 0),
        highRiskCount: Number(item.parentFeedback?.highRiskCount ?? 0),
        selfEvaluationCount: Number(item.growth?.selfEvaluationCount ?? 0),
        riskSignals: Array.isArray(item.riskSignals) ? item.riskSignals : []
    };
}
