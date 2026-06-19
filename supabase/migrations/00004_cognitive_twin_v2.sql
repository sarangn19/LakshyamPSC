-- Lakshyam — Cognitive Twin v2: Subtopic-Level Gap Tracking & Closure Validation
-- Phase 1: Subject > Topic > Subtopic hierarchy with mastery tracking

-- ============================================================
-- KNOWLEDGE NODES
-- Stores the 3-level hierarchy: subject, topic, subtopic
-- ============================================================
create table if not exists public.knowledge_nodes (
  id          text primary key,
  name        text not null,
  level       text not null check (level in ('subject', 'topic', 'subtopic')),
  parent_id   text references public.knowledge_nodes(id) on delete cascade,
  unique(name, level)
);

create index if not exists idx_knowledge_nodes_parent
  on public.knowledge_nodes(parent_id);

create index if not exists idx_knowledge_nodes_level
  on public.knowledge_nodes(level);

-- ============================================================
-- KNOWLEDGE MASTERY
-- Tracks mastery per node per user at subject, topic, subtopic levels
-- ============================================================
create table if not exists public.knowledge_mastery (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  node_id           text not null references public.knowledge_nodes(id) on delete cascade,
  attempts          int not null default 0,
  correct           int not null default 0,
  accuracy          real not null default 0,
  hesitation_score  real not null default 0,
  forgetting_score  real not null default 0,
  mastery_score     real not null default 0,
  last_practiced    timestamptz,
  trend             text not null default 'unknown'
                    check (trend in ('improving', 'declining', 'stable', 'unknown')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(profile_id, node_id)
);

create index if not exists idx_mastery_profile
  on public.knowledge_mastery(profile_id);

create index if not exists idx_mastery_profile_node
  on public.knowledge_mastery(profile_id, node_id);

create index if not exists idx_mastery_score
  on public.knowledge_mastery(profile_id, mastery_score desc);

-- ============================================================
-- GAP RECORDS
-- Tracks detected knowledge gaps and their lifecycle
-- ============================================================
create table if not exists public.gap_records (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  gap_id              text not null,
  node_id             text not null references public.knowledge_nodes(id) on delete cascade,
  level               text not null check (level in ('subject', 'topic', 'subtopic')),
  detected_at         timestamptz not null default now(),
  initial_mastery     real not null default 0,
  current_mastery     real not null default 0,
  best_mastery        real not null default 0,
  status              text not null default 'open'
                      check (status in ('open', 'improving', 'closing', 'closed')),
  sessions_applied    int not null default 0,
  questions_answered  int not null default 0,
  recommendation_count int not null default 0,
  updated_at          timestamptz not null default now(),
  unique(profile_id, gap_id)
);

create index if not exists idx_gaps_profile_status
  on public.gap_records(profile_id, status);

create index if not exists idx_gaps_profile_node
  on public.gap_records(profile_id, node_id);

-- ============================================================
-- GAP LIFECYCLES
-- Full lifecycle tracking from detection to closure
-- ============================================================
create table if not exists public.gap_lifecycles (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  gap_id                text not null,
  node_id               text not null,
  node_name             text not null,
  node_path             jsonb not null default '[]'::jsonb,
  level                 text not null,
  detected_at           timestamptz not null default now(),
  first_recommendation  timestamptz,
  closed_at             timestamptz,
  sessions_applied      int not null default 0,
  questions_answered    int not null default 0,
  mastery_timeline      jsonb not null default '[]'::jsonb,
  days_to_close         int,
  sessions_to_close     int,
  unique(profile_id, gap_id)
);

create index if not exists idx_lifecycles_profile
  on public.gap_lifecycles(profile_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_mastery enable row level security;
alter table public.gap_records enable row level security;
alter table public.gap_lifecycles enable row level security;

-- Allow all authenticated users to read knowledge nodes
create policy "Anyone can read knowledge nodes"
  on public.knowledge_nodes for select
  using (true);

-- Users manage their own mastery
create policy "Users manage own mastery"
  on public.knowledge_mastery for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- Users manage their own gap records
create policy "Users manage own gap records"
  on public.gap_records for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- Users manage their own gap lifecycles
create policy "Users manage own gap lifecycles"
  on public.gap_lifecycles for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- ============================================================
-- Seed default knowledge nodes from the app hierarchy
-- (These match the knowledgeTree.ts definitions)
-- ============================================================
insert into public.knowledge_nodes (id, name, level, parent_id) values
  -- Subjects
  ('subj_history', 'Kerala History', 'subject', null),
  ('subj_renaissance', 'Renaissance', 'subject', null),
  ('subj_constitution', 'Constitution', 'subject', null),
  ('subj_geography', 'Geography', 'subject', null),
  ('subj_science', 'Science', 'subject', null),
  ('subj_current', 'Current Affairs', 'subject', null),
  ('subj_aptitude', 'Quantitative Aptitude', 'subject', null),
  ('subj_mental', 'Mental Ability', 'subject', null),
  ('subj_malayalam', 'Malayalam', 'subject', null)
on conflict (id) do nothing;

-- Topics under Kerala History
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_history_ancient', 'Ancient Kerala', 'topic', 'subj_history'),
  ('topic_history_medieval', 'Medieval Kerala', 'topic', 'subj_history'),
  ('topic_history_modern', 'Modern Kerala', 'topic', 'subj_history')
on conflict (id) do nothing;

-- Subtopics under Kerala History topics
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_ancient_prehistoric', 'Pre-historic Kerala', 'subtopic', 'topic_history_ancient'),
  ('subt_ancient_sangam', 'Sangam Period', 'subtopic', 'topic_history_ancient'),
  ('subt_ancient_chera', 'Chera Dynasty', 'subtopic', 'topic_history_ancient'),
  ('subt_medieval_venad', 'Venad Kingdom', 'subtopic', 'topic_history_medieval'),
  ('subt_medieval_zamorins', 'Zamorins of Calicut', 'subtopic', 'topic_history_medieval'),
  ('subt_medieval_kochi', 'Kochi Kingdom', 'subtopic', 'topic_history_medieval'),
  ('subt_modern_british', 'British Rule', 'subtopic', 'topic_history_modern'),
  ('subt_modern_formation', 'Formation of Kerala State', 'subtopic', 'topic_history_modern')
on conflict (id) do nothing;

-- Topics under Renaissance
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_ren_social', 'Social Reform Movements', 'topic', 'subj_renaissance'),
  ('topic_ren_temple', 'Temple Entry Movement', 'topic', 'subj_renaissance')
on conflict (id) do nothing;

-- Subtopics under Renaissance topics
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_ren_sndp', 'SNDP Yogam', 'subtopic', 'topic_ren_social'),
  ('subt_ren_nss', 'NSS', 'subtopic', 'topic_ren_social'),
  ('subt_ren_ayyankali', 'Ayyankali', 'subtopic', 'topic_ren_social'),
  ('subt_ren_chattampi', 'Chattampi Swamikal', 'subtopic', 'topic_ren_social'),
  ('subt_ren_sahodaran', 'Sahodaran Ayyappan', 'subtopic', 'topic_ren_social'),
  ('subt_ren_sree_narayana', 'Sree Narayana Guru', 'subtopic', 'topic_ren_social'),
  ('subt_temple_vaikom', 'Vaikom Satyagraha', 'subtopic', 'topic_ren_temple'),
  ('subt_temple_proclamation', 'Temple Entry Proclamation', 'subtopic', 'topic_ren_temple')
on conflict (id) do nothing;

-- Topics under Constitution
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_const_fr', 'Fundamental Rights', 'topic', 'subj_constitution'),
  ('topic_const_dpsp', 'Directive Principles', 'topic', 'subj_constitution'),
  ('topic_const_exec', 'Union Executive', 'topic', 'subj_constitution')
on conflict (id) do nothing;

-- Subtopics under Constitution
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_fr_equality', 'Right to Equality', 'subtopic', 'topic_const_fr'),
  ('subt_fr_freedom', 'Right to Freedom', 'subtopic', 'topic_const_fr'),
  ('subt_fr_remedies', 'Right to Constitutional Remedies', 'subtopic', 'topic_const_fr'),
  ('subt_dpsp_socialistic', 'Socialistic Principles', 'subtopic', 'topic_const_dpsp'),
  ('subt_dpsp_gandhian', 'Gandhian Principles', 'subtopic', 'topic_const_dpsp'),
  ('subt_exec_president', 'President', 'subtopic', 'topic_const_exec'),
  ('subt_exec_pm', 'Prime Minister', 'subtopic', 'topic_const_exec'),
  ('subt_exec_council', 'Council of Ministers', 'subtopic', 'topic_const_exec')
on conflict (id) do nothing;

-- Topics under Geography
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_geo_physical', 'Physical Geography', 'topic', 'subj_geography'),
  ('topic_geo_kerala', 'Kerala Geography', 'topic', 'subj_geography')
on conflict (id) do nothing;

-- Subtopics under Geography
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_phys_climate', 'Climate', 'subtopic', 'topic_geo_physical'),
  ('subt_phys_rivers', 'Rivers', 'subtopic', 'topic_geo_physical'),
  ('subt_phys_soils', 'Soil Types', 'subtopic', 'topic_geo_physical'),
  ('subt_kerala_districts', 'Districts', 'subtopic', 'topic_geo_kerala'),
  ('subt_kerala_ghats', 'Western Ghats', 'subtopic', 'topic_geo_kerala'),
  ('subt_kerala_backwaters', 'Backwaters', 'subtopic', 'topic_geo_kerala')
on conflict (id) do nothing;

-- Topics under Science
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_sci_physics', 'Physics', 'topic', 'subj_science'),
  ('topic_sci_chemistry', 'Chemistry', 'topic', 'subj_science'),
  ('topic_sci_biology', 'Biology', 'topic', 'subj_science')
on conflict (id) do nothing;

-- Subtopics under Science
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_phys_motion', 'Motion', 'subtopic', 'topic_sci_physics'),
  ('subt_phys_energy', 'Energy', 'subtopic', 'topic_sci_physics'),
  ('subt_chem_periodic', 'Periodic Table', 'subtopic', 'topic_sci_chemistry'),
  ('subt_chem_reactions', 'Chemical Reactions', 'subtopic', 'topic_sci_chemistry'),
  ('subt_bio_human', 'Human Body', 'subtopic', 'topic_sci_biology'),
  ('subt_bio_ecology', 'Ecology', 'subtopic', 'topic_sci_biology')
on conflict (id) do nothing;

-- Topics under Current Affairs
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_curr_kerala', 'Kerala News', 'topic', 'subj_current'),
  ('topic_curr_national', 'National News', 'topic', 'subj_current')
on conflict (id) do nothing;

-- Subtopics under Current Affairs
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_curr_schemes', 'Government Schemes', 'subtopic', 'topic_curr_kerala'),
  ('subt_curr_infra', 'Infrastructure', 'subtopic', 'topic_curr_kerala'),
  ('subt_curr_appointments', 'Appointments', 'subtopic', 'topic_curr_national'),
  ('subt_curr_awards', 'Awards', 'subtopic', 'topic_curr_national')
on conflict (id) do nothing;

-- Topics under Quantitative Aptitude
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_apt_arithmetic', 'Arithmetic', 'topic', 'subj_aptitude'),
  ('topic_apt_data', 'Data Interpretation', 'topic', 'subj_aptitude')
on conflict (id) do nothing;

-- Subtopics under Quantitative Aptitude
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_apt_percentages', 'Percentages', 'subtopic', 'topic_apt_arithmetic'),
  ('subt_apt_ratios', 'Ratios', 'subtopic', 'topic_apt_arithmetic'),
  ('subt_apt_charts', 'Charts', 'subtopic', 'topic_apt_data'),
  ('subt_apt_tables', 'Tables', 'subtopic', 'topic_apt_data')
on conflict (id) do nothing;

-- Topics under Mental Ability
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_mental_logic', 'Logical Reasoning', 'topic', 'subj_mental')
on conflict (id) do nothing;

-- Subtopics under Mental Ability
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_mental_analogies', 'Analogies', 'subtopic', 'topic_mental_logic'),
  ('subt_mental_coding', 'Coding-Decoding', 'subtopic', 'topic_mental_logic')
on conflict (id) do nothing;

-- Topics under Malayalam
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('topic_mal_grammar', 'Grammar', 'topic', 'subj_malayalam'),
  ('topic_mal_literature', 'Literature', 'topic', 'subj_malayalam')
on conflict (id) do nothing;

-- Subtopics under Malayalam
insert into public.knowledge_nodes (id, name, level, parent_id) values
  ('subt_mal_sandhi', 'Sandhi', 'subtopic', 'topic_mal_grammar'),
  ('subt_mal_samasa', 'Samasa', 'subtopic', 'topic_mal_grammar'),
  ('subt_mal_ancient_poets', 'Ancient Poets', 'subtopic', 'topic_mal_literature'),
  ('subt_mal_modern', 'Modern Literature', 'subtopic', 'topic_mal_literature')
on conflict (id) do nothing;
