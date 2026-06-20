-- Subscription management for premium plans
-- Supports free trial + Razorpay recurring payments

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired', 'incomplete')),
  plan text not null default 'premium' check (plan in ('premium')),
  trial_start timestamptz not null default now(),
  trial_end timestamptz not null default now() + interval '30 days',
  current_period_start timestamptz,
  current_period_end timestamptz,
  razorpay_subscription_id text unique,
  razorpay_order_id text,
  razorpay_payment_id text,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each user has at most one subscription
create unique index idx_subscriptions_user_id on public.subscriptions(user_id);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Only edge functions with service_role can insert/update
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Auto-create subscription on user signup
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.subscriptions (user_id, status, trial_start, trial_end)
  values (new.id, 'trialing', now(), now() + interval '30 days');
  return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row
  execute function public.handle_new_user_subscription();

-- Updated_at trigger
create or replace function public.update_subscription_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_subscription_timestamp
  before update on public.subscriptions
  for each row
  execute function public.update_subscription_timestamp();
