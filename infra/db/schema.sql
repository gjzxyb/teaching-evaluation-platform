create table tenants (
  id varchar(64) primary key,
  code varchar(64) not null unique,
  name varchar(128) not null,
  status varchar(32) not null default 'active',
  deployment_mode varchar(32) not null default 'saas',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sys_user (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  username varchar(64) not null,
  real_name varchar(64) not null,
  mobile varchar(32),
  email varchar(128),
  user_type varchar(32) not null,
  status smallint not null default 1,
  auth_source varchar(32) not null default 'local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, username)
);

create table sys_role (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  role_code varchar(64) not null,
  role_name varchar(128) not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, role_code)
);

create table sys_permission (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  permission_code varchar(128) not null,
  permission_name varchar(128) not null,
  module_code varchar(64) not null,
  unique (tenant_id, permission_code)
);

create table sys_user_role (
  tenant_id varchar(64) not null references tenants(id),
  user_id varchar(64) not null references sys_user(id),
  role_id varchar(64) not null references sys_role(id),
  primary key (tenant_id, user_id, role_id)
);

create table sys_role_permission (
  tenant_id varchar(64) not null references tenants(id),
  role_id varchar(64) not null references sys_role(id),
  permission_id varchar(64) not null references sys_permission(id),
  primary key (tenant_id, role_id, permission_id)
);

create table sys_org_unit (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  parent_id varchar(64) references sys_org_unit(id),
  org_type varchar(32) not null,
  org_code varchar(64) not null,
  org_name varchar(128) not null,
  sort_no int not null default 0,
  status smallint not null default 1,
  unique (tenant_id, org_code)
);

create table sys_data_scope (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  principal_type varchar(32) not null,
  principal_id varchar(64) not null,
  scope_type varchar(32) not null,
  scope_id varchar(64) not null,
  created_at timestamptz not null default now()
);

create table base_teacher (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  user_id varchar(64) references sys_user(id),
  teacher_no varchar(64) not null,
  teacher_name varchar(64) not null,
  org_id varchar(64) references sys_org_unit(id),
  unique (tenant_id, teacher_no)
);

create table base_student (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  user_id varchar(64) references sys_user(id),
  student_no varchar(64) not null,
  student_name varchar(64) not null,
  class_org_id varchar(64) references sys_org_unit(id),
  unique (tenant_id, student_no)
);

create table base_course (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  course_code varchar(64) not null,
  course_name varchar(128) not null,
  owner_org_id varchar(64) references sys_org_unit(id),
  unique (tenant_id, course_code)
);

