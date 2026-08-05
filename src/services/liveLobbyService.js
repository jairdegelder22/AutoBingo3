import { supabase } from './supabaseClient';

const BOARD_SIZE = 16;
const CONNECTION_CHECK_TIMEOUT_MS = 3500;
const PLAYER_PRESENCE_STALE_MS = 15000;
let playerPresenceColumnAvailable = true;

function withTimeout(promise, timeoutMs = CONNECTION_CHECK_TIMEOUT_MS) {
  let timeoutId = null;

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export async function checkOnlineConnection(timeoutMs = CONNECTION_CHECK_TIMEOUT_MS) {
  try {
    const result = await withTimeout(
      supabase
        .from('lobbies')
        .select('id')
        .limit(1),
      timeoutMs
    );

    if (result?.timedOut) {
      return false;
    }

    return !result?.error;
  } catch (_error) {
    return false;
  }
}

function getDefaultPlayerName(index = 0) {
  return `Speler ${index + 1}`;
}

function isDefaultPlayerName(value = '') {
  return /^Speler\s+\d+$/i.test(String(value).trim());
}

function normalizeCustomPlayerName(value = '') {
  const normalizedName = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';

  return isDefaultPlayerName(normalizedName) ? '' : normalizedName;
}

function normalizePlayer(player, fallbackRole = 'guest') {
  const normalizedName = normalizeCustomPlayerName(player?.naam);

  return {
    naam: normalizedName,
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
      nederlands: typeof lobbyRow.dutch_items_enabled === 'boolean' ? lobbyRow.dutch_items_enabled : true,
    },
    started: lobbyRow.status === 'started',
    ended: lobbyRow.status === 'ended',
    startedAt: lobbyRow.started_at,
    hostPlayerId: lobbyRow.host_player_id,
    players: playerRows.map((row, index) => ({
      naam: normalizeCustomPlayerName(row.name),
      skin: row.skin,
      playerId: row.player_id,
      role: row.role,
      isReady: row.is_ready,
      lastSeenAt: row.last_seen_at ?? row.joined_at ?? null,
      isOffline: row.last_seen_at
        ? Date.now() - new Date(row.last_seen_at).getTime() > PLAYER_PRESENCE_STALE_MS
        : false,
    })),
    createdAt: lobbyRow.created_at,
    lobbyId: lobbyRow.id,
  };
}

function isMissingPlayerPresenceColumn(error) {
  const message = error?.message ?? '';
  return message.includes("'last_seen_at' column") || message.includes('last_seen_at');
}

