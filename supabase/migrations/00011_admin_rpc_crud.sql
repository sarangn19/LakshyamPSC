-- Admin RPC functions for tables where admin RLS policies were dropped
-- All are security definer to bypass RLS

-- ── current_affairs_schedule ──
create or replace function public.admin_get_ca_entries()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(c) order by c.created_at desc) from public.current_affairs_schedule c;
$$;
grant execute on function public.admin_get_ca_entries to authenticated;

create or replace function public.admin_insert_ca_entry(
  _title text, _content text, _category text, _source text, _status text, _scheduled_for date
) returns void
language sql
security definer
as $$
  insert into public.current_affairs_schedule(title, content, category, source, status, scheduled_for)
  values (_title, _content, _category, _source, _status, _scheduled_for);
$$;
grant execute on function public.admin_insert_ca_entry to authenticated;

create or replace function public.admin_update_ca_status(_id uuid, _status text, _published_at timestamptz)
returns void
language sql
security definer
as $$
  update public.current_affairs_schedule set status = _status, published_at = _published_at where id = _id;
$$;
grant execute on function public.admin_update_ca_status to authenticated;

-- ── support_tickets ──
create or replace function public.admin_get_support_tickets()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(t) order by t.created_at desc) from public.support_tickets t;
$$;
grant execute on function public.admin_get_support_tickets to authenticated;

create or replace function public.admin_update_ticket_status(_id uuid, _status text, _resolution text, _resolved_at timestamptz)
returns void
language sql
security definer
as $$
  update public.support_tickets set status = _status, resolution = _resolution, resolved_at = _resolved_at where id = _id;
$$;
grant execute on function public.admin_update_ticket_status to authenticated;

create or replace function public.admin_assign_ticket(_id uuid, _assignee uuid)
returns void
language sql
security definer
as $$
  update public.support_tickets set assigned_to = _assignee, status = 'assigned' where id = _id;
$$;
grant execute on function public.admin_assign_ticket to authenticated;

-- ── flagged_questions ──
create or replace function public.admin_get_flagged_questions()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(fq) order by fq.created_at desc) from public.flagged_questions fq;
$$;
grant execute on function public.admin_get_flagged_questions to authenticated;

create or replace function public.admin_update_flagged_status(_id uuid, _status text, _admin_notes text, _resolved_at timestamptz)
returns void
language sql
security definer
as $$
  update public.flagged_questions set status = _status, admin_notes = _admin_notes, resolved_at = _resolved_at where id = _id;
$$;
grant execute on function public.admin_update_flagged_status to authenticated;

-- ── audit_logs ──
create or replace function public.admin_get_audit_logs()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(al) order by al.created_at desc) from public.audit_logs al;
$$;
grant execute on function public.admin_get_audit_logs to authenticated;

-- ── feature_flags ──
create or replace function public.admin_get_feature_flags()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(ff)) from public.feature_flags ff;
$$;
grant execute on function public.admin_get_feature_flags to authenticated;

create or replace function public.admin_update_feature_flag(_id uuid, _enabled boolean)
returns void
language sql
security definer
as $$
  update public.feature_flags set enabled = _enabled where id = _id;
$$;
grant execute on function public.admin_update_feature_flag to authenticated;

-- ── cognitive_twin_configs ──
create or replace function public.admin_get_cognitive_twin_configs()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(ctc) order by ctc.created_at desc) from public.cognitive_twin_configs ctc;
$$;
grant execute on function public.admin_get_cognitive_twin_configs to authenticated;

create or replace function public.admin_insert_cognitive_twin_config(
  _weakness_weight real, _forgetting_weight real, _confusion_weight real, _coverage_weight real
) returns void
language sql
security definer
as $$
  insert into public.cognitive_twin_configs(weakness_weight, forgetting_weight, confusion_weight, coverage_weight)
  values (_weakness_weight, _forgetting_weight, _confusion_weight, _coverage_weight);
$$;
grant execute on function public.admin_insert_cognitive_twin_config to authenticated;

-- ── experiment_configs ──
create or replace function public.admin_get_experiments()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(ec) order by ec.created_at desc) from public.experiment_configs ec;
$$;
grant execute on function public.admin_get_experiments to authenticated;

create or replace function public.admin_create_experiment(
  _name text, _description text, _variant_a jsonb, _variant_b jsonb, _metrics jsonb
) returns void
language sql
security definer
as $$
  insert into public.experiment_configs(name, description, variant_a, variant_b, metrics)
  values (_name, _description, _variant_a, _variant_b, _metrics);
$$;
grant execute on function public.admin_create_experiment to authenticated;

create or replace function public.admin_update_experiment_status(
  _id uuid, _status text, _started_at timestamptz, _ended_at timestamptz
) returns void
language sql
security definer
as $$
  update public.experiment_configs set status = _status, started_at = _started_at, ended_at = _ended_at where id = _id;
$$;
grant execute on function public.admin_update_experiment_status to authenticated;

-- ── user_roles (admin fetch all) ──
create or replace function public.admin_get_user_roles()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(ur) order by ur.created_at desc) from public.user_roles ur;
$$;
grant execute on function public.admin_get_user_roles to authenticated;

-- ── system_health: recent interaction_signals ──
create or replace function public.admin_get_recent_signals(_since timestamptz)
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(isig)) from public.interaction_signals isig where isig.created_at >= _since;
$$;
grant execute on function public.admin_get_recent_signals to authenticated;
