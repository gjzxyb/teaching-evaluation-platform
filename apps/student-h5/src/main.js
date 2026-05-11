import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { loadStudentData, saveDraft, seedDemoData, submitAnswers } from './api.js';
function App() {
    const [view, setView] = useState('todo');
    const [studentData, setStudentData] = useState();
    const [activeTodo, setActiveTodo] = useState();
    const [answers, setAnswers] = useState([]);
    const [statusText, setStatusText] = useState('待提交');
    const [isSeeding, setIsSeeding] = useState(false);
    useEffect(() => {
        let mounted = true;
        loadStudentData().then((data) => {
            if (!mounted) {
                return;
            }
            setStudentData(data);
            setActiveTodo(data.todos[0]);
            setAnswers(createInitialAnswers(data.todos[0]));
        });
        return () => {
            mounted = false;
        };
    }, []);
    const updateAnswer = (questionId, patch) => {
        setAnswers((current) => current.map((answer) => answer.questionId === questionId ? { ...answer, ...patch } : answer));
        setStatusText('草稿未保存');
    };
    const handleOpenForm = (todo) => {
        setActiveTodo(todo);
        setAnswers(createInitialAnswers(todo));
        setStatusText(todo.instance.status === 'draft' ? '草稿' : '待提交');
        setView('form');
    };
    const handleSaveDraft = async () => {
        if (!activeTodo) {
            return;
        }
        await saveDraft(activeTodo.instance.id, answers);
        setStatusText('草稿已保存');
    };
    const handleSeedDemo = async () => {
        setIsSeeding(true);
        try {
            const data = await seedDemoData();
            if (data) {
                setStudentData(data);
                setActiveTodo(data.todos[0]);
                setAnswers(createInitialAnswers(data.todos[0]));
            }
        }
        finally {
            setIsSeeding(false);
        }
    };
    const handleSubmit = async () => {
        if (!activeTodo || !studentData) {
            return;
        }
        const response = await submitAnswers(activeTodo.instance.id, answers);
        setStatusText('已提交');
        setStudentData({
            ...studentData,
            todos: studentData.todos.filter((todo) => todo.instance.id !== activeTodo.instance.id),
            history: response ? [response, ...studentData.history] : [
                createFallbackSubmittedResponse(activeTodo, answers),
                ...studentData.history
            ]
        });
        setView('history');
    };
    if (!studentData) {
        return _jsx(Shell, { children: _jsx("p", { children: "\u6B63\u5728\u52A0\u8F7D\u5B66\u751F\u7AEF\u6570\u636E..." }) });
    }
    return (_jsxs(Shell, { source: studentData.source, children: [_jsxs("header", { style: headerStyle, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: 24, margin: '0 0 4px' }, children: "\u5B66\u751F\u8BC4\u6559" }), _jsx("p", { style: { margin: 0, color: '#607080' }, children: "2025-2026 \u6625\u5B63\u5B66\u671F \u00B7 \u9ED8\u8BA4\u533F\u540D\u63D0\u4EA4" })] }), _jsx("button", { type: "button", onClick: () => setView(view === 'history' ? 'todo' : 'history'), children: view === 'history' ? '待办' : '历史' })] }), view === 'todo' && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: "\u5F85\u529E\u8BC4\u4EF7" }), studentData.todos.length === 0 ? (_jsxs("div", { style: emptyStyle, children: [_jsx("p", { children: "\u6682\u65E0\u5F85\u529E\u8BC4\u4EF7" }), studentData.source === 'api' ? (_jsx("button", { type: "button", onClick: handleSeedDemo, disabled: isSeeding, children: isSeeding ? '正在初始化...' : '初始化演示数据' })) : null] })) : null, studentData.todos.map((todo) => (_jsxs("article", { style: todoStyle, children: [_jsx("strong", { children: todo.task.taskName }), _jsxs("p", { children: ["\u5BF9\u8C61\uFF1A", todo.instance.targetId] }), _jsxs("p", { children: ["\u72B6\u6001\uFF1A", todo.instance.status === 'draft' ? '草稿' : '待提交'] }), _jsx("button", { type: "button", onClick: () => handleOpenForm(todo), children: todo.instance.status === 'draft' ? '继续填写' : '开始填写' })] }, todo.instance.id)))] })), view === 'form' && activeTodo && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: activeTodo.template.templateName }), _jsxs("p", { style: { color: '#607080' }, children: ["\u5F53\u524D\u72B6\u6001\uFF1A", statusText] }), activeTodo.template.questions.map((question) => {
                        const answer = answers.find((item) => item.questionId === question.id);
                        return (_jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { display: 'block', fontWeight: 700, marginBottom: 8 }, children: question.title }), question.type === 'rating' ? (_jsx("input", { type: "number", min: 1, max: question.maxScore, value: answer?.scoreValue ?? '', onChange: (event) => updateAnswer(question.id, { scoreValue: Number(event.target.value) }) })) : (_jsx("textarea", { rows: 4, value: answer?.textValue ?? '', onChange: (event) => updateAnswer(question.id, { textValue: event.target.value }), style: { width: '100%', boxSizing: 'border-box' } }))] }, question.id));
                    }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", onClick: handleSaveDraft, children: "\u4FDD\u5B58\u8349\u7A3F" }), _jsx("button", { type: "button", onClick: handleSubmit, children: "\u63D0\u4EA4" })] })] })), view === 'history' && (_jsxs("section", { style: panelStyle, children: [_jsx("h2", { style: titleStyle, children: "\u5386\u53F2\u8BB0\u5F55" }), studentData.history.length === 0 ? _jsx("p", { children: "\u6682\u65E0\u5DF2\u63D0\u4EA4\u8BB0\u5F55" }) : null, studentData.history.map((response) => (_jsxs("article", { style: todoStyle, children: [_jsx("strong", { children: response.instance.taskId }), _jsxs("p", { children: ["\u603B\u5206\uFF1A", response.totalScore] }), _jsxs("p", { children: ["\u72B6\u6001\uFF1A", response.status === 'submitted' ? '已提交' : '草稿'] })] }, `${response.instance.id}-${response.submittedAt ?? response.status}`)))] }))] }));
}
function Shell({ children, source }) {
    return (_jsxs("main", { style: appStyle, children: [source ? (_jsx("div", { style: sourceStyle, children: source === 'api' ? 'API 数据' : '演示数据' })) : null, children] }));
}
function createInitialAnswers(todo) {
    if (!todo) {
        return [];
    }
    return todo.template.questions.map((question) => ({
        questionId: question.id,
        scoreValue: question.type === 'rating' ? Math.min(question.maxScore ?? 5, 5) : undefined,
        textValue: question.type === 'text' ? '课堂节奏清晰' : undefined
    }));
}
function createFallbackSubmittedResponse(todo, answers) {
    return {
        instance: { ...todo.instance, status: 'submitted' },
        status: 'submitted',
        totalScore: answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0),
        answers,
        submittedAt: new Date().toISOString()
    };
}
const appStyle = {
    fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
    maxWidth: 560,
    margin: '0 auto',
    padding: 16,
    color: '#1f2933',
    background: '#f7f8f5',
    minHeight: '100vh'
};
const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
};
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
const todoStyle = {
    borderTop: '1px solid #edf1ee',
    padding: '14px 0'
};
const emptyStyle = {
    background: '#f7faf8',
    border: '1px dashed #c9d8cf',
    borderRadius: 8,
    padding: 14
};
const sourceStyle = {
    background: '#e7f2ed',
    border: '1px solid #c9ddd3',
    borderRadius: 999,
    color: '#245546',
    display: 'inline-flex',
    fontSize: 13,
    marginBottom: 12,
    padding: '7px 10px'
};
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
