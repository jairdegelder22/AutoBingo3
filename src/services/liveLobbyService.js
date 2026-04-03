import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lsygkbpaybprjmjrsquv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWdrYnBheWJwcmptanJzcXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjEwOTksImV4cCI6MjA5MDc5NzA5OX0.Vrj1fdPk1PYWzfoc6SaDHOf5nn4W4bFSggVOvjVpPD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const BOARD_SIZE = 16;

function normalizePlayer(player, fallbackRole = 'guest') {
  return {
    naam: player?.naam?.trim() || (fallbackRole === 'host' ? 'Host' : 'Speler'),
    skin: player?.skin || 'rood',
    playerId: player?.playerId || `${fallbackRole}-${Math.random().toString(36).slice(2, 8)}`,
    role: player?.role || fallbackRole,
  };
}

function mapLobbyRowToSnapshot(lobbyRow, playerRows = []) {
  if (!lobbyRow) {
    return null;
  }

  return {
    code: lobbyRow.lobby_code,
    config: {
      thema: lobbyRow.theme,
      modus: lobbyRow.game_mode,
      syncType: lobbyRow.sync_type === 'live' ? 'live' : 'geen',
      lobbyCode: lobbyRow.lobby_code,
      seed: lobbyRow.seed,
      salt: lobbyRow.salt,
      wincondition: lobbyRow.win_condition ?? '1rij',
      diagonaal: typeof lobbyRow.allow_diagonal === 'boolean' ? lobbyRow.allow_diagonal : true,
      kaartOpzet: lobbyRow.card_layout ?? 'zelfde',
    },
    started: lobbyRow.status === 'started',
    players: playerRows.map((row) => ({
      naam: row.name,
      skin: row.skin,
      playerId: row.player_id,
      role: row.role,
      isReady: row.is_ready,
    })),
    createdAt: lobbyRow.created_at,
    lobbyId: lobbyRow.id,
  };
}

async function fetchLobbyRowByCode(code) {
  const { data, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('lobby_code', code)
    .maybeSingle();

  if (error) {
    console.warn('fetchLobbyRowByCode error', error.message);
    return null;
  }

  return data;
}

async function fetchPlayersByLobbyId(lobbyId) {
  const { data, error } = await supabase
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.warn('fetchPlayersByLobbyId error', error.message);
    return [];
  }

  return data ?? [];
}

function buildLobbyPayload(config = {}, hostPlayerId, includeAdvancedSettings = true) {
  const payload = {
    lobby_code: config?.lobbyCode,
    theme: config?.thema ?? 'snelweg',
    game_mode: config?.modus ?? 'klassiek',
    sync_type: config?.syncType === 'live' ? 'live' : 'offline',
    seed: config?.seed ?? 0,
    salt: config?.salt ?? 0,
    host_player_id: hostPlayerId ?? null,
  };

  if (includeAdvancedSettings) {
    payload.win_condition = config?.wincondition ?? '1rij';
    payload.allow_diagonal = typeof config?.diagonaal === 'boolean' ? config.diagonaal : true;
    payload.card_layout = config?.kaartOpzet ?? 'zelfde';
  }

  return payload;
}

function isMissingLobbySettingsColumn(error) {
  const message = error?.message ?? '';
  return (
    message.includes("'allow_diagonal' column") ||
    message.includes("'win_condition' column") ||
    message.includes("'card_layout' column")
  );
}

async function resetLobbyState(lobbyId, hostPlayerId) {
  const deletePlayersQuery = supabase
    .from('lobby_players')
    .delete()
    .eq('lobby_id', lobbyId);

  const filteredPlayersQuery = hostPlayerId
    ? deletePlayersQuery.neq('player_id', hostPlayerId)
    : deletePlayersQuery;

  const [{ error: playerDeleteError }, { error: boardDeleteError }, { error: lobbyResetError }] = await Promise.all([
    filteredPlayersQuery,
    supabase.from('lobby_board_cells').delete().eq('lobby_id', lobbyId),
    supabase
      .from('lobbies')
      .update({
        status: 'waiting',
        started_at: null,
      })
      .eq('id', lobbyId),
  ]);

  if (playerDeleteError) {
    console.warn('resetLobbyState player delete error', playerDeleteError.message);
  }

  if (boardDeleteError) {
    console.warn('resetLobbyState board delete error', boardDeleteError.message);
  }

  if (lobbyResetError) {
    console.warn('resetLobbyState lobby reset error', lobbyResetError.message);
  }
}

export async function ensureLobby({ code, config, hostPlayer }) {
  if (!code) {
    return null;
  }

  const normalizedHost = normalizePlayer({ ...hostPlayer, role: 'host' }, 'host');

  let { error: lobbyError } = await supabase
    .from('lobbies')
    .upsert(buildLobbyPayload({ ...config, lobbyCode: code }, normalizedHost.playerId, true), { onConflict: 'lobby_code' });

  if (lobbyError && isMissingLobbySettingsColumn(lobbyError)) {
    ({ error: lobbyError } = await supabase
      .from('lobbies')
      .upsert(buildLobbyPayload({ ...config, lobbyCode: code }, normalizedHost.playerId, false), { onConflict: 'lobby_code' }));
  }

  if (lobbyError) {
    console.warn('ensureLobby upsert error', lobbyError.message);
    return null;
  }

  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  await resetLobbyState(lobbyRow.id, normalizedHost.playerId);
  await upsertPlayers(code, [{ ...normalizedHost, role: 'host' }]);
  return getLobbySnapshot(code);
}

