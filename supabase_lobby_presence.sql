alter table public.lobby_players
add column if not exists last_seen_at timestamptz not null default now();

create index if not exists lobby_players_last_seen_at_idx
on public.lobby_players(last_seen_at);
