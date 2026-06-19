-- Lakshyam — Admin & Super Admin Portal Schema

-- ============================================================
-- ROLES
-- ============================================================
create table public.roles (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique check (name in ('student', 'admin', 'superadmin')),
  description   text not null default '',
  created_at    timestamptz not null default now()
);

insert into public.roles (name, description) values
  ('student', 'Learner — can study, practice, revise, view personal analytics'),
  ('admin', 'Content manager — can manage questions, current affairs, content quality, learner support, view learning analytics'),
  ('superadmin', 'Platform operator — can configure system, manage users, tune cognitive twin, experiments, audit logs');

-- ============================================================
-- PERMISSIONS
-- ============================================================
create table public.permissions (
  id            uuid primary key default uuid_generate_v4(),
  resource      text not null,
  action        text not null,
  description   text not null default '',
  unique(resource, action)
);

-- Seed permissions
insert into public.permissions (resource, action, description) values
  -- Question management
  ('questions', 'create', 'Create new MCQs'),
  ('questions', 'read',   'View questions and their stats'),
  ('questions', 'update', 'Edit existing questions'),
  ('questions', 'delete', 'Archive or remove questions'),
  ('questions', 'approve','Approve pending questions'),
  -- Current affairs
  ('current_affairs', 'create', 'Add news items'),
  ('current_affairs', 'read',   'View all current affairs'),
  ('current_affairs', 'update', 'Edit current affairs'),
  ('current_affairs', 'delete', 'Archive current affairs'),
  ('current_affairs', 'publish','Publish or schedule publication'),
  -- Content quality
  ('content_quality', 'read',   'View flagged/reported content'),
  ('content_quality', 'update', 'Resolve quality issues'),
  ('content_quality', 'delete', 'Remove low-quality content'),
  -- Learner support
  ('learner_support', 'read',   'View user reports and feedback'),
  ('learner_support', 'update', 'Respond to and resolve tickets'),
  ('learner_support', 'assign', 'Assign tickets to team members'),
  -- Analytics
  ('analytics', 'read', 'View learning analytics dashboards'),
  -- User management (superadmin)
  ('users', 'read',   'View all users'),
  ('users', 'update', 'Modify user roles and status'),
  ('users', 'delete', 'Suspend or remove users'),
  ('users', 'assign_role','Assign roles to users'),
  -- Access control (superadmin)
  ('roles', 'read',   'View roles and permissions'),
  ('roles', 'update', 'Modify role assignments'),
  ('feature_flags', 'read',   'View feature flags'),
  ('feature_flags', 'update', 'Toggle feature flags'),
  -- Cognitive twin (superadmin)
  ('cognitive_twin', 'read',   'View cognitive twin configuration'),
  ('cognitive_twin', 'update', 'Modify cognitive twin weights'),
  -- Recommendations (superadmin)
  ('recommendations', 'read',   'View recommendation analytics'),
  ('recommendations', 'update', 'Modify recommendation parameters'),
  -- Experiments (superadmin)
  ('experiments', 'create', 'Create A/B experiments'),
  ('experiments', 'read',   'View experiment results'),
  ('experiments', 'update', 'Modify experiment configurations'),
  ('experiments', 'delete', 'Remove experiments'),
  -- System monitoring (superadmin)
  ('system', 'read', 'View system health and metrics'),
  -- Audit logs (superadmin)
  ('audit_logs', 'read', 'View audit trail');

-- ============================================================
-- ROLE PERMISSIONS (many-to-many)
-- ============================================================
create table public.role_permissions (
  id            uuid primary key default uuid_generate_v4(),
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique(role_id, permission_id)
);

-- Seed role-permission mappings
-- Admin gets: questions.*, current_affairs.*, content_quality.*, learner_support.*, analytics.read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'admin'
  and (
    (p.resource = 'questions'     and p.action in ('create','read','update','delete','approve')) or
    (p.resource = 'current_affairs' and p.action in ('create','read','update','delete','publish')) or
    (p.resource = 'content_quality' and p.action in ('read','update','delete')) or
    (p.resource = 'learner_support' and p.action in ('read','update','assign')) or
    (p.resource = 'analytics'       and p.action in ('read'))
  );

