-- Admin/Superadmin read policies for cross-user tables
-- Required for admin dashboard, analytics, and user management screens

do $$ begin
-- Profiles: admins + superadmins can read all profiles
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Study sessions
drop policy if exists "Admins can read all study sessions" on public.study_sessions;
create policy "Admins can read all study sessions"
  on public.study_sessions for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- MCQ attempts
drop policy if exists "Admins can read all mcq attempts" on public.mcq_attempts;
create policy "Admins can read all mcq attempts"
  on public.mcq_attempts for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Subject progress
drop policy if exists "Admins can read all subject progress" on public.subject_progress;
create policy "Admins can read all subject progress"
  on public.subject_progress for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Interaction signals
drop policy if exists "Admins can read all interaction signals" on public.interaction_signals;
create policy "Admins can read all interaction signals"
  on public.interaction_signals for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Flashcard reviews
drop policy if exists "Admins can read all flashcard reviews" on public.flashcard_reviews;
create policy "Admins can read all flashcard reviews"
  on public.flashcard_reviews for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Study streaks
drop policy if exists "Admins can read all study streaks" on public.study_streaks;
create policy "Admins can read all study streaks"
  on public.study_streaks for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );

-- Goals
drop policy if exists "Admins can read all goals" on public.goals;
create policy "Admins can read all goals"
  on public.goals for select using (
    exists (select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.auth_user_id = auth.uid() and r.name in ('admin', 'superadmin'))
  );
end $$;
