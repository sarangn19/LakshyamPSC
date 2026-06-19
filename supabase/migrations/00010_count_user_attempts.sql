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
