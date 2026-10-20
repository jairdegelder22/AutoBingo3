create table if not exists public.account_skin_challenge_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_skin_challenge_progress_updated_at_idx
on public.account_skin_challenge_progress(updated_at);

drop trigger if exists set_account_skin_challenge_progress_updated_at
on public.account_skin_challenge_progress;
create trigger set_account_skin_challenge_progress_updated_at
before update on public.account_skin_challenge_progress
for each row
execute function public.set_updated_at();

alter table public.account_skin_challenge_progress enable row level security;

drop policy if exists "users can select own skin challenge progress"
on public.account_skin_challenge_progress;
create policy "users can select own skin challenge progress"
on public.account_skin_challenge_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own skin challenge progress"
on public.account_skin_challenge_progress;
create policy "users can insert own skin challenge progress"
on public.account_skin_challenge_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own skin challenge progress"
on public.account_skin_challenge_progress;
create policy "users can update own skin challenge progress"
on public.account_skin_challenge_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.account_skin_challenge_progress to authenticated;
