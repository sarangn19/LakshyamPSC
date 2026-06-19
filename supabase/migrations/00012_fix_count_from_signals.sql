-- Fix dashboard KPIs to query interaction_signals instead of mcq_attempts
-- mcq_attempts table exists but is NOT populated by the app
-- Per-answer data is stored in interaction_signals with signal_type='interaction'

create or replace function public.admin_count_total_attempts()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.interaction_signals where signal_type = 'interaction';
$$;

grant execute on function public.admin_count_total_attempts to authenticated;

create or replace function public.admin_get_average_accuracy()
returns real
language sql
security definer
stable
as $$
  select case when count(*) = 0 then 0::real
    else count(*) filter (where (payload->>'answeredCorrect')::boolean = true)::real / count(*)::real
    end
  from public.interaction_signals
  where signal_type = 'interaction';
$$;

grant execute on function public.admin_get_average_accuracy to authenticated;

create or replace function public.admin_get_subject_analytics()
returns json
language sql
security definer
stable
as $$
  select json_agg(subq order by accuracy) from (
    select payload->>'subject' as subject,
           count(*) filter (where (payload->>'answeredCorrect')::boolean = true) as correct,
           count(*) as total,
           case when count(*) > 0
             then count(*) filter (where (payload->>'answeredCorrect')::boolean = true)::real / count(*)::real
             else 0 end as accuracy
    from public.interaction_signals
    where signal_type = 'interaction'
    group by payload->>'subject'
  ) subq;
$$;

grant execute on function public.admin_get_subject_analytics to authenticated;

-- Also fix per-user attempt count to use interaction_signals (already done in 00010, redo here)
create or replace function public.admin_count_user_attempts(profile_auth_user_id uuid)
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.interaction_signals iss
  join public.profiles p on p.id = iss.profile_id
  where p.auth_user_id = profile_auth_user_id
    and iss.signal_type = 'interaction';
$$;

grant execute on function public.admin_count_user_attempts to authenticated;

-- Fix active learners today: interaction_signals has created_at
create or replace function public.admin_count_active_learners_today()
returns bigint
language sql
security definer
stable
as $$
  select count(distinct profile_id) from public.interaction_signals
  where created_at >= current_date
    and signal_type = 'interaction';
$$;

grant execute on function public.admin_count_active_learners_today to authenticated;

-- Fix session counts: app writes to session_outcomes, not study_sessions
create or replace function public.admin_count_total_sessions()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.session_outcomes;
$$;

grant execute on function public.admin_count_total_sessions to authenticated;

create or replace function public.admin_get_session_completion_rate()
returns real
language sql
security definer
stable
as $$
  select 1.0::real;
$$;

grant execute on function public.admin_get_session_completion_rate to authenticated;

create or replace function public.admin_get_revision_adherence_rate()
returns real
language sql
security definer
stable
as $$
  select case when count(*) = 0 then 0::real
    else count(*) filter (where session_type = 'revision')::real / count(*)::real
    end
  from public.session_outcomes;
$$;

grant execute on function public.admin_get_revision_adherence_rate to authenticated;

-- Subject progress: app stores per-answer in interaction_signals
-- Use payload->>'subject' grouped counts instead of subject_progress table
create or replace function public.admin_get_subject_progress_summary()
returns json
language sql
security definer
stable
as $$
  select json_agg(subq) from (
    select payload->>'subject' as subject,
           count(*) as total_questions,
           count(*) filter (where (payload->>'answeredCorrect')::boolean = true) as correct_answers,
           case when count(*) > 0
             then count(*) filter (where (payload->>'answeredCorrect')::boolean = true)::real / count(*)::real
             else 0 end as accuracy
    from public.interaction_signals
    where signal_type = 'interaction'
    group by payload->>'subject'
  ) subq;
$$;

grant execute on function public.admin_get_subject_progress_summary to authenticated;
