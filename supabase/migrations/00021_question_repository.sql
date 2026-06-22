-- Lakshyam — Question Repository: generated_question tracking and generation metadata
-- Adds dedup support, source tracking, and analytics tables

-- ============================================================
-- Add question_hash for deduplication
-- ============================================================
alter table public.question_bank_mcqs
  add column if not exists question_hash text,
  add column if not exists source text not null default 'ai_generated'
    check (source in ('ai_generated', 'corpus', 'template_topic', 'template_subject', 'psc_pyq')),
  add column if not exists exam_types text[] not null default '{}';

create index if not exists idx_question_bank_mcqs_hash on public.question_bank_mcqs(question_hash);
create unique index if not exists idx_question_bank_mcqs_unique_hash on public.question_bank_mcqs(question_hash) where question_hash is not null;

-- ============================================================
-- GENERATION METADATA (tracks every AI generation call)
-- ============================================================
create table if not exists public.generation_metadata (
  id              uuid primary key default uuid_generate_v4(),
  subject         text not null,
  topic           text not null,
  difficulty      text not null check (difficulty in ('easy', 'medium', 'hard')),
  language        text not null default 'en',
  source          text not null default 'ai_generated'
                  check (source in ('ai_generated', 'corpus', 'template_topic', 'template_subject', 'psc_pyq')),
  result          text not null check (result in ('repository_hit', 'ai_generated', 'ai_failed', 'fallback_corpus', 'fallback_template')),
  latency_ms      int not null default 0,
  question_id     uuid references public.question_bank_mcqs(id) on delete set null,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_gen_meta_subject on public.generation_metadata(subject);
create index if not exists idx_gen_meta_topic on public.generation_metadata(topic);
create index if not exists idx_gen_meta_result on public.generation_metadata(result);
create index if not exists idx_gen_meta_created_at on public.generation_metadata(created_at desc);

-- ============================================================
-- REPOSITORY COVERAGE (Materialized View)
-- ============================================================
create materialized view if not exists public.repository_coverage as
select
  subject,
  topic,
  difficulty,
  count(*) as question_count,
  bool_or(source = 'psc_pyq') as has_psc,
  bool_or(source = 'ai_generated') as has_ai,
  bool_or(source in ('corpus', 'template_topic', 'template_subject')) as has_fallback
from public.question_bank_mcqs
where status = 'active'
group by subject, topic, difficulty
order by subject, topic, difficulty;

create unique index if not exists idx_repo_coverage_key on public.repository_coverage(subject, topic, difficulty);

-- ============================================================
-- FUNCTION: Check repository coverage
-- ============================================================
create or replace function public.get_repository_coverage()
returns table (
  subject text,
  topic text,
  difficulty text,
  question_count bigint,
  has_psc boolean,
  has_ai boolean,
  has_fallback boolean
) as $$
begin
  return query
  select * from public.repository_coverage
  order by subject, topic, difficulty;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Get repository stats
-- ============================================================
create or replace function public.get_repository_stats()
returns table (
  total_questions bigint,
  subjects_covered bigint,
  topics_covered bigint,
  ai_generated_count bigint,
  psc_pyq_count bigint,
  coverage_cells bigint,
  coverage_cells_total bigint
) as $$
begin
  return query
  select
    (select count(*) from public.question_bank_mcqs where status = 'active') as total_questions,
    (select count(distinct subject) from public.question_bank_mcqs where status = 'active') as subjects_covered,
    (select count(distinct (subject, topic)) from public.question_bank_mcqs where status = 'active') as topics_covered,
    (select count(*) from public.question_bank_mcqs where status = 'active' and source = 'ai_generated') as ai_generated_count,
    (select count(*) from public.question_bank_mcqs where status = 'active' and source = 'psc_pyq') as psc_pyq_count,
    (select count(*) from public.repository_coverage) as coverage_cells,
    (select count(*) from (select distinct subject, topic, difficulty from public.question_bank_mcqs where status = 'active') as all_cells) as coverage_cells_total;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Get distinct subject+topic combinations from repository
-- ============================================================
create or replace function public.get_repository_topics()
returns table (
  subject text,
  topic text,
  easy_count bigint,
  medium_count bigint,
  hard_count bigint,
  total_count bigint
) as $$
begin
  return query
  select
    q.subject,
    q.topic,
    count(*) filter (where q.difficulty = 'easy') as easy_count,
    count(*) filter (where q.difficulty = 'medium') as medium_count,
    count(*) filter (where q.difficulty = 'hard') as hard_count,
    count(*) as total_count
  from public.question_bank_mcqs q
  where q.status = 'active'
  group by q.subject, q.topic
  order by q.subject, q.topic;
end;
$$ language plpgsql stable;

-- ============================================================
-- RLS for new tables
-- ============================================================
alter table public.generation_metadata enable row level security;

create policy "Generation metadata viewable by all authenticated"
  on public.generation_metadata for select
  using (auth.role() = 'authenticated');

create policy "Service role can insert generation metadata"
  on public.generation_metadata for insert
  with check (auth.role() = 'service_role');

-- Allow authenticated users to insert
create policy "Authenticated can insert metadata"
  on public.generation_metadata for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTION: Increment question usage count
-- ============================================================
create or replace function public.increment_question_usage(p_question_id uuid)
returns void as $$
begin
  update public.question_bank_mcqs
  set usage_count = usage_count + 1
  where id = p_question_id;
end;
$$ language plpgsql security definer;
