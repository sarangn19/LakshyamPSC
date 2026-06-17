-- Lakshyam — Cognitive Twin Persistence

-- ============================================================
-- Add cognitive profile JSONB to existing profiles table
-- Stores: weakSubjects, strongSubjects, forgettingRates,
--         hesitationPatterns, confusionPairs, studyPreferences
-- ============================================================
alter table public.profiles
  add column if not exists cognitive_profile jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

-- ============================================================
-- RECOMMENDATIONS
-- Tracks recommendation history and whether users act on them
-- ============================================================
create table if not exists public.recommendations (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  recommendation_id text not null,
  session_type      text not null,
  title             text not null,
  rationale         text not null default '',
  recommended_action text not null default '',
  status            text not null default 'pending'
                    check (status in ('pending', 'accepted', 'skipped')),
  reason_factors    jsonb not null default '[]'::jsonb,
  generated_at      timestamptz not null default now(),
  responded_at      timestamptz,
  unique(profile_id, recommendation_id)
);

create index if not exists idx_recommendations_profile
  on public.recommendations(profile_id, generated_at desc);

-- ============================================================
-- SESSION OUTCOMES (denormalised for fast analytics queries)
-- ============================================================
create table if not exists public.session_outcomes (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  session_id          text not null,
  session_type        text not null,
  start_time          timestamptz not null,
  end_time            timestamptz not null,
  duration_minutes    int not null default 0,
  total_questions     int not null default 0,
  correct_answers     int not null default 0,
  accuracy            real not null default 0,
  subject_scores      jsonb not null default '{}'::jsonb,
  weakest_subject     text,
  strongest_subject   text,
  difficulty_mix      jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  unique(profile_id, session_id)
);

create index if not exists idx_outcomes_profile_date
  on public.session_outcomes(profile_id, end_time desc);

create index if not exists idx_outcomes_date_range
  on public.session_outcomes(profile_id, end_time);

-- ============================================================
-- SYNC LOG (tracks last sync per entity type per profile)
-- ============================================================
create table if not exists public.sync_log (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  entity_type   text not null,
  last_synced_at timestamptz not null default now(),
  unique(profile_id, entity_type)
);

-- ============================================================
-- Row Level Security for new tables
-- ============================================================
alter table public.recommendations enable row level security;
alter table public.session_outcomes enable row level security;
alter table public.sync_log enable row level security;

create policy "Users can manage own recommendations"
  on public.recommendations for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own session outcomes"
  on public.session_outcomes for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own sync log"
  on public.sync_log for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );
