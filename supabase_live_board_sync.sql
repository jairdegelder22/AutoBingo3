create table public.lobby_board_cells (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  board_key text not null,
  cell_index integer not null check (cell_index >= 0 and cell_index < 16),
  checked boolean not null default false,
  updated_by_player_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lobby_id, board_key, cell_index)
);

create index lobby_board_cells_lobby_id_idx on public.lobby_board_cells(lobby_id);
create index lobby_board_cells_board_key_idx on public.lobby_board_cells(board_key);

create trigger set_lobby_board_cells_updated_at
before update on public.lobby_board_cells
for each row
execute function public.set_updated_at();

alter table public.lobby_board_cells enable row level security;

create policy "anon can select lobby_board_cells"
on public.lobby_board_cells
for select
to anon
using (true);

create policy "anon can insert lobby_board_cells"
on public.lobby_board_cells
for insert
to anon
with check (true);

create policy "anon can update lobby_board_cells"
on public.lobby_board_cells
for update
to anon
using (true)
with check (true);

create policy "anon can delete lobby_board_cells"
on public.lobby_board_cells
for delete
to anon
using (true);

alter publication supabase_realtime add table public.lobby_board_cells;
