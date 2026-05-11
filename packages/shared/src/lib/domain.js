export function issueSessionToken(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}
export function buildInitialInstances(task, template, students) {
    return students
        .filter((user) => user.tenantId === task.tenantId && user.roles.includes('student'))
        .map((user, index) => ({
        id: `${task.id}-instance-${index + 1}`,
        tenantId: task.tenantId,
        taskId: task.id,
        evaluatorUserId: user.id,
        targetTeacherId: 'teacher-demo-1',
        targetId: `${template.targetType}-demo-1`,
        status: 'pending'
    }));
}
export function createDraftResponse(instance, template, answers) {
    validateAnswers(template, answers);
    return {
        instance: { ...instance, status: 'draft' },
        status: 'draft',
        totalScore: computeTotalScore(answers),
        answers
    };
}
export function submitResponse(instance, template, answers) {
    validateAnswers(template, answers);
    return {
        instance: { ...instance, status: 'submitted' },
        status: 'submitted',
        totalScore: computeTotalScore(answers),
        answers,
        submittedAt: new Date().toISOString()
    };
}
export function aggregateTeacherReport(tenantId, teacherId, responses) {
    const submitted = responses.filter((response) => response.status === 'submitted');
    const totalScore = submitted.reduce((sum, response) => sum + response.totalScore, 0);
    const allTexts = submitted.flatMap((response) => response.answers.map((answer) => answer.textValue ?? '').filter(Boolean));
    return {
        tenantId,
        teacherId,
        submittedCount: submitted.length,
        averageScore: submitted.length === 0 ? 0 : Number((totalScore / submitted.length).toFixed(2)),
        keywords: extractKeywords(allTexts)
    };
}
function computeTotalScore(answers) {
    return answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0);
}
function validateAnswers(template, answers) {
    const questionIds = new Set(template.questions.map((question) => question.id));
    for (const answer of answers) {
        if (!questionIds.has(answer.questionId)) {
            throw new Error(`Unknown question: ${answer.questionId}`);
        }
    }
}
function extractKeywords(comments) {
    const counts = new Map();
    for (const comment of comments) {
        for (const word of comment.split(/[\s,，。；;！!？?]+/u)) {
            const normalized = word.trim();
            if (normalized.length < 2) {
                continue;
            }
            counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([word]) => word);
}
