import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { loadAdminData } from './api.js';
import './styles.css';
const navItems = [
    { to: '/', label: '驾驶舱' },
    { to: '/templates', label: '模板题库' },
    { to: '/tasks', label: '评价任务' },
    { to: '/reports', label: '基础报表' },
    { to: '/improvements', label: '整改闭环' },
    { to: '/teacher-workbench', label: '教师端' },
    { to: '/supervision', label: '督导端' },
    { to: '/parent-feedback', label: '家长反馈' },
    { to: '/composite-analysis', label: '综合分析' },
    { to: '/messages', label: '消息审计' }
];
function Shell() {
    const [adminData, setAdminData] = useState();
    useEffect(() => {
        let mounted = true;
        loadAdminData().then((data) => {
            if (mounted) {
                setAdminData(data);
            }
        });
        return () => {
            mounted = false;
        };
    }, []);
    if (!adminData) {
        return (_jsxs("div", { className: "loading-screen", children: [_jsx("strong", { children: "\u6559\u5B66\u8BC4\u4EF7\u4E0E\u6539\u8FDB\u5E73\u53F0" }), _jsx("span", { children: "\u6B63\u5728\u52A0\u8F7D\u7BA1\u7406\u540E\u53F0\u6570\u636E" })] }));
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "brand", children: [_jsx("span", { className: "brand-mark", children: "TE" }), _jsxs("div", { children: [_jsx("strong", { children: "\u6559\u5B66\u8BC4\u4EF7\u5E73\u53F0" }), _jsx("small", { children: "\u591A\u79DF\u6237\u7BA1\u7406\u540E\u53F0" })] })] }), _jsx("nav", { className: "nav-list", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, end: item.to === '/', children: item.label }, item.to))) })] }), _jsxs("main", { className: "main", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Demo School" }), _jsx("h1", { children: "\u6559\u5B66\u8BC4\u4EF7\u4E0E\u6539\u8FDB\u5E73\u53F0" })] }), _jsxs("div", { className: "topbar-actions", children: [_jsx("span", { className: adminData.source === 'api' ? 'source-chip ok' : 'source-chip', children: adminData.source === 'api' ? 'API 数据' : '演示数据' }), _jsx("div", { className: "user-chip", children: "\u5E73\u53F0\u7BA1\u7406\u5458" })] })] }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, { data: adminData }) }), _jsx(Route, { path: "/templates", element: _jsx(TemplatesPage, { data: adminData }) }), _jsx(Route, { path: "/tasks", element: _jsx(TasksPage, { data: adminData }) }), _jsx(Route, { path: "/reports", element: _jsx(ReportsPage, { data: adminData }) }), _jsx(Route, { path: "/improvements", element: _jsx(ImprovementsPage, { data: adminData }) }), _jsx(Route, { path: "/teacher-workbench", element: _jsx(TeacherWorkbenchPage, { data: adminData }) }), _jsx(Route, { path: "/supervision", element: _jsx(SupervisionPage, { data: adminData }) }), _jsx(Route, { path: "/parent-feedback", element: _jsx(ParentFeedbackPage, { data: adminData }) }), _jsx(Route, { path: "/composite-analysis", element: _jsx(CompositeAnalysisPage, { data: adminData }) }), _jsx(Route, { path: "/messages", element: _jsx(MessagesPage, { data: adminData }) })] })] })] }));
}
function Dashboard({ data }) {
    const metrics = [
        { label: '任务数量', value: String(data.tasks.length), trend: data.tasks.some((task) => task.stage === 'running') ? '存在运行任务' : '待发布' },
        { label: '完成率', value: data.report.completionRate, trend: data.report.completionText },
        { label: '待整改', value: String(data.improvements.length), trend: data.improvements.some((item) => item.status !== 'closed') ? '需跟进' : '已闭环' },
        { label: '日志数量', value: String(data.logs.length), trend: '通知与审计' }
    ];
    return (_jsxs(_Fragment, { children: [_jsx("section", { className: "metric-grid", children: metrics.map((item) => (_jsxs("article", { className: "metric-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value }), _jsx("small", { children: item.trend })] }, item.label))) }), _jsxs("section", { className: "content-grid", children: [_jsx(Panel, { title: "\u4EFB\u52A1\u8FD0\u884C", children: _jsx(DataTable, { columns: ['任务', '阶段', '完成率'], rows: data.tasks.map((task) => [task.name, task.stage, task.completion]) }) }), _jsx(Panel, { title: "\u6574\u6539\u98CE\u9669", children: _jsx(DataTable, { columns: ['编号', '责任人', '状态'], rows: data.improvements.map((item) => [item.id, item.owner, item.status]) }) })] })] }));
}
function TemplatesPage({ data }) {
    return (_jsx(Panel, { title: "\u6A21\u677F\u4E0E\u9898\u5E93\u4E2D\u5FC3", action: "\u65B0\u5EFA\u6A21\u677F", children: _jsx(DataTable, { columns: ['模板名称', '类型', '版本', '状态', '题目数'], rows: data.templates.map((item) => [item.name, item.type, item.version, item.status, String(item.questions)]) }) }));
}
function TasksPage({ data }) {
    return (_jsx(Panel, { title: "\u8BC4\u4EF7\u4EFB\u52A1\u4E2D\u5FC3", action: "\u53D1\u5E03\u4EFB\u52A1", children: _jsx(DataTable, { columns: ['任务名称', '阶段', '完成率', '模板'], rows: data.tasks.map((task) => [task.name, task.stage, task.completion, task.template]) }) }));
}
function ReportsPage({ data }) {
    return (_jsxs("section", { className: "content-grid", children: [_jsx(Panel, { title: "\u5B8C\u6210\u7387\u62A5\u8868", children: _jsxs("div", { className: "report-band", children: [_jsx("strong", { children: data.report.completionRate }), _jsx("span", { children: data.report.completionText })] }) }), _jsx(Panel, { title: "\u7EF4\u5EA6\u5747\u5206", children: _jsx(DataTable, { columns: ['指标', '均分', '状态'], rows: data.report.dimensions }) })] }));
}
function ImprovementsPage({ data }) {
    return (_jsx(Panel, { title: "\u6574\u6539\u95ED\u73AF", action: "\u751F\u6210\u6574\u6539\u5355", children: _jsx(DataTable, { columns: ['编号', '责任人', '问题', '状态', '截止日'], rows: data.improvements.map((item) => [item.id, item.owner, item.problem, item.status, item.due]) }) }));
}
function TeacherWorkbenchPage({ data }) {
    return (_jsxs("section", { className: "content-grid", children: [_jsxs(Panel, { title: "\u6559\u5E08\u7ED3\u679C\u6982\u89C8", children: [_jsxs("div", { className: "report-band stacked", children: [_jsx("strong", { children: data.teacherOverview.averageScore.toFixed(1) }), _jsxs("span", { children: [data.teacherOverview.teacherId, " \u00B7 \u5DF2\u63D0\u4EA4\u6837\u672C ", data.teacherOverview.submittedCount] })] }), _jsx("div", { className: "tag-row", children: data.teacherOverview.keywords.map((keyword) => _jsx("span", { children: keyword }, keyword)) })] }), _jsx(Panel, { title: "\u81EA\u8BC4\u4E0E\u6210\u957F\u6863\u6848", children: _jsx(DataTable, { columns: ['任务', '优势', '短板', '改进计划'], rows: data.teacherOverview.selfEvaluations.map((item) => [
                        item.taskId,
                        item.strengths,
                        item.weaknesses,
                        item.improvementPlan
                    ]) }) })] }));
}
function SupervisionPage({ data }) {
    return (_jsxs("section", { className: "content-grid", children: [_jsx(Panel, { title: "\u8BFE\u5802\u89C2\u5BDF\u4EFB\u52A1", action: "\u521B\u5EFA\u89C2\u5BDF\u4EFB\u52A1", children: _jsx(DataTable, { columns: ['任务', '教师', '督导', '状态', '计划时间'], rows: data.supervision.tasks }) }), _jsx(Panel, { title: "\u89C2\u5BDF\u8BB0\u5F55\u4E0E\u6574\u6539\u89E6\u53D1", children: _jsx(DataTable, { columns: ['记录', '教师', '维度评分', '整改单数'], rows: data.supervision.observations }) })] }));
}
function ParentFeedbackPage({ data }) {
    return (_jsx(Panel, { title: "\u5BB6\u957F\u53CD\u9988", action: "\u5904\u7406\u9AD8\u98CE\u9669", children: _jsx(DataTable, { columns: ['编号', '学生', '班级', '类别', '风险', '状态'], rows: data.parentFeedback.map((item) => [
                item.id,
                item.studentId,
                item.classOrgId,
                item.category,
                item.riskLevel,
                item.status
            ]) }) }));
}
function CompositeAnalysisPage({ data }) {
    const profile = data.compositeProfile;
    return (_jsxs("section", { className: "content-grid", children: [_jsx(Panel, { title: "\u6559\u5E08\u7EFC\u5408\u753B\u50CF", children: _jsxs("div", { className: "profile-grid", children: [_jsx(Metric, { label: "\u8BC4\u4EF7\u5747\u5206", value: profile.averageScore.toFixed(1) }), _jsx(Metric, { label: "\u89C2\u5BDF\u6B21\u6570", value: String(profile.observationCount) }), _jsx(Metric, { label: "\u9AD8\u98CE\u9669\u53CD\u9988", value: String(profile.highRiskCount) }), _jsx(Metric, { label: "\u81EA\u8BC4\u8BB0\u5F55", value: String(profile.selfEvaluationCount) })] }) }), _jsx(Panel, { title: "\u98CE\u9669\u4FE1\u53F7", children: _jsxs("div", { className: "tag-row warning", children: [profile.riskSignals.length === 0 ? _jsx("span", { children: "\u6682\u65E0\u98CE\u9669\u4FE1\u53F7" }) : null, profile.riskSignals.map((signal) => _jsx("span", { children: signal }, signal))] }) })] }));
}
function MessagesPage({ data }) {
    const notifyRows = data.logs.filter((log) => log.type === '通知');
    const auditRows = data.logs.filter((log) => log.type === '审计');
    return (_jsxs("section", { className: "content-grid", children: [_jsx(Panel, { title: "\u901A\u77E5\u65E5\u5FD7", children: _jsx(DataTable, { columns: ['类型', '动作', '目标', '结果'], rows: notifyRows.map((log) => [log.type, log.action, log.target, log.result]) }) }), _jsx(Panel, { title: "\u5BA1\u8BA1\u65E5\u5FD7", children: _jsx(DataTable, { columns: ['类型', '动作', '目标', '结果'], rows: auditRows.map((log) => [log.type, log.action, log.target, log.result]) }) })] }));
}
function Panel({ title, action, children }) {
    return (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { children: title }), action ? _jsx("button", { type: "button", children: action }) : null] }), children] }));
}
function Metric({ label, value }) {
    return (_jsxs("div", { className: "mini-metric", children: [_jsx("span", { children: label }), _jsx("strong", { children: value })] }));
}
function DataTable({ columns, rows }) {
    return (_jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => _jsx("th", { children: column }, column)) }) }), _jsx("tbody", { children: rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: "\u6682\u65E0\u6570\u636E" }) })) : rows.map((row) => (_jsx("tr", { children: row.map((cell, index) => _jsx("td", { children: cell }, `${cell}-${index}`)) }, row.join('|')))) })] }) }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(HashRouter, { children: _jsx(Shell, {}) }) }));