async function fetchLobbyRowByCodeWithStatus(code) {
  const { data, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('lobby_code', code)
    .maybeSingle();

  if (error) {
    console.warn('fetchLobbyRowByCode error', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

async function fetchLobbyRowByCode(code) {
  const { data } = await fetchLobbyRowByCodeWithStatus(code);
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
    return null;
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
    payload.dutch_items_enabled = config?.nederlands !== false;
  }

  return payload;
}

function isMissingLobbySettingsColumn(error) {
  const message = error?.message ?? '';
  return (
    message.includes("'allow_diagonal' column") ||
    message.includes("'win_condition' column") ||
    message.includes("'card_layout' column") ||
    message.includes("'dutch_items_enabled' column")
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

export async function ensureLobby({ code, config, hostPlayer, resetExisting = true }) {
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

  if (resetExisting) {
    await resetLobbyState(lobbyRow.id, normalizedHost.playerId);
  }

  await upsertPlayers(code, [{ ...normalizedHost, role: 'host' }]);
  return getLobbySnapshot(code);
}

export async function upsertPlayers(code, players) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const existingPlayers = await fetchPlayersByLobbyId(lobbyRow.id) ?? [];
  const orderedPlayerIds = existingPlayers.map((player) => player.player_id).filter(Boolean);
  const normalizedPlayers = players.map((player) => normalizePlayer(player, player?.role || 'guest'));

  normalizedPlayers.forEach((player) => {
    if (!orderedPlayerIds.includes(player.playerId)) {
      orderedPlayerIds.push(player.playerId);
    }
  });

  const nowIso = new Date().toISOString();
  const payload = normalizedPlayers.map((normalized) => {
    const playerOrderIndex = normalized.role === 'host'
      ? 0
      : Math.max(0, orderedPlayerIds.indexOf(normalized.playerId));

    return {
      lobby_id: lobbyRow.id,
      player_id: normalized.playerId,
      name: normalized.naam,
      skin: normalized.skin,
      role: normalized.role,
      is_ready: true,
      ...(playerPresenceColumnAvailable ? { last_seen_at: nowIso } : {}),
    };
  });

  let { error } = await supabase
    .from('lobby_players')
    .upsert(payload, { onConflict: 'lobby_id,player_id' });

  if (error && playerPresenceColumnAvailable && isMissingPlayerPresenceColumn(error)) {
    playerPresenceColumnAvailable = false;
    ({ error } = await supabase
      .from('lobby_players')
      .upsert(payload.map(({ last_seen_at: _lastSeenAt, ...player }) => player), { onConflict: 'lobby_id,player_id' }));
  }

  if (error) {
    console.warn('upsertPlayers error', error.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function touchPlayerPresence(code, playerIds = []) {
  if (!playerPresenceColumnAvailable || !playerIds.length) {
    return false;
  }

  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return false;
  }

  const { error } = await supabase
    .from('lobby_players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('lobby_id', lobbyRow.id)
    .in('player_id', playerIds);

  if (error) {
    if (isMissingPlayerPresenceColumn(error)) {
      playerPresenceColumnAvailable = false;
      return false;
    }

    console.warn('touchPlayerPresence error', error.message);
    return false;
  }

  return true;
}

export async function removePlayers(code, playerIds = []) {
  if (!playerIds.length) {
    return getLobbySnapshot(code);
  }

  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const { error } = await supabase
    .from('lobby_players')
    .delete()
    .eq('lobby_id', lobbyRow.id)
    .in('player_id', playerIds);

  if (error) {
    console.warn('removePlayers error', error.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function deleteLobby(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const { error: endError } = await supabase
    .from('lobbies')
    .update({
      status: 'ended',
      started_at: null,
    })
    .eq('id', lobbyRow.id);

  if (endError) {
    console.warn('deleteLobby end update error', endError.message);
  }

  const { error: boardError } = await supabase
    .from('lobby_board_cells')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (boardError) {
    console.warn('deleteLobby board delete error', boardError.message);
  }

  const { error: playersError } = await supabase
    .from('lobby_players')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (playersError) {
    console.warn('deleteLobby players delete error', playersError.message);
  }

  const { error: lobbyError } = await supabase
    .from('lobbies')
    .delete()
    .eq('id', lobbyRow.id);

  if (lobbyError) {
    console.warn('deleteLobby lobby delete error', lobbyError.message);
    return null;
  }

  return true;
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

  const { error: boardError } = await supabase
    .from('lobby_board_cells')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (boardError) {
    console.warn('startLobby board delete error', boardError.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function updateLobbySettings(code, config = {}) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const updatePayload = {
    theme: config?.thema ?? lobbyRow.theme,
    game_mode: config?.modus ?? lobbyRow.game_mode,
    seed: config?.seed ?? lobbyRow.seed,
    salt: config?.salt ?? lobbyRow.salt,
    win_condition: config?.wincondition ?? lobbyRow.win_condition ?? '1rij',
    allow_diagonal: typeof config?.diagonaal === 'boolean'
      ? config.diagonaal
      : (typeof lobbyRow.allow_diagonal === 'boolean' ? lobbyRow.allow_diagonal : true),
    card_layout: config?.kaartOpzet ?? lobbyRow.card_layout ?? 'zelfde',
    dutch_items_enabled: typeof config?.nederlands === 'boolean'
      ? config.nederlands
      : (typeof lobbyRow.dutch_items_enabled === 'boolean' ? lobbyRow.dutch_items_enabled : true),
  };

  let { error } = await supabase
    .from('lobbies')
    .update(updatePayload)
    .eq('id', lobbyRow.id);

  if (error && isMissingLobbySettingsColumn(error)) {
    const fallbackPayload = { ...updatePayload };
    delete fallbackPayload.dutch_items_enabled;
    ({ error } = await supabase
      .from('lobbies')
      .update(fallbackPayload)
      .eq('id', lobbyRow.id));
  }

  if (error) {
    console.warn('updateLobbySettings error', error.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function restartLobbyGame(code, config = {}) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const startedAt = new Date().toISOString();
  const updatePayload = {
    seed: config?.seed ?? lobbyRow.seed,
    salt: config?.salt ?? lobbyRow.salt,
    status: 'started',
    started_at: startedAt,
  };

  const { error: lobbyError } = await supabase
    .from('lobbies')
    .update(updatePayload)
    .eq('id', lobbyRow.id);

  if (lobbyError) {
    console.warn('restartLobbyGame update error', lobbyError.message);
    return null;
  }

  const { error: boardError } = await supabase
    .from('lobby_board_cells')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (boardError) {
    console.warn('restartLobbyGame board delete error', boardError.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export async function stopLobbyGame(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return null;
  }

  const { error: lobbyError } = await supabase
    .from('lobbies')
    .update({
      status: 'waiting',
      started_at: null,
    })
    .eq('id', lobbyRow.id);

  if (lobbyError) {
    console.warn('stopLobbyGame update error', lobbyError.message);
    return null;
  }

  const { error: boardError } = await supabase
    .from('lobby_board_cells')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (boardError) {
    console.warn('stopLobbyGame board delete error', boardError.message);
    return null;
  }

  return getLobbySnapshot(code);
}

export function subscribeToLobby(code, listener) {
  let isActive = true;
  let channel = null;
  let pollInterval = null;
  let retryTimeout = null;

  async function publishSnapshot() {
    const snapshot = await getLobbySnapshot(code);
    if (!isActive) {
      return;
    }

    if (snapshot) {
      listener(snapshot);
      return;
    }

    const online = await checkOnlineConnection(1200);
    if (isActive && online) {
      listener(null);
    }
  }

  async function setup() {
    const lobbyResult = await fetchLobbyRowByCodeWithStatus(code);
    const lobbyRow = lobbyResult.data;
    if (!isActive) {
      return;
    }

    if (!lobbyRow) {
      if (!lobbyResult.error) {
        listener(null);
      }
      retryTimeout = setTimeout(() => {
        if (isActive) {
          void setup();
        }
      }, 750);
      return;
    }

    await publishSnapshot();
    pollInterval = setInterval(() => {
      void publishSnapshot();
    }, 1500);

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
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
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
  if (!playerRows) {
    return null;
  }

  return mapLobbyRowToSnapshot(lobbyRow, playerRows);
}

function emptyBoardState() {
  return {};
}

function rowsToBoardState(rows = [], boardSize = BOARD_SIZE) {
  return rows.reduce((accumulator, row) => {
    if (!accumulator[row.board_key]) {
      accumulator[row.board_key] = Array.from({ length: boardSize }, () => ({
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

export async function getBoardState(code, boardSize = BOARD_SIZE) {
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

  return rowsToBoardState(data ?? [], boardSize);
}

export async function clearBoardState(code) {
  const lobbyRow = await fetchLobbyRowByCode(code);
  if (!lobbyRow) {
    return emptyBoardState();
  }

  const { error } = await supabase
    .from('lobby_board_cells')
    .delete()
    .eq('lobby_id', lobbyRow.id);

  if (error) {
    console.warn('clearBoardState error', error.message);
    return null;
  }

  return emptyBoardState();
}

export async function setBoardCell({ code, boardKey, cellIndex, checked, playerId, boardSize = BOARD_SIZE }) {
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

  return getBoardState(code, boardSize);
}

export function subscribeToBoardState(code, listener, boardSize = BOARD_SIZE) {
  let isActive = true;
  let channel = null;

  async function publishBoardState() {
    const boardState = await getBoardState(code, boardSize);
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
