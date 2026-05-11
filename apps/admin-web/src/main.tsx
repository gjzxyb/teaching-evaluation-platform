import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { loadAdminData, type AdminData } from './api.js';
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
  const [adminData, setAdminData] = useState<AdminData | undefined>();

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
    return (
      <div className="loading-screen">
        <strong>教学评价与改进平台</strong>
        <span>正在加载管理后台数据</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">TE</span>
          <div>
            <strong>教学评价平台</strong>
            <small>多租户管理后台</small>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Demo School</p>
            <h1>教学评价与改进平台</h1>
          </div>
          <div className="topbar-actions">
            <span className={adminData.source === 'api' ? 'source-chip ok' : 'source-chip'}>
              {adminData.source === 'api' ? 'API 数据' : '演示数据'}
            </span>
            <div className="user-chip">平台管理员</div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard data={adminData} />} />
          <Route path="/templates" element={<TemplatesPage data={adminData} />} />
          <Route path="/tasks" element={<TasksPage data={adminData} />} />
          <Route path="/reports" element={<ReportsPage data={adminData} />} />
          <Route path="/improvements" element={<ImprovementsPage data={adminData} />} />
          <Route path="/teacher-workbench" element={<TeacherWorkbenchPage data={adminData} />} />
          <Route path="/supervision" element={<SupervisionPage data={adminData} />} />
          <Route path="/parent-feedback" element={<ParentFeedbackPage data={adminData} />} />
          <Route path="/composite-analysis" element={<CompositeAnalysisPage data={adminData} />} />
          <Route path="/messages" element={<MessagesPage data={adminData} />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: AdminData }) {
  const metrics = [
    { label: '任务数量', value: String(data.tasks.length), trend: data.tasks.some((task) => task.stage === 'running') ? '存在运行任务' : '待发布' },
    { label: '完成率', value: data.report.completionRate, trend: data.report.completionText },
    { label: '待整改', value: String(data.improvements.length), trend: data.improvements.some((item) => item.status !== 'closed') ? '需跟进' : '已闭环' },
    { label: '日志数量', value: String(data.logs.length), trend: '通知与审计' }
  ];

  return (
    <>
      <section className="metric-grid">
        {metrics.map((item) => (
          <article className="metric-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.trend}</small>
          </article>
        ))}
      </section>
      <section className="content-grid">
        <Panel title="任务运行">
          <DataTable
            columns={['任务', '阶段', '完成率']}
            rows={data.tasks.map((task) => [task.name, task.stage, task.completion])}
          />
        </Panel>
        <Panel title="整改风险">
          <DataTable
            columns={['编号', '责任人', '状态']}
            rows={data.improvements.map((item) => [item.id, item.owner, item.status])}
          />
        </Panel>
      </section>
    </>
  );
}

function TemplatesPage({ data }: { data: AdminData }) {
  return (
    <Panel title="模板与题库中心" action="新建模板">
      <DataTable
        columns={['模板名称', '类型', '版本', '状态', '题目数']}
        rows={data.templates.map((item) => [item.name, item.type, item.version, item.status, String(item.questions)])}
      />
    </Panel>
  );
}

function TasksPage({ data }: { data: AdminData }) {
  return (
    <Panel title="评价任务中心" action="发布任务">
      <DataTable
        columns={['任务名称', '阶段', '完成率', '模板']}
        rows={data.tasks.map((task) => [task.name, task.stage, task.completion, task.template])}
      />
    </Panel>
  );
}

function ReportsPage({ data }: { data: AdminData }) {
  return (
    <section className="content-grid">
      <Panel title="完成率报表">
        <div className="report-band">
          <strong>{data.report.completionRate}</strong>
          <span>{data.report.completionText}</span>
        </div>
      </Panel>
      <Panel title="维度均分">
        <DataTable
          columns={['指标', '均分', '状态']}
          rows={data.report.dimensions}
        />
      </Panel>
    </section>
  );
}

function ImprovementsPage({ data }: { data: AdminData }) {
  return (
    <Panel title="整改闭环" action="生成整改单">
      <DataTable
        columns={['编号', '责任人', '问题', '状态', '截止日']}
        rows={data.improvements.map((item) => [item.id, item.owner, item.problem, item.status, item.due])}
      />
    </Panel>
  );
}

function TeacherWorkbenchPage({ data }: { data: AdminData }) {
  return (
    <section className="content-grid">
      <Panel title="教师结果概览">
        <div className="report-band stacked">
          <strong>{data.teacherOverview.averageScore.toFixed(1)}</strong>
          <span>
            {data.teacherOverview.teacherId} · 已提交样本 {data.teacherOverview.submittedCount}
          </span>
        </div>
        <div className="tag-row">
          {data.teacherOverview.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
      </Panel>
      <Panel title="自评与成长档案">
        <DataTable
          columns={['任务', '优势', '短板', '改进计划']}
          rows={data.teacherOverview.selfEvaluations.map((item) => [
            item.taskId,
            item.strengths,
            item.weaknesses,
            item.improvementPlan
          ])}
        />
      </Panel>
    </section>
  );
}

function SupervisionPage({ data }: { data: AdminData }) {
  return (
    <section className="content-grid">
      <Panel title="课堂观察任务" action="创建观察任务">
        <DataTable
          columns={['任务', '教师', '督导', '状态', '计划时间']}
          rows={data.supervision.tasks}
        />
      </Panel>
      <Panel title="观察记录与整改触发">
        <DataTable
          columns={['记录', '教师', '维度评分', '整改单数']}
          rows={data.supervision.observations}
        />
      </Panel>
    </section>
  );
}

function ParentFeedbackPage({ data }: { data: AdminData }) {
  return (
    <Panel title="家长反馈" action="处理高风险">
      <DataTable
        columns={['编号', '学生', '班级', '类别', '风险', '状态']}
        rows={data.parentFeedback.map((item) => [
          item.id,
          item.studentId,
          item.classOrgId,
          item.category,
          item.riskLevel,
          item.status
        ])}
      />
    </Panel>
  );
}

function CompositeAnalysisPage({ data }: { data: AdminData }) {
  const profile = data.compositeProfile;
  return (
    <section className="content-grid">
      <Panel title="教师综合画像">
        <div className="profile-grid">
          <Metric label="评价均分" value={profile.averageScore.toFixed(1)} />
          <Metric label="观察次数" value={String(profile.observationCount)} />
          <Metric label="高风险反馈" value={String(profile.highRiskCount)} />
          <Metric label="自评记录" value={String(profile.selfEvaluationCount)} />
        </div>
      </Panel>
      <Panel title="风险信号">
        <div className="tag-row warning">
          {profile.riskSignals.length === 0 ? <span>暂无风险信号</span> : null}
          {profile.riskSignals.map((signal) => <span key={signal}>{signal}</span>)}
        </div>
      </Panel>
    </section>
  );
}

function MessagesPage({ data }: { data: AdminData }) {
  const notifyRows = data.logs.filter((log) => log.type === '通知');
  const auditRows = data.logs.filter((log) => log.type === '审计');

  return (
    <section className="content-grid">
      <Panel title="通知日志">
        <DataTable
          columns={['类型', '动作', '目标', '结果']}
          rows={notifyRows.map((log) => [log.type, log.action, log.target, log.result])}
        />
      </Panel>
      <Panel title="审计日志">
        <DataTable
          columns={['类型', '动作', '目标', '结果']}
          rows={auditRows.map((log) => [log.type, log.action, log.target, log.result])}
        />
      </Panel>
    </section>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {action ? <button type="button">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>暂无数据</td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Shell />
    </HashRouter>
  </React.StrictMode>
);
