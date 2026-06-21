-- Lakshyam — Recommendation Impact Tracking
-- Tracks recommendation type → learning outcome for every recommended practice session

-- ============================================================
-- RECOMMENDATION IMPACT
-- ============================================================
create table if not exists public.recommendation_impact (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  recommendation_id   text not null,
  recommendation_type text not null check (recommendation_type in ('weakness_only', 'frequency_boosted', 'hybrid')),
  topic               text not null,
  subject             text not null,
  source              text not null default 'hybrid',
  questions_attempted int not null default 0,
  questions_correct   int not null default 0,
  accuracy_before     real,
  accuracy_after      real,
  mastery_before      real,
  mastery_after       real,
  knowledge_gap_closed boolean not null default false,
  session_duration_sec int not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists idx_impact_profile on public.recommendation_impact(profile_id);
create index if not exists idx_impact_type on public.recommendation_impact(recommendation_type);
create index if not exists idx_impact_topic on public.recommendation_impact(topic);
create index if not exists idx_impact_created on public.recommendation_impact(created_at desc);

-- ============================================================
-- CORPUS HEALTH SNAPSHOT (materialized for dashboard)
-- ============================================================
drop materialized view if exists public.corpus_health;
create materialized view public.corpus_health as
with question_stats as (
  select
    count(*) as total_questions,
    count(*) filter (where correct_answer is not null and correct_answer != '') as with_answers,
    count(*) filter (
      where jsonb_array_length(options) >= 4
        and coalesce(options->>0, '') != ''
        and coalesce(options->>1, '') != ''
        and coalesce(options->>2, '') != ''
        and coalesce(options->>3, '') != ''
    ) as with_all_options,
    count(*) filter (
      where correct_answer is not null and correct_answer != ''
        and jsonb_array_length(options) >= 4
        and coalesce(options->>0, '') != ''
        and coalesce(options->>1, '') != ''
        and coalesce(options->>2, '') != ''
        and coalesce(options->>3, '') != ''
    ) as quiz_ready,
    count(*) filter (where topic is not null and topic != '') as with_topic,
    count(distinct exam_id) as exam_count,
    count(distinct coalesce(topic, 'untagged')) as topic_count
  from public.psc_questions
),
duplicate_stats as (
  select
    count(*) as total_pairs,
    count(*) filter (where year_1 != year_2) as cross_year_pairs
  from public.psc_duplicates
)
select
  qs.*,
  round(100.0 * qs.with_answers / nullif(qs.total_questions, 0), 1) as answer_coverage_pct,
  round(100.0 * qs.with_all_options / nullif(qs.total_questions, 0), 1) as option_coverage_pct,
  round(100.0 * qs.quiz_ready / nullif(qs.total_questions, 0), 1) as quiz_ready_pct,
  round(100.0 * qs.with_topic / nullif(qs.total_questions, 0), 1) as topic_coverage_pct,
  ds.total_pairs as duplicate_pairs,
  ds.cross_year_pairs,
  round(100.0 * ds.total_pairs / nullif(qs.total_questions, 0), 1) as duplicate_rate_pct,
  now() as snapshot_at
from question_stats qs, duplicate_stats ds;

create unique index if not exists idx_corpus_health_snapshot on public.corpus_health(snapshot_at);

-- ============================================================
-- HIGH YIELD TOPICS (materialized view)
-- ============================================================
drop materialized view if exists public.high_yield_topics;
create materialized view public.high_yield_topics as
with topic_base as (
  select
    coalesce(q.topic, 'untagged') as topic,
    string_agg(distinct coalesce(q.subject, 'General'), ', ' order by coalesce(q.subject, 'General')) as subjects,
    count(*) as total_questions,
    count(distinct q.exam_id) as exam_count,
    count(distinct e.year) as year_count,
    count(distinct e.year) as distinct_years,
    array_agg(distinct e.year order by e.year) filter (where e.year is not null) as years_appeared,
    -- Duplicate count for this topic
    coalesce((
      select count(*)
      from public.psc_duplicates pd
      join public.psc_questions pq1 on pd.question_id_1 = pq1.id
      where pq1.topic = q.topic
    ), 0) + coalesce((
      select count(*)
      from public.psc_duplicates pd
      join public.psc_questions pq2 on pd.question_id_2 = pq2.id
      where pq2.topic = q.topic
    ), 0) as duplicate_count,
    -- Frequency score: questions per year
    round(count(*)::numeric / nullif(count(distinct e.year), 0), 1) as freq_per_year
  from public.psc_questions q
  join public.psc_exams e on q.exam_id = e.id
  group by q.topic
),
max_q as (
  select max(total_questions) as max_q from topic_base
),
max_freq as (
  select max(freq_per_year) as max_freq from topic_base
),
max_dup as (
  select max(duplicate_count) as max_dup from topic_base
)
select
  tb.topic,
  tb.subjects,
  tb.total_questions,
  tb.exam_count,
  tb.distinct_years,
  tb.years_appeared,
  tb.duplicate_count,
  tb.freq_per_year,
  -- Normalized scores (0-100)
  round(100.0 * tb.total_questions / nullif(mq.max_q, 0), 1) as volume_score,
  round(100.0 * tb.freq_per_year / nullif(mf.max_freq, 0), 1) as frequency_score,
  round(100.0 * tb.distinct_years / 16.0, 1) as persistence_score,
  round(100.0 * tb.duplicate_count / nullif(md.max_dup, 0), 1) as repeat_score,
  -- Composite yield score (weighted average)
  round(
    0.35 * 100.0 * tb.total_questions / nullif(mq.max_q, 0) +
    0.25 * 100.0 * tb.freq_per_year / nullif(mf.max_freq, 0) +
    0.20 * 100.0 * tb.distinct_years / 16.0 +
    0.20 * 100.0 * tb.duplicate_count / nullif(md.max_dup, 0)
  , 1) as yield_score,
  rank() over (order by
    0.35 * tb.total_questions / nullif(mq.max_q, 0) +
    0.25 * tb.freq_per_year / nullif(mf.max_freq, 0) +
    0.20 * tb.distinct_years / 16.0 +
    0.20 * tb.duplicate_count / nullif(md.max_dup, 0) desc
  ) as yield_rank
from topic_base tb, max_q mq, max_freq mf, max_dup md
order by yield_score desc;

create unique index if not exists idx_high_yield_topic on public.high_yield_topics(topic);

-- ============================================================
-- FUNCTION: Get all corpus health metrics (returns JSONB for screen)
-- ============================================================
create or replace function public.get_corpus_health()
returns jsonb as $$
declare
  v jsonb;
  v_years int;
  v_sessions int;
begin
  select count(distinct year) into v_years from public.psc_exams where year is not null;
  select count(*) into v_sessions from public.recommendation_impact;

  select jsonb_build_object(
    'total_questions', ch.total_questions,
    'questions_with_answer', ch.with_answers,
    'answer_coverage_pct', ch.answer_coverage_pct,
    'questions_with_options', ch.with_all_options,
    'option_coverage_pct', ch.option_coverage_pct,
    'all_four_options_pct', ch.quiz_ready_pct,
    'duplicate_pairs', ch.duplicate_pairs,
    'duplicate_questions_pct', ch.duplicate_rate_pct,
    'topics_covered', ch.topic_count,
    'topic_coverage_pct', ch.topic_coverage_pct,
    'subjects_covered', (select count(distinct subject) from public.psc_questions where subject is not null and subject != ''),
    'exams_total', ch.exam_count,
    'years_covered', v_years,
    'avg_questions_per_exam', round(ch.total_questions::numeric / nullif(ch.exam_count, 0), 1),
    'total_recommendation_sessions', v_sessions,
    'last_updated', ch.snapshot_at
  ) into v
  from public.corpus_health ch
  limit 1;

  return v;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Get distinct values from any table column (used by edge function for filters)
-- ============================================================
create or replace function public.get_distinct_values(table_name text, column_name text)
returns table (value text) as $$
begin
  return query execute format(
    'select distinct %I::text from %I where %I is not null and %I != '''' order by 1',
    column_name, table_name, column_name, column_name
  );
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Record recommendation impact (called after practice session)
-- ============================================================
create or replace function public.record_recommendation_impact(
  p_profile_id uuid,
  p_recommendation_id text,
  p_recommendation_type text,
  p_topic text,
  p_subject text,
  p_source text default 'hybrid',
  p_questions_attempted int default 0,
  p_questions_correct int default 0,
  p_accuracy_before real default null,
  p_accuracy_after real default null,
  p_mastery_before real default null,
  p_mastery_after real default null,
  p_knowledge_gap_closed boolean default false,
  p_session_duration_sec int default 0
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into public.recommendation_impact (
    profile_id, recommendation_id, recommendation_type, topic, subject, source,
    questions_attempted, questions_correct, accuracy_before, accuracy_after,
    mastery_before, mastery_after, knowledge_gap_closed, session_duration_sec
  ) values (
    p_profile_id, p_recommendation_id, p_recommendation_type, p_topic, p_subject, p_source,
    p_questions_attempted, p_questions_correct, p_accuracy_before, p_accuracy_after,
    p_mastery_before, p_mastery_after, p_knowledge_gap_closed, p_session_duration_sec
  ) returning id into v_id;

  return v_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.recommendation_impact enable row level security;

create policy "Users manage own recommendation impact"
  on public.recommendation_impact for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- Health and yield MVs are public-readable (no RLS on materialized views)
