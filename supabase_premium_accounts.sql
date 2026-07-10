create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  selected_car_skin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_id text not null,
  active boolean not null default false,
  source text not null default 'revenuecat',
  product_id text,
  store text,
  revenuecat_app_user_id text,
  original_app_user_id text,
  purchased_at timestamptz,
  expires_at timestamptz,
  latest_event_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_id)
);

create table if not exists public.revenuecat_events (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text,
  entitlement_id text,
  product_id text,
  store text,
  revenuecat_app_user_id text,
  original_app_user_id text,
  event_at timestamptz,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.lobbies
add column if not exists host_user_id uuid references auth.users(id) on delete set null;

create index if not exists account_entitlements_user_id_idx
on public.account_entitlements(user_id);

create index if not exists account_entitlements_active_idx
on public.account_entitlements(user_id, entitlement_id, active);

create index if not exists revenuecat_events_user_id_idx
on public.revenuecat_events(user_id);

create index if not exists lobbies_host_user_id_idx
on public.lobbies(host_user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_account_entitlements_updated_at on public.account_entitlements;
create trigger set_account_entitlements_updated_at
before update on public.account_entitlements
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.user_has_entitlement(
  target_entitlement text default 'premium'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_entitlements entitlements
    where entitlements.user_id = auth.uid()
      and entitlements.entitlement_id = target_entitlement
      and entitlements.active = true
      and (
        entitlements.expires_at is null
        or entitlements.expires_at > now()
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.account_entitlements enable row level security;
alter table public.revenuecat_events enable row level security;

drop policy if exists "users can select own profile" on public.profiles;
create policy "users can select own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can select own entitlements" on public.account_entitlements;
create policy "users can select own entitlements"
on public.account_entitlements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can select own revenuecat events" on public.revenuecat_events;
create policy "users can select own revenuecat events"
on public.revenuecat_events
for select
to authenticated
using (auth.uid() = user_id);
