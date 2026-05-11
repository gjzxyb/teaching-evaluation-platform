import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { EvaluationAnswerInput } from '@tep/shared';
import {
  loadStudentData,
  saveDraft,
  seedDemoData,
  submitAnswers,
  type StudentData,
  type StudentTodo
} from './api.js';

type View = 'todo' | 'form' | 'history';

function App() {
  const [view, setView] = useState<View>('todo');
  const [studentData, setStudentData] = useState<StudentData | undefined>();
  const [activeTodo, setActiveTodo] = useState<StudentTodo | undefined>();
  const [answers, setAnswers] = useState<EvaluationAnswerInput[]>([]);
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

  const updateAnswer = (questionId: string, patch: Partial<EvaluationAnswerInput>) => {
    setAnswers((current) =>
      current.map((answer) => answer.questionId === questionId ? { ...answer, ...patch } : answer)
    );
    setStatusText('草稿未保存');
  };

  const handleOpenForm = (todo: StudentTodo) => {
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
    } finally {
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
    return <Shell><p>正在加载学生端数据...</p></Shell>;
  }

  return (
    <Shell source={studentData.source}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>学生评教</h1>
          <p style={{ margin: 0, color: '#607080' }}>2025-2026 春季学期 · 默认匿名提交</p>
        </div>
        <button type="button" onClick={() => setView(view === 'history' ? 'todo' : 'history')}>
          {view === 'history' ? '待办' : '历史'}
        </button>
      </header>

      {view === 'todo' && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>待办评价</h2>
          {studentData.todos.length === 0 ? (
            <div style={emptyStyle}>
              <p>暂无待办评价</p>
              {studentData.source === 'api' ? (
                <button type="button" onClick={handleSeedDemo} disabled={isSeeding}>
                  {isSeeding ? '正在初始化...' : '初始化演示数据'}
                </button>
              ) : null}
            </div>
          ) : null}
          {studentData.todos.map((todo) => (
            <article key={todo.instance.id} style={todoStyle}>
              <strong>{todo.task.taskName}</strong>
              <p>对象：{todo.instance.targetId}</p>
              <p>状态：{todo.instance.status === 'draft' ? '草稿' : '待提交'}</p>
              <button type="button" onClick={() => handleOpenForm(todo)}>
                {todo.instance.status === 'draft' ? '继续填写' : '开始填写'}
              </button>
            </article>
          ))}
        </section>
      )}

      {view === 'form' && activeTodo && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>{activeTodo.template.templateName}</h2>
          <p style={{ color: '#607080' }}>当前状态：{statusText}</p>
          {activeTodo.template.questions.map((question) => {
            const answer = answers.find((item) => item.questionId === question.id);
            return (
              <div key={question.id} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>{question.title}</label>
                {question.type === 'rating' ? (
                  <input
                    type="number"
                    min={1}
                    max={question.maxScore}
                    value={answer?.scoreValue ?? ''}
                    onChange={(event) => updateAnswer(question.id, { scoreValue: Number(event.target.value) })}
                  />
                ) : (
                  <textarea
                    rows={4}
                    value={answer?.textValue ?? ''}
                    onChange={(event) => updateAnswer(question.id, { textValue: event.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSaveDraft}>保存草稿</button>
            <button type="button" onClick={handleSubmit}>提交</button>
          </div>
        </section>
      )}

      {view === 'history' && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>历史记录</h2>
          {studentData.history.length === 0 ? <p>暂无已提交记录</p> : null}
          {studentData.history.map((response) => (
            <article key={`${response.instance.id}-${response.submittedAt ?? response.status}`} style={todoStyle}>
              <strong>{response.instance.taskId}</strong>
              <p>总分：{response.totalScore}</p>
              <p>状态：{response.status === 'submitted' ? '已提交' : '草稿'}</p>
            </article>
          ))}
        </section>
      )}
    </Shell>
  );
}

function Shell({ children, source }: { children: React.ReactNode; source?: StudentData['source'] }) {
  return (
    <main style={appStyle}>
      {source ? (
        <div style={sourceStyle}>{source === 'api' ? 'API 数据' : '演示数据'}</div>
      ) : null}
      {children}
    </main>
  );
}

function createInitialAnswers(todo: StudentTodo | undefined): EvaluationAnswerInput[] {
  if (!todo) {
    return [];
  }
  return todo.template.questions.map((question) => ({
    questionId: question.id,
    scoreValue: question.type === 'rating' ? Math.min(question.maxScore ?? 5, 5) : undefined,
    textValue: question.type === 'text' ? '课堂节奏清晰' : undefined
  }));
}

function createFallbackSubmittedResponse(todo: StudentTodo, answers: EvaluationAnswerInput[]) {
  return {
    instance: { ...todo.instance, status: 'submitted' as const },
    status: 'submitted' as const,
    totalScore: answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0),
    answers,
    submittedAt: new Date().toISOString()
  };
}

const appStyle: React.CSSProperties = {
  fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
  maxWidth: 560,
  margin: '0 auto',
  padding: 16,
  color: '#1f2933',
  background: '#f7f8f5',
  minHeight: '100vh'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dde3df',
  borderRadius: 8,
  padding: 16,
  marginTop: 18
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  margin: '0 0 12px'
};

const todoStyle: React.CSSProperties = {
  borderTop: '1px solid #edf1ee',
  padding: '14px 0'
};

const emptyStyle: React.CSSProperties = {
  background: '#f7faf8',
  border: '1px dashed #c9d8cf',
  borderRadius: 8,
  padding: 14
};

const sourceStyle: React.CSSProperties = {
  background: '#e7f2ed',
  border: '1px solid #c9ddd3',
  borderRadius: 999,
  color: '#245546',
  display: 'inline-flex',
  fontSize: 13,
  marginBottom: 12,
  padding: '7px 10px'
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