export async function upsertPlayers(code, players) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const payload = players.map((player) => {
    const normalized = normalizePlayer(player, player?.role || 'guest');
    return {
      lobby_id: lobbyRow.id,
      player_id: normalized.playerId,
      name: normalized.naam,
      skin: normalized.skin,
      role: normalized.role,
      is_ready: true,
    };
  });

  const { error } = await supabase
    .from('lobby_players')
    .upsert(payload, { onConflict: 'lobby_id,player_id' });

  if (error) {
    console.warn('upsertPlayers error', error.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function joinLobby({ code, config, players }) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  let { error } = await supabase
    .from('lobbies')
    .update(buildLobbyPayload({
      ...config,
      thema: config?.thema ?? lobbyRow.theme,
      modus: config?.modus ?? lobbyRow.game_mode,
      syncType: config?.syncType === 'live' ? 'live' : 'offline',
      seed: config?.seed ?? lobbyRow.seed,
      salt: config?.salt ?? lobbyRow.salt,
      lobbyCode: code,
    }, lobbyRow.host_player_id, true))
    .eq('id', lobbyRow.id);

  if (error && isMissingLobbySettingsColumn(error)) {
    ({ error } = await supabase
      .from('lobbies')
      .update(buildLobbyPayload({
        ...config,
        thema: config?.thema ?? lobbyRow.theme,
        modus: config?.modus ?? lobbyRow.game_mode,
        syncType: config?.syncType === 'live' ? 'live' : 'offline',
        seed: config?.seed ?? lobbyRow.seed,
        salt: config?.salt ?? lobbyRow.salt,
        lobbyCode: code,
      }, lobbyRow.host_player_id, false))
      .eq('id', lobbyRow.id));
  }

  if (error) {
    console.warn('joinLobby update error', error.message);
  }

  return upsertPlayers(code, players);
}

export async function startLobby(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const { error } = await supabase
    .from('lobbies')
    .update({
      status: 'started',
      started_at: new Date().toISOString(),
    })
    .eq('id', lobbyRow.id);

  if (error) {
    console.warn('startLobby error', error.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export function subscribeToLobby(code, listener) {
  let isActive = true;
  let channel = null;

  async function publishSnapshot() {
    const snapshot = await getLobbySnapshot(code);
    if (isActive) {
      listener(snapshot);
    }
  }

  async function setup() {
    const lobbyRow = await fetchLobbyRowByCode(code);
    if (!isActive) {
      return;
    }

    if (!lobbyRow) {
      listener(null);
      return;
    }

    await publishSnapshot();

    channel = supabase
      .channel(`lobby:${code}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobbies', filter: `lobby_code=eq.${code}` },
        publishSnapshot
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyRow.id}` },
        publishSnapshot
      )
      .subscribe();
  }

  setup();

  return () => {
    isActive = false;
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

export async function getLobbySnapshot(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const playerRows = await fetchPlayersByLobbyId(lobbyRow.id);
  return mapLobbyRowToSnapshot(lobbyRow, playerRows);
}

function emptyBoardState() {
  return {};
}

function rowsToBoardState(rows = []) {
  return rows.reduce((accumulator, row) => {
    if (!accumulator[row.board_key]) {
      accumulator[row.board_key] = Array.from({ length: BOARD_SIZE }, () => ({
        checked: false,
        playerId: null,
      }));
    }

    accumulator[row.board_key][row.cell_index] = {
      checked: Boolean(row.checked),
      playerId: row.checked ? (row.updated_by_player_id ?? null) : null,
    };
    return accumulator;
  }, emptyBoardState());
}

export async function getBoardState(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return emptyBoardState();
  }

  const { data, error } = await supabase
    .from('lobby_board_cells')
    .select('*')
    .eq('lobby_id', lobbyRow.id);

  if (error) {
    console.warn('getBoardState error', error.message);
    return emptyBoardState();
  }

  return rowsToBoardState(data ?? []);
}

export async function setBoardCell({ code, boardKey, cellIndex, checked, playerId }) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const { error } = await supabase
    .from('lobby_board_cells')
    .upsert({
      lobby_id: lobbyRow.id,
      board_key: boardKey,
      cell_index: cellIndex,
      checked: Boolean(checked),
      updated_by_player_id: playerId ?? null,
    }, { onConflict: 'lobby_id,board_key,cell_index' });

  if (error) {
    console.warn('setBoardCell error', error.message);
    return null;
  }

  return getBoardState(code);
}

export function subscribeToBoardState(code, listener) {
  let isActive = true;
  let channel = null;

  async function publishBoardState() {
    const boardState = await getBoardState(code);
    if (isActive) {
      listener(boardState);
    }
  }

  async function setup() {
    const lobbyRow = await fetchLobbyRowByCode(code);
    if (!isActive) {
      return;
    }

    if (!lobbyRow) {
      listener(emptyBoardState());
      return;
    }

    await publishBoardState();

    channel = supabase
      .channel(`board:${code}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_board_cells', filter: `lobby_id=eq.${lobbyRow.id}` },
        publishBoardState
      )
      .subscribe();
  }

  setup();

  return () => {
    isActive = false;
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
