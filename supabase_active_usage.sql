-- Daily usage is separate from app_installations.last_seen_at: purchase/account
-- synchronization must not be mistaken for someone opening or playing the app.
create schema if not exists analytics_private;
revoke all on schema analytics_private from public;
grant usage on schema analytics_private to anon, authenticated;

create table public.app_daily_activity (
  activity_date date not null,
  installation_id text not null check (char_length(installation_id) between 16 and 80),
  platform text not null,
  app_version text,
  online_players smallint not null default 0 check (online_players between 0 and 16),
  offline_players smallint not null default 0 check (offline_players between 0 and 16),
  primary key (activity_date, installation_id)
);
alter table public.app_daily_activity enable row level security;
revoke all on public.app_daily_activity from public, anon, authenticated;

create table public.app_game_sessions (
  installation_id text not null,
  session_id text not null,
  started_date date not null,
  mode text not null check (mode in ('online','offline')),
  local_player_count smallint not null check (local_player_count between 1 and 16),
  primary key (installation_id,session_id)
);
create index app_game_sessions_started_date_idx on public.app_game_sessions(started_date);
alter table public.app_game_sessions enable row level security;
revoke all on public.app_game_sessions from public, anon, authenticated;

-- Guests can submit bounded, pseudonymous telemetry without signing in.
-- The definer helper grants no data access and returns no installation data.
-- Installation IDs are client supplied; these are usage estimates, not verified people.
create function analytics_private.record_daily_activity(
  p_installation_id text, p_days jsonb, p_platform text, p_app_version text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  entry jsonb;
  day date;
  online_count integer;
  offline_count integer;
  game jsonb;
  today date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if p_installation_id is null or p_installation_id !~ '^[A-Za-z0-9_-]{16,80}$' then
    raise exception 'Invalid installation id';
  end if;
  if p_platform is null or p_platform not in ('ios','android','web','macos','windows','unknown')
     or char_length(p_app_version) > 40 then
    raise exception 'Invalid app metadata';
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array' then
    raise exception 'Invalid activity batch';
  end if;
  if jsonb_array_length(p_days) not between 1 and 90 or octet_length(p_days::text) > 3000000 then
    raise exception 'Invalid activity batch size';
  end if;

  for entry in select value from jsonb_array_elements(p_days) loop
    if jsonb_typeof(entry) <> 'object'
       or coalesce(entry->>'activity_date', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Invalid activity date';
    end if;
    day := (entry->>'activity_date')::date;
    online_count := (entry->>'online_players')::integer;
    offline_count := (entry->>'offline_players')::integer;
    if online_count is null or offline_count is null
       or online_count not between 0 and 16 or offline_count not between 0 and 16 then
      raise exception 'Invalid player count';
    end if;
    -- Expired queued days and incorrect future clocks do not poison the batch.
    if day < today - 89 or day > today then continue; end if;

    if jsonb_typeof(entry->'games') is distinct from 'array' then
      raise exception 'Invalid games';
    end if;
    if jsonb_array_length(entry->'games') > 250 then raise exception 'Too many games'; end if;
    for game in select value from jsonb_array_elements(entry->'games') loop
      if coalesce(game->>'session_id','') !~ '^[A-Za-z0-9_-]{16,80}$'
         or coalesce(game->>'mode','') not in ('online','offline')
         or coalesce((game->>'player_count')::integer,0) not between 1 and 16 then
        raise exception 'Invalid game';
      end if;
      insert into public.app_game_sessions
        (installation_id,session_id,started_date,mode,local_player_count)
      values (p_installation_id,game->>'session_id',day,game->>'mode',(game->>'player_count')::smallint)
      on conflict (installation_id,session_id) do nothing;
    end loop;

    insert into public.app_daily_activity as existing
      (activity_date, installation_id, platform, app_version, online_players, offline_players)
    values (day, p_installation_id, p_platform, p_app_version, online_count, offline_count)
    on conflict (activity_date, installation_id) do update set
      online_players = greatest(existing.online_players, excluded.online_players),
      offline_players = greatest(existing.offline_players, excluded.offline_players),
      platform = excluded.platform,
      app_version = excluded.app_version
    where existing.online_players < excluded.online_players
       or existing.offline_players < excluded.offline_players;
  end loop;
end;
$$;
revoke all on function analytics_private.record_daily_activity(text,jsonb,text,text) from public, anon, authenticated;
grant execute on function analytics_private.record_daily_activity(text,jsonb,text,text) to anon, authenticated;

create function public.track_daily_activity(
  p_installation_id text, p_days jsonb, p_platform text, p_app_version text
) returns void
language sql security invoker set search_path = ''
as $$
  select analytics_private.record_daily_activity(p_installation_id,p_days,p_platform,p_app_version);
$$;
revoke all on function public.track_daily_activity(text,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.track_daily_activity(text,jsonb,text,text) to anon, authenticated;

-- Admin-only views: open these in the Supabase Table Editor or SQL Editor.
create view public.app_activity_daily with (security_invoker = true) as
with dates as (
  select ((now() at time zone 'Europe/Amsterdam')::date - n) as day
  from generate_series(0,89) as n
)
select dates.day as activity_date,
  count(a.installation_id) as active_devices,
  count(a.installation_id) filter (where greatest(a.online_players,a.offline_players) > 0) as playing_devices,
  count(a.installation_id) filter (where a.online_players > 0) as online_playing_devices,
  count(a.installation_id) filter (where a.offline_players > 0) as offline_playing_devices,
  coalesce(sum(greatest(a.online_players,a.offline_players)),0) as estimated_player_places
from dates left join public.app_daily_activity a on a.activity_date = dates.day
group by dates.day order by dates.day desc;

create view public.app_activity_summary with (security_invoker = true) as
with periods(label,days) as (values ('today',1),('last_7_days',7),('last_30_days',30)),
per_device as (
  select p.label, p.days, a.installation_id,
    max(a.online_players) as online_players, max(a.offline_players) as offline_players
  from periods p left join public.app_daily_activity a
    on a.activity_date between (now() at time zone 'Europe/Amsterdam')::date - (p.days-1)
                          and (now() at time zone 'Europe/Amsterdam')::date
  group by p.label,p.days,a.installation_id
)
select label as period,
  count(installation_id) as active_devices,
  count(installation_id) filter (where greatest(online_players,offline_players)>0) as playing_devices,
  count(installation_id) filter (where online_players>0) as online_playing_devices,
  count(installation_id) filter (where offline_players>0) as offline_playing_devices,
  coalesce(sum(greatest(online_players,offline_players)),0) as estimated_player_places
from per_device group by label,days order by days;

revoke all on public.app_activity_daily, public.app_activity_summary from public, anon, authenticated;
grant select on public.app_daily_activity, public.app_activity_daily, public.app_activity_summary to service_role;

create view public.app_games_daily with (security_invoker = true) as
select started_date,
  count(*) as device_game_sessions,
  count(*) filter (where mode='online') as online_device_game_sessions,
  count(*) filter (where mode='offline') as offline_device_game_sessions,
  sum(local_player_count) as player_participations,
  sum(local_player_count) filter (where mode='online') as online_player_participations,
  sum(local_player_count) filter (where mode='offline') as offline_player_participations
from public.app_game_sessions group by started_date order by started_date desc;
revoke all on public.app_games_daily from public, anon, authenticated;
grant select on public.app_game_sessions, public.app_games_daily to service_role;
