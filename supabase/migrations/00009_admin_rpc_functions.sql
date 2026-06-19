-- Admin RPC functions: security definer bypasses RLS, runs as superuser
-- Grant execute to authenticated so logged-in users can call them

-- ── Profiles ──
create or replace function public.admin_get_profiles()
returns json
language sql
security definer
stable
as $$
  select json_agg(to_jsonb(p) order by p.created_at desc) from public.profiles p;
$$;

grant execute on function public.admin_get_profiles to authenticated;

-- ── Dashboard counts ──
create or replace function public.admin_count_profiles()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.profiles;
$$;

grant execute on function public.admin_count_profiles to authenticated;

create or replace function public.admin_count_active_learners_today()
returns bigint
language sql
security definer
stable
as $$
  select count(distinct profile_id) from public.study_sessions
  where started_at >= current_date;
$$;

grant execute on function public.admin_count_active_learners_today to authenticated;

create or replace function public.admin_count_total_sessions()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.study_sessions;
$$;

grant execute on function public.admin_count_total_sessions to authenticated;

create or replace function public.admin_count_total_attempts()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.mcq_attempts;
$$;

grant execute on function public.admin_count_total_attempts to authenticated;

create or replace function public.admin_get_session_completion_rate()
returns real
language sql
security definer
stable
as $$
  select case when count(*) = 0 then 0::real
    else count(*) filter (where completed = true)::real / count(*)::real
    end
  from public.study_sessions;
$$;

grant execute on function public.admin_get_session_completion_rate to authenticated;

create or replace function public.admin_get_average_accuracy()
returns real
language sql
security definer
stable
as $$
  select case when count(*) = 0 then 0::real
    else count(*) filter (where is_correct = true)::real / count(*)::real
    end
  from public.mcq_attempts;
$$;

grant execute on function public.admin_get_average_accuracy to authenticated;

create or replace function public.admin_get_subject_progress_summary()
returns json
language sql
security definer
stable
as $$
  select json_agg(subq) from (
    select sp.subject,
           sum(sp.total_questions) as total_questions,
           sum(sp.correct_answers) as correct_answers,
           case when sum(sp.total_questions) > 0
             then sum(sp.correct_answers)::real / sum(sp.total_questions)::real
             else 0 end as accuracy
    from public.subject_progress sp
    group by sp.subject
  ) subq;
$$;

grant execute on function public.admin_get_subject_progress_summary to authenticated;

create or replace function public.admin_get_subject_analytics()
returns json
language sql
security definer
stable
as $$
  select json_agg(subq order by accuracy) from (
    select subject,
           count(*) filter (where is_correct = true) as correct,
           count(*) as total,
           case when count(*) > 0
             then count(*) filter (where is_correct = true)::real / count(*)::real
             else 0 end as accuracy
    from public.mcq_attempts
    group by subject
  ) subq;
$$;

grant execute on function public.admin_get_subject_analytics to authenticated;

create or replace function public.admin_get_pending_flagged_count()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.flagged_questions where status = 'pending';
$$;

grant execute on function public.admin_get_pending_flagged_count to authenticated;

create or replace function public.admin_get_draft_ca_count()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.current_affairs_schedule where status = 'draft';
$$;

grant execute on function public.admin_get_draft_ca_count to authenticated;

create or replace function public.admin_get_open_ticket_count()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.support_tickets where status in ('open', 'assigned');
$$;

grant execute on function public.admin_get_open_ticket_count to authenticated;

create or replace function public.admin_get_critical_ticket_count()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.support_tickets
  where priority = 'critical' and status != 'resolved';
$$;

grant execute on function public.admin_get_critical_ticket_count to authenticated;

create or replace function public.admin_get_revision_adherence_rate()
returns real
language sql
security definer
stable
as $$
  select case when count(*) = 0 then 0::real
    else count(*) filter (where completed = true)::real / count(*)::real
    end
  from public.study_sessions
  where session_type = 'revision';
$$;

grant execute on function public.admin_get_revision_adherence_rate to authenticated;

create or replace function public.admin_get_recommendations_accepted()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.interaction_signals
  where signal_type = 'recommendation_accepted';
$$;

grant execute on function public.admin_get_recommendations_accepted to authenticated;

-- Drop all recursive admin policies that cause 500 errors
do $$ begin
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can read all study sessions" on public.study_sessions;
drop policy if exists "Admins can read all mcq attempts" on public.mcq_attempts;
drop policy if exists "Admins can read all subject progress" on public.subject_progress;
drop policy if exists "Admins can read all interaction signals" on public.interaction_signals;
drop policy if exists "Admins can read all flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Admins can read all study streaks" on public.study_streaks;
drop policy if exists "Admins can read all goals" on public.goals;
drop policy if exists "Superadmins can read audit logs" on public.audit_logs;
drop policy if exists "Admins and superadmins can read feature flags" on public.feature_flags;
drop policy if exists "Superadmins can manage feature flags" on public.feature_flags;
drop policy if exists "Admins and superadmins can manage flagged questions" on public.flagged_questions;
drop policy if exists "Admins and superadmins can manage current affairs schedule" on public.current_affairs_schedule;
drop policy if exists "Admins and superadmins can manage all tickets" on public.support_tickets;
drop policy if exists "Admins and superadmins can read cognitive twin configs" on public.cognitive_twin_configs;
drop policy if exists "Superadmins can manage cognitive twin configs" on public.cognitive_twin_configs;
drop policy if exists "Admins can read experiments" on public.experiment_configs;
drop policy if exists "Superadmins can manage experiments" on public.experiment_configs;
end $$;
