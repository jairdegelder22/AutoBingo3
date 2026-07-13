alter table public.lobbies
add column if not exists win_condition text not null default '1rij'
check (win_condition in ('1rij', '2rijen', 'heel-blok'));

alter table public.lobbies
add column if not exists allow_diagonal boolean not null default true;

alter table public.lobbies
add column if not exists card_layout text not null default 'zelfde'
check (card_layout in ('zelfde', 'anders', 'ander-thema'));
