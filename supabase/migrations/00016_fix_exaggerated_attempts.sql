-- Fix exaggerated "questions attempted" counts
-- Previously used count(*) which counted EVERY answer submission,
-- including retries of the same question across multiple sessions.
-- Now uses count(distinct payload->>'questionId') for unique question counts.

create or replace function public.admin_count_total_attempts()
returns bigint
language sql
security definer
stable
as $$
  select count(distinct payload->>'questionId') from public.interaction_signals where signal_type = 'interaction';
$$;

grant execute on function public.admin_count_total_attempts to authenticated;

create or replace function public.admin_count_user_attempts(profile_auth_user_id uuid)
returns bigint
language sql
security definer
stable
as $$
  select count(distinct iss.payload->>'questionId') from public.interaction_signals iss
  join public.profiles p on p.id = iss.profile_id
  where p.auth_user_id = profile_auth_user_id
    and iss.signal_type = 'interaction';
$$;

grant execute on function public.admin_count_user_attempts to authenticated;
