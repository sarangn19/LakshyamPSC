-- Lakshyam — PSC Corpus: Previous Year Questions from PSC Thriller
-- 17,165 questions from 114 Kerala PSC exam papers (2011-2026)
-- 8,481 exact duplicate pairs, 38.1% with all 4 options

-- ============================================================
-- PSC EXAMS (Question Papers)
-- ============================================================
create table if not exists public.psc_exams (
  id            integer primary key,
  title         text not null,
  year          smallint,
  category      text not null default '',
  source_url    text,
  status        text not null default 'extracted'
                check (status in ('extracted', 'review_required', 'no_questions', 'ocr_completed')),
  question_count integer not null default 0,
  answer_count   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_psc_exams_year on public.psc_exams(year desc);
create index if not exists idx_psc_exams_category on public.psc_exams(category);

-- ============================================================
-- PSC QUESTIONS (17,165 Previous Year Questions)
-- ============================================================
create table if not exists public.psc_questions (
  id              integer primary key,
  exam_id         integer not null references public.psc_exams(id) on delete cascade,
  question_number smallint,
  question        text not null,
  options         jsonb not null default '[]'::jsonb, -- ["option_a", "option_b", "option_c", "option_d"]
  correct_answer  text,           -- 'A', 'B', 'C', 'D', or null
  subject         text,           -- Mapped to knowledge_tree node name
  topic           text,           -- Mapped to knowledge_tree node name
  node_id         text,           -- FK to knowledge_nodes.id (nullable until tagged)
  language        text not null default 'ml' check (language in ('en', 'ml')),
  option_count    smallint not null default 0, -- How many options are non-empty
  has_answer      boolean not null default false,
  is_quiz_ready   boolean not null default false, -- Has answer + all 4 options
  created_at      timestamptz not null default now()
);

-- Partition by exam for fast per-exam queries
create index if not exists idx_psc_questions_exam on public.psc_questions(exam_id);
create index if not exists idx_psc_questions_subject on public.psc_questions(subject);
create index if not exists idx_psc_questions_topic on public.psc_questions(topic);
create index if not exists idx_psc_questions_node on public.psc_questions(node_id);
create index if not exists idx_psc_questions_language on public.psc_questions(language);
create index if not exists idx_psc_questions_quiz_ready on public.psc_questions(is_quiz_ready) where is_quiz_ready = true;
create index if not exists idx_psc_questions_has_answer on public.psc_questions(has_answer) where has_answer = true;

-- Full-text search for question text
create index if not exists idx_psc_questions_search
  on public.psc_questions
  using gin(to_tsvector('english', question));

-- ============================================================
-- PSC DUPLICATES (8,481 exact duplicate question pairs)
-- ============================================================
create table if not exists public.psc_duplicates (
  id                integer primary key,
  question_id_1     integer not null references public.psc_questions(id) on delete cascade,
  question_id_2     integer not null references public.psc_questions(id) on delete cascade,
  similarity_score  real not null default 1.0,
  match_type        text not null default 'exact'
                    check (match_type in ('exact', 'near', 'fuzzy', 'cross_year')),
  exam_id_1         integer references public.psc_exams(id) on delete set null,
  exam_id_2         integer references public.psc_exams(id) on delete set null,
  year_1            smallint,
  year_2            smallint,
  created_at        timestamptz not null default now(),
  unique(question_id_1, question_id_2)
);

create index if not exists idx_psc_duplicates_q1 on public.psc_duplicates(question_id_1);
create index if not exists idx_psc_duplicates_q2 on public.psc_duplicates(question_id_2);
create index if not exists idx_psc_duplicates_type on public.psc_duplicates(match_type);

-- ============================================================
-- PSC TOPIC FREQUENCIES (Materialized View)
-- ============================================================
create materialized view if not exists public.psc_topic_frequencies as
select
  coalesce(q.subject, 'General') as subject_name,
  coalesce(q.topic, 'untagged') as topic_name,
  q.node_id,
  count(*) as question_count,
  rank() over (
    partition by coalesce(q.subject, 'General')
    order by count(*) desc
  ) as frequency_rank,
  count(distinct q.exam_id) as exam_count,
  count(distinct e.year) as year_count
from public.psc_questions q
join public.psc_exams e on q.exam_id = e.id
where q.topic is not null
group by q.subject, q.topic, q.node_id
order by count(*) desc;

create unique index idx_psc_topic_frequencies_node on public.psc_topic_frequencies(node_id);

-- ============================================================
-- PSC MOST REPEATED QUESTIONS (View)
-- ============================================================
create view public.psc_most_repeated_questions as
select
  q.id,
  q.question,
  q.subject,
  q.topic,
  q.exam_id,
  e.title as exam_name,
  e.year,
  count(pd.id) as duplicate_count,
  array_agg(distinct pd2.title) filter (where pd2.id is not null) as repeated_in_exams
from public.psc_questions q
join public.psc_exams e on q.exam_id = e.id
left join public.psc_duplicates pd on q.id in (pd.question_id_1, pd.question_id_2)
left join public.psc_questions pqd on (pd.question_id_1 = q.id and pd.question_id_2 = pqd.id)
                                  or (pd.question_id_2 = q.id and pd.question_id_1 = pqd.id)
left join public.psc_exams pd2 on pqd.exam_id = pd2.id
group by q.id, q.question, q.subject, q.topic, q.exam_id, e.title, e.year
having count(pd.id) > 0
order by duplicate_count desc;

-- ============================================================
-- FUNCTION: Get PYQs with filters (used by psc-pyq-explorer edge function)
-- ============================================================
create or replace function public.get_psc_questions(
  p_exam_category text default null,
  p_year_from smallint default null,
  p_year_to smallint default null,
  p_subject text default null,
  p_topic text default null,
  p_language text default null,
  p_only_quiz_ready boolean default false,
  p_only_answered boolean default false,
  p_search text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id integer,
  question text,
  options jsonb,
  correct_answer text,
  subject text,
  topic text,
  exam_name text,
  exam_category text,
  year smallint,
  language text,
  is_quiz_ready boolean,
  has_answer boolean,
  total_count bigint
) as $$
declare
  v_total bigint;
begin
  -- First, get total count for pagination
  select count(*) into v_total
  from public.psc_questions q
  join public.psc_exams e on q.exam_id = e.id
  where (p_exam_category is null or e.category = p_exam_category)
    and (p_year_from is null or e.year >= p_year_from)
    and (p_year_to is null or e.year <= p_year_to)
    and (p_subject is null or q.subject = p_subject)
    and (p_topic is null or q.topic = p_topic)
    and (p_language is null or q.language = p_language)
    and (p_only_quiz_ready = false or q.is_quiz_ready = true)
    and (p_only_answered = false or q.has_answer = true)
    and (p_search is null or q.question ilike '%' || p_search || '%');

  -- Return paginated results
  return query
  select
    q.id,
    q.question,
    q.options,
    q.correct_answer,
    q.subject,
    q.topic,
    e.title as exam_name,
    e.category as exam_category,
    e.year,
    q.language,
    q.is_quiz_ready,
    q.has_answer,
    v_total as total_count
  from public.psc_questions q
  join public.psc_exams e on q.exam_id = e.id
  where (p_exam_category is null or e.category = p_exam_category)
    and (p_year_from is null or e.year >= p_year_from)
    and (p_year_to is null or e.year <= p_year_to)
    and (p_subject is null or q.subject = p_subject)
    and (p_topic is null or q.topic = p_topic)
    and (p_language is null or q.language = p_language)
    and (p_only_quiz_ready = false or q.is_quiz_ready = true)
    and (p_only_answered = false or q.has_answer = true)
    and (p_search is null or q.question ilike '%' || p_search || '%')
  order by e.year desc, q.id
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Most Repeated Topics
-- ============================================================
create or replace function public.get_psc_top_topics(
  p_limit int default 20
)
returns table (
  subject text,
  topic text,
  question_count bigint,
  repeat_count bigint,
  frequency_rank bigint,
  sample_question text
) as $$
begin
  return query
  with topic_counts as (
    select
      q.subject,
      q.topic,
      count(*) as question_count,
      count(distinct pd.id) as repeat_count,
      rank() over (order by count(*) desc) as freq_rank
    from public.psc_questions q
    left join public.psc_duplicates pd on q.id in (pd.question_id_1, pd.question_id_2)
    where q.topic is not null
    group by q.subject, q.topic
  )
  select
    tc.subject,
    tc.topic,
    tc.question_count,
    tc.repeat_count,
    tc.freq_rank::bigint,
    (select q2.question from public.psc_questions q2
     where q2.topic = tc.topic and q2.subject = tc.subject
     order by q2.id limit 1) as sample_question
  from topic_counts tc
  order by tc.question_count desc
  limit p_limit;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: PYQ Session Generator (generates a practice session from PSC corpus)
-- ============================================================
create or replace function public.generate_psc_session(
  p_profile_id uuid,
  p_subject text default null,
  p_topic text default null,
  p_exam_category text default null,
  p_count int default 10,
  p_include_answers boolean default true
)
returns table (
  question_id integer,
  question text,
  options jsonb,
  correct_answer text,
  subject text,
  topic text,
  exam_name text,
  year smallint
) as $$
begin
  return query
  select
    q.id,
    q.question,
    q.options,
    case when p_include_answers then q.correct_answer else null end,
    q.subject,
    q.topic,
    e.title,
    e.year
  from public.psc_questions q
  join public.psc_exams e on q.exam_id = e.id
  where (p_subject is null or q.subject = p_subject)
    and (p_topic is null or q.topic = p_topic)
    and (p_exam_category is null or e.category = p_exam_category)
    and (p_include_answers = false or q.has_answer = true)
    -- Use option_count >= 4 AND has_answer instead of is_quiz_ready
    -- to include all questions with 4+ options and a valid answer key
    and q.option_count >= 4
    and q.has_answer = true
  order by random()
  limit p_count;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.psc_exams enable row level security;
alter table public.psc_questions enable row level security;
alter table public.psc_duplicates enable row level security;

-- PYQs are publicly readable (educational content)
create policy "PSC exams are readable by all authenticated users"
  on public.psc_exams for select
  using (auth.role() = 'authenticated');

create policy "PSC questions are readable by all authenticated users"
  on public.psc_questions for select
  using (auth.role() = 'authenticated');

create policy "PSC duplicates are readable by all authenticated users"
  on public.psc_duplicates for select
  using (auth.role() = 'authenticated');
