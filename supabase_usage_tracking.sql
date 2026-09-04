create table if not exists public.app_installations (
  installation_id text primary key,
  platform text,
  app_version text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check (char_length(installation_id) between 16 and 80),
  check (platform is null or platform in ('ios', 'android', 'web', 'macos', 'windows', 'unknown'))
);

create table if not exists public.app_premium_status (
  installation_id text not null references public.app_installations(installation_id) on delete cascade,
  source text not null,
  entitlement_id text not null default 'premium',
  active boolean not null default false,
  code_id text,
  revenuecat_app_user_id text,
  details jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (installation_id, source, entitlement_id),
  check (source in ('revenuecat', 'unlock_code')),
  check (char_length(entitlement_id) between 1 and 80),
  check (code_id is null or char_length(code_id) between 1 and 80)
);

create table if not exists public.unlock_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  installation_id text not null references public.app_installations(installation_id) on delete cascade,
  code_id text not null,
  effects text[] not null default '{}'::text[],
  platform text,
  app_version text,
  redeemed_at timestamptz not null default now(),
  unique (installation_id, code_id),
  check (char_length(code_id) between 1 and 80),
  check (platform is null or platform in ('ios', 'android', 'web', 'macos', 'windows', 'unknown'))
);

create index if not exists app_installations_last_seen_at_idx
on public.app_installations(last_seen_at desc);

create index if not exists app_premium_status_source_active_idx
on public.app_premium_status(source, active);

create index if not exists unlock_code_redemptions_code_id_idx
on public.unlock_code_redemptions(code_id);

alter table public.app_installations enable row level security;
alter table public.app_premium_status enable row level security;
alter table public.unlock_code_redemptions enable row level security;

create or replace function public.track_app_installation(
  p_installation_id text,
  p_platform text default null,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_installation_id is null or char_length(p_installation_id) < 16 or char_length(p_installation_id) > 80 then
    raise exception 'Invalid installation id';
  end if;

  insert into public.app_installations (installation_id, platform, app_version)
  values (p_installation_id, coalesce(p_platform, 'unknown'), p_app_version)
  on conflict (installation_id) do update
  set
    platform = coalesce(excluded.platform, public.app_installations.platform),
    app_version = coalesce(excluded.app_version, public.app_installations.app_version),
    last_seen_at = now();
end;
$$;

create or replace function public.track_premium_status(
  p_installation_id text,
  p_source text,
  p_active boolean,
  p_entitlement_id text default 'premium',
  p_code_id text default null,
  p_revenuecat_app_user_id text default null,
  p_details jsonb default '{}'::jsonb,
  p_platform text default null,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source not in ('revenuecat', 'unlock_code') then
    raise exception 'Invalid premium source';
  end if;

  perform public.track_app_installation(p_installation_id, p_platform, p_app_version);

  insert into public.app_premium_status (
    installation_id,
    source,
    entitlement_id,
    active,
    code_id,
    revenuecat_app_user_id,
    details
  )
  values (
    p_installation_id,
    p_source,
    coalesce(p_entitlement_id, 'premium'),
    coalesce(p_active, false),
    p_code_id,
    p_revenuecat_app_user_id,
    coalesce(p_details, '{}'::jsonb)
  )
  on conflict (installation_id, source, entitlement_id) do update
  set
    active = excluded.active,
    code_id = coalesce(excluded.code_id, public.app_premium_status.code_id),
    revenuecat_app_user_id = coalesce(excluded.revenuecat_app_user_id, public.app_premium_status.revenuecat_app_user_id),
    details = excluded.details,
    last_seen_at = now();
end;
$$;

create or replace function public.track_unlock_code_redemption(
  p_installation_id text,
  p_code_id text,
  p_effects text[] default '{}'::text[],
  p_platform text default null,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code_id is null or char_length(p_code_id) < 1 or char_length(p_code_id) > 80 then
    raise exception 'Invalid code id';
  end if;

  perform public.track_app_installation(p_installation_id, p_platform, p_app_version);

  insert into public.unlock_code_redemptions (
    installation_id,
    code_id,
    effects,
    platform,
    app_version
  )
  values (
    p_installation_id,
    p_code_id,
    coalesce(p_effects, '{}'::text[]),
    coalesce(p_platform, 'unknown'),
    p_app_version
  )
  on conflict (installation_id, code_id) do update
  set
    effects = excluded.effects,
    platform = excluded.platform,
    app_version = excluded.app_version,
    redeemed_at = now();

  if 'premium' = any(coalesce(p_effects, '{}'::text[])) then
    perform public.track_premium_status(
      p_installation_id,
      'unlock_code',
      true,
      'premium',
      p_code_id,
      null,
      jsonb_build_object('effects', coalesce(p_effects, '{}'::text[])),
      p_platform,
      p_app_version
    );
  end if;
end;
$$;

revoke all on function public.track_app_installation(text, text, text) from public;
revoke all on function public.track_premium_status(text, text, boolean, text, text, text, jsonb, text, text) from public;
revoke all on function public.track_unlock_code_redemption(text, text, text[], text, text) from public;

grant execute on function public.track_app_installation(text, text, text) to anon, authenticated;
grant execute on function public.track_premium_status(text, text, boolean, text, text, text, jsonb, text, text) to anon, authenticated;
grant execute on function public.track_unlock_code_redemption(text, text, text[], text, text) to anon, authenticated;

-- Dashboard queries:
-- select count(*) as total_installations from public.app_installations;
-- select count(distinct installation_id) as premium_total from public.app_premium_status where active;
-- select count(*) filter (where source = 'revenuecat' and active) as premium_paid from public.app_premium_status;
-- select count(*) filter (where source = 'unlock_code' and active) as premium_codes from public.app_premium_status;
-- select code_id, count(*) as unique_installations from public.unlock_code_redemptions group by code_id order by unique_installations desc;