create table master_data_sync_job (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  entity_type varchar(32) not null,
  sync_mode varchar(32) not null default 'manual',
  source varchar(64),
  sync_type varchar(32),
  status varchar(32) not null,
  success_count int not null default 0,
  failure_count int not null default 0,
  error_payload jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table eval_indicator (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  indicator_code varchar(64) not null,
  indicator_name varchar(128) not null,
  description text,
  status varchar(32) not null default 'enabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, indicator_code)
);

create table eval_question (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  indicator_id varchar(64) not null references eval_indicator(id),
  question_title varchar(255) not null,
  question_type varchar(32) not null,
  max_score numeric(8, 2),
  options_json jsonb,
  status varchar(32) not null default 'enabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table eval_template (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  template_name varchar(128) not null,
  template_type varchar(32) not null,
  target_type varchar(32) not null,
  owner_org_id varchar(64) references sys_org_unit(id),
  version_no varchar(32) not null,
  status varchar(32) not null default 'draft',
  allow_teacher_append smallint not null default 0,
  anonymous_mode varchar(32) not null default 'anonymous',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table eval_template_question (
  template_id varchar(64) not null references eval_template(id),
  question_id varchar(64) not null references eval_question(id),
  tenant_id varchar(64) not null references tenants(id),
  sort_no int not null default 0,
  primary key (template_id, question_id)
);

create table eval_task (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_name varchar(128) not null,
  school_year varchar(32) not null,
  term_code varchar(32) not null,
  task_type varchar(32) not null default 'course_eval',
  template_id varchar(64) not null references eval_template(id),
  start_time timestamptz,
  end_time timestamptz,
  result_release_time timestamptz,
  sample_threshold int not null default 5,
  status varchar(32) not null default 'draft',
  created_by varchar(64) references sys_user(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table eval_task_target (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_id varchar(64) not null references eval_task(id),
  target_type varchar(32) not null,
  target_id varchar(64) not null,
  target_teacher_id varchar(64),
  created_at timestamptz not null default now()
);

create table eval_instance (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_id varchar(64) not null references eval_task(id),
  evaluator_user_id varchar(64) not null references sys_user(id),
  target_type varchar(32) not null,
  target_id varchar(64) not null,
  target_teacher_id varchar(64),
  status varchar(32) not null default 'pending',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table eval_response (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  instance_id varchar(64) not null references eval_instance(id),
  response_no varchar(64) not null,
  total_score numeric(8, 2) not null default 0,
  text_summary text,
  is_anonymous smallint not null default 1,
  submitted_at timestamptz,
  unique (tenant_id, instance_id)
);

create table eval_response_item (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  response_id varchar(64) not null references eval_response(id),
  question_id varchar(64) not null references eval_question(id),
  indicator_id varchar(64) references eval_indicator(id),
  score_value numeric(8, 2),
  option_value varchar(255),
  text_value text,
  sort_no int not null default 0
);

create table notify_log (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  channel varchar(32) not null,
  recipient_user_id varchar(64) references sys_user(id),
  biz_type varchar(64) not null,
  biz_id varchar(64) not null,
  status varchar(32) not null default 'pending',
  payload jsonb,
  created_at timestamptz not null default now()
);

create table audit_log (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  actor_user_id varchar(64) references sys_user(id),
  action varchar(128) not null,
  module varchar(64) not null,
  target_type varchar(64) not null,
  target_id varchar(128) not null,
  detail jsonb,
  trace_id varchar(128),
  created_at timestamptz not null default now()
);

create table storage_object (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  owner_user_id varchar(64) references sys_user(id),
  provider varchar(32) not null,
  object_key varchar(512) not null,
  filename varchar(255) not null,
  content_type varchar(128) not null,
  size_bytes bigint not null default 0,
  status varchar(32) not null default 'available',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table export_job (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  requester_user_id varchar(64) references sys_user(id),
  task_id varchar(64) references eval_task(id),
  report_type varchar(64) not null,
  export_format varchar(32) not null,
  status varchar(32) not null default 'pending',
  filename varchar(255) not null,
  object_id varchar(64) references storage_object(id),
  payload jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table eval_report_snapshot (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_id varchar(64) not null references eval_task(id),
  report_type varchar(64) not null,
  visible smallint not null default 0,
  sample_threshold int not null default 0,
  submitted_count int not null default 0,
  payload jsonb not null,
  generated_at timestamptz not null default now()
);

create table text_analysis_summary (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_id varchar(64) not null references eval_task(id),
  source varchar(32) not null default 'manual',
  provider varchar(64),
  keywords_payload jsonb,
  summary text,
  author_user_id varchar(64) references sys_user(id),
  created_at timestamptz not null default now()
);

create table eval_improvement_ticket (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  source_type varchar(32) not null,
  source_id varchar(128) not null,
  owner_user_id varchar(64) references sys_user(id),
  problem_desc text not null,
  root_cause text,
  action_plan text,
  due_date date not null,
  status varchar(32) not null default 'open',
  review_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teacher_self_evaluation (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  teacher_id varchar(64) not null references base_teacher(id),
  task_id varchar(64) references eval_task(id),
  strengths text not null,
  weaknesses text not null,
  improvement_plan text not null,
  status varchar(32) not null default 'submitted',
  created_at timestamptz not null default now()
);

create table supervision_observation_task (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  course_id varchar(64) references base_course(id),
  teacher_id varchar(64) references base_teacher(id),
  class_org_id varchar(64) references sys_org_unit(id),
  supervisor_user_id varchar(64) references sys_user(id),
  scheduled_at timestamptz not null,
  status varchar(32) not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table supervision_observation (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  task_id varchar(64) not null references supervision_observation_task(id),
  supervisor_user_id varchar(64) references sys_user(id),
  teacher_id varchar(64) references base_teacher(id),
  scores_payload jsonb not null,
  comments text,
  improvement_ticket_ids jsonb,
  submitted_at timestamptz not null default now()
);

create table parent_feedback (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  parent_user_id varchar(64) references sys_user(id),
  student_id varchar(64) references base_student(id),
  class_org_id varchar(64) references sys_org_unit(id),
  category varchar(32) not null,
  rating int not null,
  content text not null,
  risk_level varchar(32) not null default 'normal',
  status varchar(32) not null default 'submitted',
  handler_user_id varchar(64) references sys_user(id),
  handling_result text,
  submitted_at timestamptz not null default now(),
  handled_at timestamptz
);

create table composite_analysis_snapshot (
  id varchar(64) primary key,
  tenant_id varchar(64) not null references tenants(id),
  subject_type varchar(32) not null,
  subject_id varchar(64) not null,
  payload jsonb not null,
  generated_at timestamptz not null default now()
);

create index idx_user_tenant_type on sys_user(tenant_id, user_type);
create index idx_org_tenant_parent on sys_org_unit(tenant_id, parent_id);
create index idx_teacher_tenant_org on base_teacher(tenant_id, org_id);
create index idx_student_tenant_class on base_student(tenant_id, class_org_id);
create index idx_course_tenant_org on base_course(tenant_id, owner_org_id);
create index idx_master_data_sync_job on master_data_sync_job(tenant_id, entity_type, status, started_at);
create index idx_indicator_tenant_status on eval_indicator(tenant_id, status);
create index idx_question_tenant_indicator on eval_question(tenant_id, indicator_id);
create index idx_template_tenant_status on eval_template(tenant_id, status);
create index idx_template_question_template on eval_template_question(tenant_id, template_id);
create index idx_eval_task_tenant_status on eval_task(tenant_id, status, start_time, end_time);
create index idx_eval_instance_task_user on eval_instance(tenant_id, task_id, evaluator_user_id, status);
create index idx_eval_instance_user_status on eval_instance(tenant_id, evaluator_user_id, status);
create index idx_eval_response_instance on eval_response(tenant_id, instance_id);
create index idx_eval_response_submitted_at on eval_response(tenant_id, submitted_at);
create index idx_eval_response_item_response on eval_response_item(tenant_id, response_id, question_id);
create index idx_notify_log_biz on notify_log(tenant_id, biz_type, biz_id, status);
create index idx_audit_log_tenant_action on audit_log(tenant_id, action, created_at);
create index idx_audit_log_actor on audit_log(tenant_id, actor_user_id, created_at);
create index idx_storage_object_owner on storage_object(tenant_id, owner_user_id, status, created_at);
create index idx_export_job_task on export_job(tenant_id, task_id, report_type, status, created_at);
create index idx_report_snapshot_task_type on eval_report_snapshot(tenant_id, task_id, report_type, generated_at);
create index idx_text_analysis_summary_task on text_analysis_summary(tenant_id, task_id, created_at);
create index idx_improvement_owner_status on eval_improvement_ticket(tenant_id, owner_user_id, status);
create unique index idx_improvement_source_unique on eval_improvement_ticket(tenant_id, source_type, source_id);
create index idx_teacher_self_evaluation on teacher_self_evaluation(tenant_id, teacher_id, task_id, created_at);
create index idx_supervision_task on supervision_observation_task(tenant_id, supervisor_user_id, teacher_id, status, scheduled_at);
create index idx_supervision_observation on supervision_observation(tenant_id, task_id, teacher_id, submitted_at);
create index idx_parent_feedback_student on parent_feedback(tenant_id, student_id, status, submitted_at);
create index idx_parent_feedback_class_risk on parent_feedback(tenant_id, class_org_id, risk_level, status, submitted_at);
create index idx_composite_analysis_snapshot on composite_analysis_snapshot(tenant_id, subject_type, subject_id, generated_at);
