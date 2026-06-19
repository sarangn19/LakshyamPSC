-- Add cognitive_twin jsonb column for mastery/gap/retention data
alter table public.profiles
  add column if not exists cognitive_twin jsonb;

-- Ensure RLS for the tables being synced
do $$
begin
  -- Ensure study_streaks policies exist
  if not exists (select 1 from pg_policies where tablename = 'study_streaks' and policyname = 'Users can manage own streak') then
    create policy "Users can manage own streak"
      on public.study_streaks for all using (
        profile_id in (select id from public.profiles where auth_user_id = auth.uid())
      );
  end if;

  -- Ensure subject_progress policies exist
  if not exists (select 1 from pg_policies where tablename = 'subject_progress' and policyname = 'Users can manage own progress') then
    create policy "Users can manage own progress"
      on public.subject_progress for all using (
        profile_id in (select id from public.profiles where auth_user_id = auth.uid())
      );
  end if;

  -- Ensure goals policies exist
  if not exists (select 1 from pg_policies where tablename = 'goals' and policyname = 'Users can manage own goals') then
    create policy "Users can manage own goals"
      on public.goals for all using (
        profile_id in (select id from public.profiles where auth_user_id = auth.uid())
      );
  end if;

  -- Ensure flashcard_reviews policies exist
  if not exists (select 1 from pg_policies where tablename = 'flashcard_reviews' and policyname = 'Users can manage own flashcard reviews') then
    create policy "Users can manage own flashcard reviews"
      on public.flashcard_reviews for all using (
        profile_id in (select id from public.profiles where auth_user_id = auth.uid())
      );
  end if;
end $$;