-- Superadmin gets ALL permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'superadmin';

-- ============================================================
-- USER ROLES (links auth users to roles)
-- ============================================================
create table public.user_roles (
  id            uuid primary key default uuid_generate_v4(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  role_id       uuid not null references public.roles(id) on delete cascade,
  assigned_by   uuid references auth.users(id),
  assigned_at   timestamptz not null default now(),
  unique(auth_user_id, role_id)
);

create index idx_user_roles_auth on public.user_roles(auth_user_id);

-- ============================================================
-- AUDIT LOGS (immutable history)
-- ============================================================
create table public.audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  auth_user_id  uuid references auth.users(id) on delete set null,
  action        text not null,
  resource      text not null,
  resource_id   text,
  details       jsonb default '{}',
  ip_address    text,
  created_at    timestamptz not null default now()
);

create index idx_audit_resource on public.audit_logs(resource, created_at desc);
create index idx_audit_user on public.audit_logs(auth_user_id, created_at desc);

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
create table public.feature_flags (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  enabled       boolean not null default false,
  description   text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into public.feature_flags (name, enabled, description) values
  ('ai_question_generation',  true,  'Generate questions via AI Edge Function'),
  ('bkt_parameter_fitting',   true,  'Auto-fit BKT parameters from interaction signals'),
  ('cognitive_twin_sync',     true,  'Sync cognitive profile to Supabase'),
  ('malayalam_ml_questions',  true,  'Allow AI-generated questions in Malayalam'),
  ('flashcard_sm2',           true,  'Use SM-2 spaced repetition for flashcards'),
  ('recommendation_engine',   true,  'Enable adaptive recommendation engine'),
  ('experiment_a_b_testing',  false, 'Enable A/B experiment framework (future)');

-- ============================================================
-- FLAGGED QUESTIONS (content quality)
-- ============================================================
create table public.flagged_questions (
  id            uuid primary key default uuid_generate_v4(),
  question_id   text not null,
  reason        text not null,
  reported_by   uuid references auth.users(id) on delete set null,
  status        text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes   text,
  resolved_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index idx_flagged_status on public.flagged_questions(status);

-- ============================================================
-- CURRENT AFFAIRS SCHEDULE
-- ============================================================
create table public.current_affairs_schedule (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  content       text not null default '',
  category      text not null,
  source        text,
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  scheduled_for date,
  published_at  timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_ca_schedule_status on public.current_affairs_schedule(status);

-- ============================================================
-- LEARNER SUPPORT TICKETS
-- ============================================================
create table public.support_tickets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  category      text not null check (category in ('content_error', 'technical_issue', 'feedback', 'complaint', 'other')),
  subject       text not null,
  description   text not null,
  status        text not null default 'open' check (status in ('open', 'assigned', 'in_progress', 'resolved', 'escalated')),
  priority      text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_to   uuid references auth.users(id) on delete set null,
  resolution    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index idx_tickets_status on public.support_tickets(status, priority);
create index idx_tickets_user on public.support_tickets(user_id);

-- ============================================================
-- COGNITIVE TWIN CONFIG (versioned)
-- ============================================================
create table public.cognitive_twin_configs (
  id              uuid primary key default uuid_generate_v4(),
  weakness_weight  real not null default 30,
  forgetting_weight real not null default 25,
  confusion_weight real not null default 20,
  coverage_weight  real not null default 25,
  version         int not null default 1,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- EXPERIMENT CONFIGS (A/B testing)
-- ============================================================
create table public.experiment_configs (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text not null default '',
  variant_a     jsonb not null default '{}',
  variant_b     jsonb not null default '{}',
  metrics       jsonb not null default '[]',
  status        text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'archived')),
  started_at    timestamptz,
  ended_at      timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- EXPERIMENT RESULTS
-- ============================================================
create table public.experiment_results (
  id              uuid primary key default uuid_generate_v4(),
  experiment_id   uuid not null references public.experiment_configs(id) on delete cascade,
  variant         text not null check (variant in ('a', 'b')),
  profile_id      uuid references public.profiles(id) on delete set null,
  completion_rate real,
  accuracy_gain   real,
  session_count   int not null default 0,
  recorded_at     timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.roles                      enable row level security;
alter table public.permissions                enable row level security;
alter table public.role_permissions           enable row level security;
alter table public.user_roles                 enable row level security;
alter table public.audit_logs                 enable row level security;
alter table public.feature_flags              enable row level security;
alter table public.flagged_questions          enable row level security;
alter table public.current_affairs_schedule   enable row level security;
alter table public.support_tickets            enable row level security;
alter table public.cognitive_twin_configs     enable row level security;
alter table public.experiment_configs         enable row level security;
alter table public.experiment_results         enable row level security;

-- Admin and superadmin read/write policies for admin tables
-- Roles: everyone can read roles
create policy "Roles are readable by authenticated users"
  on public.roles for select using (auth.role() = 'authenticated');

-- Permissions: everyone can read permissions
create policy "Permissions are readable by authenticated users"
  on public.permissions for select using (auth.role() = 'authenticated');

-- User roles: only superadmin can write; user can read own
create policy "Users can read own roles"
  on public.user_roles for select using (auth.uid() = auth_user_id);

create policy "Superadmins can manage all user roles"
  on public.user_roles for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

-- Audit logs: superadmin read only, insert via trigger
create policy "Superadmins can read audit logs"
  on public.audit_logs for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

-- Feature flags: superadmin read/write, admin read
create policy "Admins and superadmins can read feature flags"
  on public.feature_flags for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage feature flags"
  on public.feature_flags for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

-- Flagged questions: admin + superadmin read/write
create policy "Admins and superadmins can manage flagged questions"
  on public.flagged_questions for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Current affairs schedule: admin + superadmin manage
create policy "Admins and superadmins can manage current affairs schedule"
  on public.current_affairs_schedule for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Support tickets: user can read own, admin/superadmin read all
create policy "Users can read own tickets"
  on public.support_tickets for select using (auth.uid() = user_id);

create policy "Users can create tickets"
  on public.support_tickets for insert with check (auth.uid() = user_id);

create policy "Admins and superadmins can manage all tickets"
  on public.support_tickets for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Cognitive twin configs: superadmin manage, admin read
create policy "Admins and superadmins can read cognitive twin configs"
  on public.cognitive_twin_configs for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage cognitive twin configs"
  on public.cognitive_twin_configs for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

-- Experiments: superadmin manage, admin read
create policy "Admins can read experiments"
  on public.experiment_configs for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage experiments"
  on public.experiment_configs for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

create policy "Superadmins can manage experiment results"
  on public.experiment_results for all using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name = 'superadmin')
  );

-- ============================================================
-- AUTO-AUDIT TRIGGER
-- ============================================================
create or replace function public.log_audit_event()
returns trigger as $$
begin
  insert into public.audit_logs (auth_user_id, action, resource, resource_id, details)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id::text, old.id::text),
    jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Audit triggers on key tables
create trigger audit_questions_changes
  after insert or update or delete on public.mcq_attempts
  for each row execute function public.log_audit_event();

create trigger audit_role_changes
  after insert or update or delete on public.user_roles
  for each row execute function public.log_audit_event();

create trigger audit_feature_flag_changes
  after insert or update or delete on public.feature_flags
  for each row execute function public.log_audit_event();

create trigger audit_cognitive_twin_changes
  after insert or update or delete on public.cognitive_twin_configs
  for each row execute function public.log_audit_event();

create trigger audit_experiment_changes
  after insert or update or delete on public.experiment_configs
  for each row execute function public.log_audit_event();

create trigger audit_user_role_changes
  after insert or update or delete on public.user_roles
  for each row execute function public.log_audit_event();
