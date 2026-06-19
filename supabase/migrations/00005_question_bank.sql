-- Question Bank Schema for storing generated MCQs and Flashcards

-- ============================================================
-- MCQ QUESTION BANK
-- ============================================================
create table public.question_bank_mcqs (
  id            uuid primary key default uuid_generate_v4(),
  question_text text not null,
  options       jsonb not null, -- Array of 4 options
  correct_answer int not null check (correct_answer >= 0 and correct_answer <= 3),
  explanation   text,
  subject       text not null,
  topic         text not null,
  subtopic      text,
  difficulty    text not null check (difficulty in ('easy', 'medium', 'hard')),
  exam_type     text not null,
  language      text not null default 'en' check (language in ('en', 'ml')),
  source_type   text not null check (source_type in ('ai_generated', 'user_created', 'admin_uploaded')),
  generated_by  uuid references public.profiles(id) on delete set null, -- User who generated this question
  source_note_id uuid, -- Reference to note if generated from note content
  tags          text[] not null default '{}',
  usage_count   int not null default 0, -- How many times this question has been used
  correct_rate  real, -- Percentage of correct answers when used
  quality_score real, -- AI or user rating of question quality
  status        text not null default 'active' check (status in ('active', 'archived', 'flagged')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Create indexes for common queries
create index idx_question_bank_mcqs_subject on public.question_bank_mcqs(subject);
create index idx_question_bank_mcqs_topic on public.question_bank_mcqs(topic);
create index idx_question_bank_mcqs_difficulty on public.question_bank_mcqs(difficulty);
create index idx_question_bank_mcqs_exam_type on public.question_bank_mcqs(exam_type);
create index idx_question_bank_mcqs_generated_by on public.question_bank_mcqs(generated_by);
create index idx_question_bank_mcqs_status on public.question_bank_mcqs(status);
create index idx_question_bank_mcqs_created_at on public.question_bank_mcqs(created_at desc);

-- ============================================================
-- FLASHCARD QUESTION BANK
-- ============================================================
create table public.question_bank_flashcards (
  id            uuid primary key default uuid_generate_v4(),
  front         text not null,
  back          text not null,
  subject       text not null,
  topic         text not null,
  subtopic      text,
  difficulty    text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_type   text not null check (source_type in ('ai_generated', 'user_created', 'admin_uploaded')),
  generated_by  uuid references public.profiles(id) on delete set null, -- User who generated this flashcard
  source_note_id uuid, -- Reference to note if generated from note content
  tags          text[] not null default '{}',
  usage_count   int not null default 0, -- How many times this flashcard has been used
  mastery_rate  real, -- Percentage of users who mastered this card
  quality_score real, -- AI or user rating of flashcard quality
  status        text not null default 'active' check (status in ('active', 'archived', 'flagged')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Create indexes for common queries
create index idx_question_bank_flashcards_subject on public.question_bank_flashcards(subject);
create index idx_question_bank_flashcards_topic on public.question_bank_flashcards(topic);
create index idx_question_bank_flashcards_difficulty on public.question_bank_flashcards(difficulty);
create index idx_question_bank_flashcards_generated_by on public.question_bank_flashcards(generated_by);
create index idx_question_bank_flashcards_status on public.question_bank_flashcards(status);
create index idx_question_bank_flashcards_created_at on public.question_bank_flashcards(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
alter table public.question_bank_mcqs enable row level security;
alter table public.question_bank_flashcards enable row level security;

-- MCQ Policies
-- Allow read access to all authenticated users
create policy "MCQs are viewable by all authenticated users"
  on public.question_bank_mcqs for select
  using (auth.role() = 'authenticated');

-- Allow insert for authenticated users (they can generate questions)
create policy "Users can insert MCQs they generated"
  on public.question_bank_mcqs for insert
  with check (auth.role() = 'authenticated');

-- Allow users to update only their own generated questions
create policy "Users can update their own MCQs"
  on public.question_bank_mcqs for update
  using (generated_by = auth.uid());

-- Flashcard Policies
-- Allow read access to all authenticated users
create policy "Flashcards are viewable by all authenticated users"
  on public.question_bank_flashcards for select
  using (auth.role() = 'authenticated');

-- Allow insert for authenticated users (they can generate flashcards)
create policy "Users can insert flashcards they generated"
  on public.question_bank_flashcards for insert
  with check (auth.role() = 'authenticated');

-- Allow users to update only their own generated flashcards
create policy "Users can update their own flashcards"
  on public.question_bank_flashcards for update
  using (generated_by = auth.uid());

-- ============================================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMP
-- ============================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for auto-updating updated_at
create trigger update_question_bank_mcqs_updated_at
  before update on public.question_bank_mcqs
  for each row
  execute function public.update_updated_at_column();

create trigger update_question_bank_flashcards_updated_at
  before update on public.question_bank_flashcards
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- FUNCTION TO STORE GENERATED MCQ
-- ============================================================
create or replace function public.store_generated_mcq(
  p_question_text text,
  p_options jsonb,
  p_correct_answer int,
  p_explanation text,
  p_subject text,
  p_topic text,
  p_subtopic text,
  p_difficulty text,
  p_exam_type text,
  p_language text default 'en',
  p_source_type text default 'ai_generated',
  p_source_note_id uuid default null,
  p_tags text[] default '{}'
)
returns uuid as $$
declare
  v_user_id uuid;
  v_question_id uuid;
begin
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Insert the question
  insert into public.question_bank_mcqs (
    question_text,
    options,
    correct_answer,
    explanation,
    subject,
    topic,
    subtopic,
    difficulty,
    exam_type,
    language,
    source_type,
    generated_by,
    source_note_id,
    tags
  ) values (
    p_question_text,
    p_options,
    p_correct_answer,
    p_explanation,
    p_subject,
    p_topic,
    p_subtopic,
    p_difficulty,
    p_exam_type,
    p_language,
    p_source_type,
    v_user_id,
    p_source_note_id,
    p_tags
  ) returning id into v_question_id;
  
  return v_question_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION TO STORE GENERATED FLASHCARD
-- ============================================================
create or replace function public.store_generated_flashcard(
  p_front text,
  p_back text,
  p_subject text,
  p_topic text,
  p_subtopic text,
  p_difficulty text,
  p_source_type text default 'ai_generated',
  p_source_note_id uuid default null,
  p_tags text[] default '{}'
)
returns uuid as $$
declare
  v_user_id uuid;
  v_flashcard_id uuid;
begin
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Insert the flashcard
  insert into public.question_bank_flashcards (
    front,
    back,
    subject,
    topic,
    subtopic,
    difficulty,
    source_type,
    generated_by,
    source_note_id,
    tags
  ) values (
    p_front,
    p_back,
    p_subject,
    p_topic,
    p_subtopic,
    p_difficulty,
    p_source_type,
    v_user_id,
    p_source_note_id,
    p_tags
  ) returning id into v_flashcard_id;
  
  return v_flashcard_id;
end;
$$ language plpgsql security definer;
