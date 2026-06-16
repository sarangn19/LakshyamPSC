-- Lakshyam — Initial Supabase Schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  user_name     text not null default '',
  target_exams  text[] not null default '{}',
  primary_exam  text not null default '',
  exam_date     date,
  daily_target_mcqs     int not null default 10,
  daily_target_flashcards int not null default 10,
  setup_complete boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- STUDY STREAKS
-- ============================================================
create table public.study_streaks (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  current       int not null default 0,
  longest       int not null default 0,
  last_study_date date,
  study_dates   date[] not null default '{}',
  unique(profile_id)
);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
create table public.study_sessions (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  session_type  text not null check (session_type in ('mcq', 'flashcard', 'revision', 'ai_tutor', 'current_affairs')),
  subject       text,
  topic         text,
  duration_sec  int not null default 0,
  questions_attempted int not null default 0,
  questions_correct   int not null default 0,
  accuracy      real,
  score         int,
  completed     boolean not null default false,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

create index idx_sessions_profile on public.study_sessions(profile_id, started_at desc);

-- ============================================================
-- MCQ ATTEMPTS
-- ============================================================
create table public.mcq_attempts (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  session_id    uuid references public.study_sessions(id) on delete set null,
  question_id   text not null,
  question_text text not null,
  subject       text not null,
  topic         text,
  options       jsonb not null,
  correct_answer text not null,
  user_answer   text,
  is_correct    boolean,
  time_taken_sec int,
  created_at    timestamptz not null default now()
);

create index idx_mcq_profile on public.mcq_attempts(profile_id, created_at desc);

-- ============================================================
-- FLASHCARD REVIEWS
-- ============================================================
create table public.flashcard_reviews (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  session_id    uuid references public.study_sessions(id) on delete set null,
  flashcard_id  text not null,
  front_text    text not null,
  back_text     text not null,
  subject       text not null,
  difficulty    int check (difficulty between 1 and 5),
  is_recalled   boolean,
  next_review_at timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_flashcard_profile on public.flashcard_reviews(profile_id, created_at desc);

-- ============================================================
-- NOTES (Knowledge Repository)
-- ============================================================
create table public.notes (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  title         text not null default '',
  content       text not null default '',
  subject       text not null default 'General',
  tags          text[] not null default '{}',
  note_type     text not null default 'text' check (note_type in ('text', 'voice', 'scan')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_notes_profile on public.notes(profile_id, updated_at desc);

-- ============================================================
-- SUBJECT PROGRESS
-- ============================================================
create table public.subject_progress (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  subject       text not null,
  topic         text not null default '',
  total_questions   int not null default 0,
  correct_answers  int not null default 0,
  accuracy      real,
  mastery_level text not null default 'upcoming'
    check (mastery_level in ('strong', 'improving', 'needs_revision', 'weak_area', 'upcoming')),
  last_studied  timestamptz,
  unique(profile_id, subject, topic)
);

-- ============================================================
-- GOALS
-- ============================================================
create table public.goals (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  target_date   date not null,
  mcqs_planned  int not null default 0,
  mcqs_done     int not null default 0,
  flashcards_planned int not null default 0,
  flashcards_done    int not null default 0,
  completed     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique(profile_id, target_date)
);

-- ============================================================
-- CURRENT AFFAIRS
-- ============================================================
create table public.current_affairs (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  summary       text not null,
  category      text not null,
  source        text,
  url           text,
  published_at  date not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- FEEDBACK / INTERACTION SIGNALS
-- ============================================================
create table public.interaction_signals (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  signal_type   text not null,
  payload       jsonb not null default '{}',
  session_id    uuid references public.study_sessions(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.study_streaks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.mcq_attempts enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.notes        enable row level security;
alter table public.subject_progress enable row level security;
alter table public.goals        enable row level security;
alter table public.current_affairs enable row level security;
alter table public.interaction_signals enable row level security;

-- Users can read/write only their own data
create policy "Users can manage own profile"
  on public.profiles for all using (auth.uid() = auth_user_id);

create policy "Users can manage own streak"
  on public.study_streaks for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own sessions"
  on public.study_sessions for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own mcq attempts"
  on public.mcq_attempts for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own flashcard reviews"
  on public.flashcard_reviews for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own notes"
  on public.notes for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own progress"
  on public.subject_progress for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "Users can manage own goals"
  on public.goals for all using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- Current affairs are public read, admin write
create policy "Current affairs are publicly readable"
  on public.current_affairs for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (auth_user_id, user_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'user_name', ''));
  insert into public.study_streaks (profile_id)
  values ((select id from public.profiles where auth_user_id = new.id));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
