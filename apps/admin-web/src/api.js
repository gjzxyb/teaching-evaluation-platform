import { fallbackImprovements, fallbackLogs, fallbackTasks, fallbackTemplates } from './fixtures.js';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TENANT_ID = 'demo';
export async function loadAdminData() {
    if (!API_BASE_URL) {
        return getFallbackData();
    }
    try {
        const [templates, tasks, improvements, notifyLogs, auditLogs] = await Promise.all([
            getJson(`/templates?tenantId=${TENANT_ID}`),
            getJson(`/eval/tasks?tenantId=${TENANT_ID}`),
            getJson(`/improvement-tickets?tenantId=${TENANT_ID}`),
            getJson(`/notify/logs?tenantId=${TENANT_ID}`),
            getJson(`/audit-logs?tenantId=${TENANT_ID}`)
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
            }
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
        }
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
