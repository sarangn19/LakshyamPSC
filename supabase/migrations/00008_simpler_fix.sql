-- Add role column to profiles so admin can read roles without querying user_roles
alter table public.profiles add column if not exists role text not null default 'student';

-- Drop all recursive policies on user_roles (keep only basic own-read)
drop policy if exists "Superadmins can manage all user roles" on public.user_roles;
drop policy if exists "All authenticated can read user roles" on public.user_roles;
drop policy if exists "Anyone authenticated can read user_roles" on public.user_roles;
drop policy if exists "Superadmins can insert user_roles" on public.user_roles;
drop policy if exists "Superadmins can update user_roles" on public.user_roles;
drop policy if exists "Superadmins can delete user_roles" on public.user_roles;

-- Simple policies for user_roles
create policy "Users can read own roles" on public.user_roles
  for select using (auth.uid() = auth_user_id);

create policy "Authenticated can manage user_roles" on public.user_roles
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated can manage user_roles" on public.user_roles
  for update using (auth.role() = 'authenticated');

create policy "Authenticated can manage user_roles" on public.user_roles
  for delete using (auth.role() = 'authenticated');

-- Drop old admin policies that relied on has_role()
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

-- Recreate admin policies using profiles.role (no recursion)
create policy "Admins can read all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all study sessions"
  on public.study_sessions for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all mcq attempts"
  on public.mcq_attempts for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all subject progress"
  on public.subject_progress for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all interaction signals"
  on public.interaction_signals for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all flashcard reviews"
  on public.flashcard_reviews for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all study streaks"
  on public.study_streaks for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins can read all goals"
  on public.goals for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Superadmins can read audit logs"
  on public.audit_logs for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'superadmin')
  );

create policy "Admins and superadmins can read feature flags"
  on public.feature_flags for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage feature flags"
  on public.feature_flags for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'superadmin')
  );

create policy "Admins and superadmins can manage flagged questions"
  on public.flagged_questions for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins and superadmins can manage current affairs schedule"
  on public.current_affairs_schedule for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins and superadmins can manage all tickets"
  on public.support_tickets for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Admins and superadmins can read cognitive twin configs"
  on public.cognitive_twin_configs for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage cognitive twin configs"
  on public.cognitive_twin_configs for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'superadmin')
  );

create policy "Admins can read experiments"
  on public.experiment_configs for select using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role in ('admin', 'superadmin'))
  );

create policy "Superadmins can manage experiments"
  on public.experiment_configs for all using (
    exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'superadmin')
  );

-- Sync existing user_roles to profiles.role
update public.profiles p
set role = coalesce(
  (select r.name from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.auth_user_id = p.auth_user_id order by r.name = 'superadmin' desc, r.name = 'admin' desc limit 1),
  'student'
);
