-- User suggestions/feedback table
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  subject text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

create policy "Users can insert own suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can read own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

create policy "Admins can read all suggestions"
  on public.suggestions for select
  using (exists (select 1 from profiles where auth_user_id = auth.uid() and role in ('admin', 'superadmin')));

create policy "Admins can update suggestions"
  on public.suggestions for update
  using (exists (select 1 from profiles where auth_user_id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from profiles where auth_user_id = auth.uid() and role in ('admin', 'superadmin')));

create or replace function public.admin_get_suggestions()
returns table (
  id uuid,
  user_id uuid,
  user_name text,
  subject text,
  message text,
  status text,
  created_at timestamptz
)
language sql
security definer
as $$
  select id, user_id, user_name, subject, message, status, created_at
  from public.suggestions
  order by created_at desc;
$$;

create or replace function public.admin_update_suggestion_status(_id uuid, _status text)
returns void
language sql
security definer
as $$
  update public.suggestions set status = _status where id = _id;
$$;
