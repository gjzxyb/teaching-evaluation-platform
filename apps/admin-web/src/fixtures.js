export const fallbackTemplates = [
    { name: '课堂教学评价模板', type: '高校课程', version: 'v1', status: '已发布', questions: 3 },
    { name: '教师自评基础模板', type: '通用教师', version: 'draft', status: '草稿', questions: 5 },
    { name: '中小学家校反馈模板', type: 'K12 家长', version: 'draft', status: '草稿', questions: 4 }
];
export const fallbackTasks = [
    { name: '2026 春季课程评价', stage: '运行中', completion: '86%', template: '课堂教学评价模板' },
    { name: '期末教师自评', stage: '草稿', completion: '-', template: '教师自评基础模板' },
    { name: '课堂组织专项复评', stage: '已关闭', completion: '100%', template: '课堂教学评价模板' }
];
export const fallbackImprovements = [
    { id: 'IM-001', owner: '教师甲', problem: 'teaching-goal 维度均分低于阈值', status: '处理中', due: '2026-06-30' },
    { id: 'IM-002', owner: '教师乙', problem: '课堂组织反馈连续偏低', status: '待填写', due: '2026-06-25' },
    { id: 'IM-003', owner: '教师丙', problem: '文本意见高频提及节奏偏快', status: '已复评', due: '2026-07-05' }
];
export const fallbackLogs = [
    { type: '通知', action: 'eval.task.remind', target: 'task-1', result: 'sent' },
    { type: '审计', action: 'eval.response.submit', target: 'instance-1', result: 'recorded' },
    { type: '审计', action: 'improvement.ticket.close', target: 'improvement-1', result: 'recorded' }
];
