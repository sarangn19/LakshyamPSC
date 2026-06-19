-- Fix RLS infinite recursion by using a security definer function
-- DROP existing policies first, replace with function-based policies

-- Security definer function to check user role (bypasses RLS)
create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.auth_user_id = auth.uid() and r.name = role_name
  );
$$;

-- Drop the recursive policies from 00006_admin_read_policies.sql
do $$ begin
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can read all study sessions" on public.study_sessions;
drop policy if exists "Admins can read all mcq attempts" on public.mcq_attempts;
drop policy if exists "Admins can read all subject progress" on public.subject_progress;
drop policy if exists "Admins can read all interaction signals" on public.interaction_signals;
drop policy if exists "Admins can read all flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Admins can read all study streaks" on public.study_streaks;
drop policy if exists "Admins can read all goals" on public.goals;
end $$;

-- Recreate with security definer function (no recursion)
create policy "Admins can read all profiles"
  on public.profiles for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all study sessions"
  on public.study_sessions for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all mcq attempts"
  on public.mcq_attempts for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all subject progress"
  on public.subject_progress for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all interaction signals"
  on public.interaction_signals for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all flashcard reviews"
  on public.flashcard_reviews for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all study streaks"
  on public.study_streaks for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

create policy "Admins can read all goals"
  on public.goals for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

-- Also fix the existing policies in 00003_admin_portal.sql that have the same recursion issue
drop policy if exists "Superadmins can manage all user roles" on public.user_roles;
create policy "Superadmins can manage all user roles"
  on public.user_roles for all using (
    public.has_role('superadmin')
  );

drop policy if exists "Superadmins can read audit logs" on public.audit_logs;
create policy "Superadmins can read audit logs"
  on public.audit_logs for select using (
    public.has_role('superadmin')
  );

drop policy if exists "Admins and superadmins can read feature flags" on public.feature_flags;
create policy "Admins and superadmins can read feature flags"
  on public.feature_flags for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Superadmins can manage feature flags" on public.feature_flags;
create policy "Superadmins can manage feature flags"
  on public.feature_flags for all using (
    public.has_role('superadmin')
  );

drop policy if exists "Admins and superadmins can manage flagged questions" on public.flagged_questions;
create policy "Admins and superadmins can manage flagged questions"
  on public.flagged_questions for all using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Admins and superadmins can manage current affairs schedule" on public.current_affairs_schedule;
create policy "Admins and superadmins can manage current affairs schedule"
  on public.current_affairs_schedule for all using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Admins and superadmins can manage all tickets" on public.support_tickets;
create policy "Admins and superadmins can manage all tickets"
  on public.support_tickets for all using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Admins and superadmins can read cognitive twin configs" on public.cognitive_twin_configs;
create policy "Admins and superadmins can read cognitive twin configs"
  on public.cognitive_twin_configs for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Superadmins can manage cognitive twin configs" on public.cognitive_twin_configs;
create policy "Superadmins can manage cognitive twin configs"
  on public.cognitive_twin_configs for all using (
    public.has_role('superadmin')
  );

drop policy if exists "Admins can read experiments" on public.experiment_configs;
create policy "Admins can read experiments"
  on public.experiment_configs for select using (
    public.has_role('admin') or public.has_role('superadmin')
  );

drop policy if exists "Superadmins can manage experiments" on public.experiment_configs;
create policy "Superadmins can manage experiments"
  on public.experiment_configs for all using (
    public.has_role('superadmin')
  );

drop policy if exists "Superadmins can manage experiment results" on public.experiment_results;
create policy "Superadmins can manage experiment results"
  on public.experiment_results for all using (
    public.has_role('superadmin')
  );
