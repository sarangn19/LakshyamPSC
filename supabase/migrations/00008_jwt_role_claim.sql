-- Add role as a JWT claim to avoid RLS recursion
-- This trigger runs AFTER login/role changes to set a raw_app_meta_data claim

-- Function to sync user_roles to auth.users raw_app_meta_data
create or replace function public.sync_role_to_jwt()
returns trigger
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = 
    raw_app_meta_data || 
    jsonb_build_object(
      'app_role', (
        select r.name from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.auth_user_id = new.auth_user_id
        order by r.name = 'superadmin' desc, r.name = 'admin' desc
        limit 1
      )
    )
  where id = new.auth_user_id;
  return new;
end;
$$;

-- Trigger on user_roles changes
drop trigger if exists sync_role_to_jwt on public.user_roles;
create trigger sync_role_to_jwt
  after insert or update or delete on public.user_roles
  for each row execute function public.sync_role_to_jwt();

-- Drop old recursive policies on user_roles
drop policy if exists "Superadmins can manage all user roles" on public.user_roles;
drop policy if exists "Users can read own roles" on public.user_roles;

-- Simple non-recursive policies for user_roles
create policy "Anyone authenticated can read user_roles"
  on public.user_roles for select
  using (auth.role() = 'authenticated');

create policy "Superadmins can insert user_roles"
  on public.user_roles for insert
  with check (
    coalesce(current_setting('request.jwt.claims', true)::jsonb #>> '{app_role}', '') = 'superadmin'
  );

create policy "Superadmins can update user_roles"
  on public.user_roles for update
  using (
    coalesce(current_setting('request.jwt.claims', true)::jsonb #>> '{app_role}', '') = 'superadmin'
  );

create policy "Superadmins can delete user_roles"
  on public.user_roles for delete
  using (
    coalesce(current_setting('request.jwt.claims', true)::jsonb #>> '{app_role}', '') = 'superadmin'
  );

-- Also fix all other admin policies to use JWT claim instead of has_role()
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
drop policy if exists "Superadmins can manage experiment results" on public.experiment_results;
end $$;

-- Helper to check role from JWT
create or replace function public.jwt_has_role(role_name text)
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb #>> '{app_role}', '') = role_name;
$$;

-- Recreate all admin policies using JWT claim (no recursion)
create policy "Admins can read all profiles" on public.profiles
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all study sessions" on public.study_sessions
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all mcq attempts" on public.mcq_attempts
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all subject progress" on public.subject_progress
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all interaction signals" on public.interaction_signals
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all flashcard reviews" on public.flashcard_reviews
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all study streaks" on public.study_streaks
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins can read all goals" on public.goals
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Superadmins can read audit logs" on public.audit_logs
  for select using (public.jwt_has_role('superadmin'));

create policy "Admins and superadmins can read feature flags" on public.feature_flags
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Superadmins can manage feature flags" on public.feature_flags
  for all using (public.jwt_has_role('superadmin'));

create policy "Admins and superadmins can manage flagged questions" on public.flagged_questions
  for all using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins and superadmins can manage current affairs schedule" on public.current_affairs_schedule
  for all using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins and superadmins can manage all tickets" on public.support_tickets
  for all using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Admins and superadmins can read cognitive twin configs" on public.cognitive_twin_configs
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Superadmins can manage cognitive twin configs" on public.cognitive_twin_configs
  for all using (public.jwt_has_role('superadmin'));

create policy "Admins can read experiments" on public.experiment_configs
  for select using (public.jwt_has_role('admin') or public.jwt_has_role('superadmin'));

create policy "Superadmins can manage experiments" on public.experiment_configs
  for all using (public.jwt_has_role('superadmin'));
