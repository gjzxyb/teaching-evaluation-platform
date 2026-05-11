import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { EvaluationAnswerInput, EvaluationQuestion } from '@tep/shared';

const questions: EvaluationQuestion[] = [
  { id: 'q1', title: '课程目标是否清晰', type: 'rating', indicatorKey: 'teaching-goal', maxScore: 5 },
  { id: 'q2', title: '课堂组织是否有序', type: 'rating', indicatorKey: 'class-control', maxScore: 5 },
  { id: 'q3', title: '请填写意见', type: 'text', indicatorKey: 'comments' }
];

function App() {
  const [view, setView] = useState<'todo' | 'form' | 'history'>('todo');
  const [answers, setAnswers] = useState<EvaluationAnswerInput[]>([
    { questionId: 'q1', scoreValue: 4 },
    { questionId: 'q2', scoreValue: 5 },
    { questionId: 'q3', textValue: '课堂节奏清晰' }
  ]);
  const [status, setStatus] = useState<'pending' | 'draft' | 'submitted'>('pending');

  const updateAnswer = (questionId: string, patch: Partial<EvaluationAnswerInput>) => {
    setAnswers((current) =>
      current.map((answer) => answer.questionId === questionId ? { ...answer, ...patch } : answer)
    );
    setStatus('draft');
  };

  return (
    <main style={{
      fontFamily: 'system-ui',
      maxWidth: 520,
      margin: '0 auto',
      padding: 16,
      color: '#1f2933',
      background: '#f7f8f5',
      minHeight: '100vh'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>学生评教</h1>
          <p style={{ margin: 0, color: '#607080' }}>2025-2026 春季学期</p>
        </div>
        <button type="button" onClick={() => setView(view === 'history' ? 'todo' : 'history')}>
          {view === 'history' ? '待办' : '历史'}
        </button>
      </header>

      {view === 'todo' && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>2026 春季课程评价</h2>
          <p>对象：高等数学 A</p>
          <p>状态：{status === 'submitted' ? '已提交' : status === 'draft' ? '草稿' : '待提交'}</p>
          <button type="button" disabled={status === 'submitted'} onClick={() => setView('form')}>
            {status === 'draft' ? '继续填写' : '开始填写'}
          </button>
        </section>
      )}

      {view === 'form' && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>课堂教学评价模板</h2>
          {questions.map((question) => {
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
            <button type="button" onClick={() => setStatus('draft')}>保存草稿</button>
            <button type="button" onClick={() => { setStatus('submitted'); setView('history'); }}>提交</button>
          </div>
        </section>
      )}

      {view === 'history' && (
        <section style={panelStyle}>
          <h2 style={titleStyle}>历史记录</h2>
          {status === 'submitted' ? (
            <article>
              <p>2026 春季课程评价</p>
              <p>总分：{answers.reduce((sum, answer) => sum + (answer.scoreValue ?? 0), 0)}</p>
              <p>状态：已提交</p>
            </article>
          ) : (
            <p>暂无已提交记录</p>
          )}
        </section>
      )}
    </main>
  );
}

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
