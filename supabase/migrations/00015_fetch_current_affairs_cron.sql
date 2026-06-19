-- Add image_url column for news thumbnails
alter table public.current_affairs add column if not exists image_url text;

-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Schedule fetch-current-affairs every 6 hours (no auth needed — no-verify-jwt)
select cron.schedule(
  'fetch-current-affairs',
  '0 */6 * * *',
  $$select net.http_post(
    url:='https://cycutcqlhpeudmaebwmb.supabase.co/functions/v1/fetch-current-affairs',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );$$
);
