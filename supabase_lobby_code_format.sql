alter table public.lobbies
drop constraint if exists lobbies_lobby_code_check;

alter table public.lobbies
add constraint lobbies_lobby_code_check
check (lobby_code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7,8}$');
