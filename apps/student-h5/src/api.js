const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? 'demo';
const USER_ID = import.meta.env.VITE_USER_ID ?? 'u-student-1';
const fallbackQuestions = [
    { id: 'q1', title: '课程目标是否清晰', type: 'rating', indicatorKey: 'teaching-goal', maxScore: 5 },
    { id: 'q2', title: '课堂组织是否有序', type: 'rating', indicatorKey: 'class-control', maxScore: 5 },
    { id: 'q3', title: '请填写意见', type: 'text', indicatorKey: 'comments' }
];
export async function loadStudentData() {
    if (!API_BASE_URL) {
        return getFallbackData();
    }
    try {
        const [instances, history] = await Promise.all([
            getJson(`/eval/my-tasks/${USER_ID}`),
            getJson(`/eval/history/${USER_ID}?tenantId=${TENANT_ID}`)
        ]);
        const todos = await Promise.all(instances
            .filter((instance) => instance.status !== 'submitted' && instance.status !== 'expired')
            .map(async (instance) => {
            const detail = await getJson(`/eval/instances/${instance.id}?tenantId=${TENANT_ID}&userId=${USER_ID}`);
            return detail;
        }));
        return { source: 'api', todos, history };
    }
    catch {
        return getFallbackData();
    }
}
export async function seedDemoData() {
    if (!API_BASE_URL) {
        return undefined;
    }
    await postJson(`/eval/demo/seed?tenantId=${TENANT_ID}`, {});
    return loadStudentData();
}
export async function saveDraft(instanceId, answers) {
    if (!API_BASE_URL) {
        return undefined;
    }
    return postJson(`/eval/instances/${instanceId}/draft`, {
        tenantId: TENANT_ID,
        evaluatorUserId: USER_ID,
        answers
    });
}
export async function submitAnswers(instanceId, answers) {
    if (!API_BASE_URL) {
        return undefined;
    }
    return postJson(`/eval/instances/${instanceId}/submit`, {
        tenantId: TENANT_ID,
        evaluatorUserId: USER_ID,
        answers
    });
}
function getFallbackData() {
    return {
        source: 'fallback',
        todos: [
            {
                instance: {
                    id: 'fallback-instance-1',
                    tenantId: TENANT_ID,
                    taskId: 'fallback-task-1',
                    evaluatorUserId: USER_ID,
                    targetTeacherId: 'teacher-demo-1',
                    targetId: 'course-demo-1',
                    status: 'pending'
                },
                task: {
                    id: 'fallback-task-1',
                    tenantId: TENANT_ID,
                    taskName: '2026 春季课程评价',
                    schoolYear: '2025-2026',
                    termCode: 'spring',
                    templateId: 'tpl-course-basic',
                    sampleThreshold: 1,
                    status: 'running'
                },
                template: {
                    id: 'tpl-course-basic',
                    tenantId: TENANT_ID,
                    templateName: '课堂教学评价模板',
                    anonymousMode: 'anonymous',
                    targetType: 'course',
                    questions: fallbackQuestions
                }
            }
        ],
        history: []
    };
}
async function getJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    return unwrap(response);
}
async function postJson(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
    return unwrap(response);
}
async function unwrap(response) {
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    const envelope = await response.json();
    if (envelope.code !== 0) {
        throw new Error(envelope.message);
    }
    return envelope.data;
}
