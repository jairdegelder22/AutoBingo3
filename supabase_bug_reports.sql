create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bug-report-screenshots',
  'bug-report-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'triaged', 'in_progress', 'fixed', 'wontfix')),
  location text not null check (char_length(location) between 3 and 120),
  summary text not null check (char_length(summary) between 6 and 500),
  steps text not null check (char_length(steps) between 6 and 1200),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high')),
  screenshot_path text,
  screenshot_mime_type text
    check (
      screenshot_mime_type is null
      or screenshot_mime_type in ('image/jpeg', 'image/png', 'image/webp')
    ),
  screenshot_size integer check (
    screenshot_size is null
    or (screenshot_size > 0 and screenshot_size <= 5242880)
  ),
  context jsonb not null default '{}'::jsonb,
  app_version text,
  source text not null default 'app',
  constraint bug_reports_screenshot_path_safe check (
    screenshot_path is null
    or screenshot_path ~ '^reports/[A-Za-z0-9._-]+\\.(jpg|jpeg|png|webp)$'
  )
);

alter table public.bug_reports enable row level security;
alter table public.bug_reports force row level security;

grant usage on schema public to anon, authenticated;
revoke select, update, delete on public.bug_reports from anon, authenticated;
grant insert on public.bug_reports to anon, authenticated;

drop policy if exists "Bug reports can be created from the app" on public.bug_reports;
create policy "Bug reports can be created from the app"
on public.bug_reports
for insert
to anon, authenticated
with check (
  source = 'app'
  and status = 'new'
  and char_length(location) between 3 and 120
  and char_length(summary) between 6 and 500
  and char_length(steps) between 6 and 1200
  and severity in ('low', 'medium', 'high')
  and (
    screenshot_path is null
    or screenshot_path ~ '^reports/[A-Za-z0-9._-]+\\.(jpg|jpeg|png|webp)$'
  )
);

drop policy if exists "Bug screenshots can be uploaded from the app" on storage.objects;
create policy "Bug screenshots can be uploaded from the app"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'bug-report-screenshots'
  and name ~ '^reports/[A-Za-z0-9._-]+\\.(jpg|jpeg|png|webp)$'
);

create index if not exists bug_reports_created_at_idx
on public.bug_reports (created_at desc);

create index if not exists bug_reports_status_idx
on public.bug_reports (status);
