-- interaction_signals has RLS enabled (line 185 of 00001_initial_schema.sql)
-- but NO policy was ever created for it — this causes 403 Forbidden on INSERT

create policy "Users can manage own interaction signals"
  on public.interaction_signals for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- session_outcomes policy (from 00002) uses FOR ALL USING without WITH CHECK
-- Replace to ensure WITH CHECK is explicit:
drop policy if exists "Users can manage own session outcomes" on public.session_outcomes;
create policy "Users can manage own session outcomes"
  on public.session_outcomes for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- Same for recommendations:
drop policy if exists "Users can manage own recommendations" on public.recommendations;
create policy "Users can manage own recommendations"
  on public.recommendations for all
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
