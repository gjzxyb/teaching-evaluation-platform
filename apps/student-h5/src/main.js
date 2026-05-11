import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
const questions = [
    { id: 'q1', title: '课程目标是否清晰', type: 'rating', indicatorKey: 'teaching-goal', maxScore: 5 },
    { id: 'q2', title: '课堂组织是否有序', type: 'rating', indicatorKey: 'class-control', maxScore: 5 },
    { id: 'q3', title: '请填写意见', type: 'text', indicatorKey: 'comments' }
];
function App() {
    const [view, setView] = useState('todo');
    const [answers, setAnswers] = useState([
        { questionId: 'q1', scoreValue: 4 },
        { questionId: 'q2', scoreValue: 5 },
        { questionId: 'q3', textValue: '课堂节奏清晰' }
    ]);
    const [status, setStatus] = useState('pending');
    const updateAnswer = (questionId, patch) => {
        setAnswers((current) => current.map((answer) => answer.questionId === questionId ? { ...answer, ...patch } : answer));
        setStatus('draft');
    };
    return (_jsxs("main", { style: {
            fontFamily: 'system-ui',
            maxWidth: 520,
            margin: '0 auto',
            padding: 16,
            color: '#1f2933',
            background: '#f7f8f5',
            minHeight: '100vh'
        }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: 24, margin: '0 0 4px' }, children: "\u5B66\u751F\u8BC4\u6559" }), _jsx("p", { style: { margin: 0, color: '#607080' }, children: "2025-2026 \u6625\u5B63\u5B66\u671F" })] }), _jsx("button", { type: "button", onClick: () => setView(view === 'history' ? 'todo' : 'history'), children: view === 'history' ? '待办' : '历史' })] }), view === 'todo' && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: "2026 \u6625\u5B63\u8BFE\u7A0B\u8BC4\u4EF7" }), _jsx("p", { children: "\u5BF9\u8C61\uFF1A\u9AD8\u7B49\u6570\u5B66 A" }), _jsxs("p", { children: ["\u72B6\u6001\uFF1A", status === 'submitted' ? '已提交' : status === 'draft' ? '草稿' : '待提交'] }), _jsx("button", { type: "button", disabled: status === 'submitted', onClick: () => setView('form'), children: status === 'draft' ? '继续填写' : '开始填写' })] })), view === 'form' && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: "\u8BFE\u5802\u6559\u5B66\u8BC4\u4EF7\u6A21\u677F" }), questions.map((question) => {
                        const answer = answers.find((item) => item.questionId === question.id);
                        return (_jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { display: 'block', fontWeight: 700, marginBottom: 8 }, children: question.title }), question.type === 'rating' ? (_jsx("input", { type: "number", min: 1, max: question.maxScore, value: answer?.scoreValue ?? '', onChange: (event) => updateAnswer(question.id, { scoreValue: Number(event.target.value) }) })) : (_jsx("textarea", { rows: 4, value: answer?.textValue ?? '', onChange: (event) => updateAnswer(question.id, { textValue: event.target.value }), style: { width: '100%', boxSizing: 'border-box' } }))] }, question.id));
                    }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", onClick: () => setStatus('draft'), children: "\u4FDD\u5B58\u8349\u7A3F" }), _jsx("button", { type: "button", onClick: () => { setStatus('submitted'); setView('history'); }, children: "\u63D0\u4EA4" })] })] })), view === 'history' && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: "\u5386\u53F2\u8BB0\u5F55" }), status === 'submitted' ? (_jsxs("article", { children: [_jsx("p", { children: "2026 \u6625\u5B63\u8BFE\u7A0B\u8BC4\u4EF7" }), _jsxs("p", { children: ["\u603B\u5206\uFF1A", answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0)] }), _jsx("p", { children: "\u72B6\u6001\uFF1A\u5DF2\u63D0\u4EA4" })] })) : (_jsx("p", { children: "\u6682\u65E0\u5DF2\u63D0\u4EA4\u8BB0\u5F55" }))] }))] }));
}
const panelStyle = {
    background: '#fff',
    border: '1px solid #dde3df',
    borderRadius: 8,
    padding: 16,
    marginTop: 18
};
const titleStyle = {
    fontSize: 18,
    margin: '0 0 12px'
};
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
