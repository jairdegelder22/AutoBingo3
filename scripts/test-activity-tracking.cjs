const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');

function loadModule(file, mocks, globals = {}) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, Intl, Date, AbortController, setTimeout, clearTimeout,
    require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
      return mocks[name];
    },
    ...globals,
  });
  return module.exports;
}

async function main() {
  const { activityDate, createActivityTracker } = loadModule('src/services/activityTrackingService.js', {
    '@react-native-async-storage/async-storage': {},
    'react-native': { Platform: { OS: 'ios' } },
    './appInstallationService': {}, './supabaseClient': {},
    '../../app.json': { expo: { version: 'test' } },
  });
  assert.equal(activityDate(new Date('2026-10-20T22:30:00Z')), '2026-10-21');
  assert.equal(activityDate(new Date('2026-12-20T22:30:00Z')), '2026-12-20');

  let value = null;
  let date = new Date('2026-10-20T10:00:00Z');
  let offline = true;
  const uploads = [];
  const storage = { getItem: async () => value, setItem: async (_, next) => { value = next; } };
  const send = async (days) => {
    if (offline) throw new Error('No connection');
    uploads.push(JSON.parse(JSON.stringify(days)));
  };
  const options = { storage, send, now: () => date };
  let tracker = createActivityTracker(options);
  const game = {
    mode: 'offline', playerCount: 3,
    session: { id: 'game-test-session-001', startedDate: '2026-10-20' },
  };
  await assert.rejects(tracker.record(game), /No connection/);
  assert.equal(JSON.parse(value).days['2026-10-20'].offline_players, 3);

  // Restart while offline, then reconnect: original day and session are retained.
  tracker = createActivityTracker(options);
  date = new Date('2026-10-21T10:00:00Z');
  offline = false;
  await tracker.record();
  assert.equal(uploads[0].length, 2);
  assert.equal(uploads[0][0].games[0].player_count, 3);
  await Promise.all([tracker.record(), tracker.record()]);
  assert.equal(uploads.length, 1, 'Repeated app opens must not upload again');

  const session = { id: 'game-test-session-002', startedDate: '2026-10-21' };
  await Promise.all([
    tracker.record({ mode: 'online', playerCount: 2, session }),
    tracker.record({ mode: 'online', playerCount: 2, session }),
  ]);
  assert.equal(uploads.length, 2, 'Concurrent updates should deduplicate');
  assert.equal(uploads[1][0].games.length, 1);
  await tracker.record({ mode: 'offline', playerCount: 4,
    session: { id: 'game-test-session-003', startedDate: '2026-10-21' } });
  const today = uploads.at(-1)[0];
  assert.equal(today.online_players, 2);
  assert.equal(today.offline_players, 4);
  assert.equal(today.games.length, 2, 'Separate games must remain separate');
  const uploadCount = uploads.length;
  tracker = createActivityTracker(options);
  await tracker.record();
  assert.equal(uploads.length, uploadCount, 'Successful acknowledgement survives restart');

  date = new Date('2027-02-01T10:00:00Z');
  await tracker.record();
  assert.deepEqual(Object.keys(JSON.parse(value).days), ['2027-02-01']);

  // Late evening after the autumn clock change still retains the 90th calendar day.
  date = new Date('2026-10-26T22:30:00Z');
  const oldestDay = new Date(Date.parse('2026-10-26T00:00:00Z') - 89 * 86400000).toISOString().slice(0, 10);
  value = JSON.stringify({ days: {
    [oldestDay]: { online_players: 0, offline_players: 2, games: [] },
  }, acknowledged: {} });
  await tracker.record();
  assert.ok(JSON.parse(value).days[oldestDay], 'DST must not prematurely expire queued activity');

  // Storage failures must not replace a previously persisted offline queue.
  const broken = createActivityTracker({ ...options,
    storage: { ...storage, getItem: async () => { throw new Error('Storage unavailable'); } } });
  const before = value;
  await assert.rejects(broken.record(), /Storage unavailable/);
  assert.equal(value, before);

  let installationValue = null;
  let writes = 0;
  const { getOrCreateInstallationId } = loadModule('src/services/appInstallationService.js', {
    '@react-native-async-storage/async-storage': {
      getItem: async () => installationValue,
      setItem: async (_, next) => { writes++; installationValue = next; },
    },
  });
  const ids = await Promise.all(Array.from({ length: 8 }, getOrCreateInstallationId));
  assert.equal(new Set(ids).size, 1);
  assert.equal(writes, 1, 'Simultaneous tracking must use a single installation ID');

  // Exercise the production hook: foreground, background, rerenders and replays.
  const calls = [];
  const refs = [];
  const effects = [];
  const pendingEffects = [];
  const timers = new Map();
  let hookIndex = 0;
  let listener = null;
  const appState = {
    currentState: 'active',
    addEventListener: (_, callback) => {
      listener = callback;
      return { remove: () => { listener = null; } };
    },
  };
  const react = {
    useRef: (initial) => { const index = hookIndex++; return refs[index] ??= { current: initial }; },
    useEffect: (effect, deps) => {
      const index = hookIndex++;
      const previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          effects[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const hookMocks = {
    react,
    'react-native': { AppState: appState },
    '../services/activityTrackingService': {
      activityDate,
      activityTracker: { record: (event) => { calls.push(event); return Promise.resolve(); } },
    },
  };
  const globals = {
    __DEV__: false,
    setInterval: (callback) => { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearInterval: (id) => timers.delete(id),
  };
  const useTracking = loadModule('src/hooks/useActivityTracking.js', hookMocks, globals).default;
  const render = (...args) => {
    hookIndex = 0;
    useTracking(...args);
    while (pendingEffects.length) pendingEffects.shift()();
  };
  render(false);
  assert.equal(calls.length, 0, 'Do not track before the app is enabled');
  render(true, 'offline', 3, 'first-game');
  assert.equal(calls.length, 1);
  const firstSession = calls[0].session.id;
  render(true, 'offline', 3, 'first-game');
  assert.equal(calls.length, 1, 'Rerenders must not start new games');
  appState.currentState = 'background';
  for (const tick of timers.values()) tick();
  assert.equal(calls.length, 1, 'Do not track background activity');
  appState.currentState = 'active';
  listener('active');
  assert.equal(calls.at(-1).session.id, firstSession, 'Foregrounding must retain the game');
  render(true, 'offline', 3, 'replay');
  assert.notEqual(calls.at(-1).session.id, firstSession, 'A replay must have its own session');
  render(true, null, 1, null);
  assert.equal(calls.at(-1).session, null);
  render(false);
  assert.equal(timers.size, 0, 'Unmounted/disabled tracking must remove timers');
  assert.equal(listener, null);

  const devEffects = [];
  loadModule('src/hooks/useActivityTracking.js', {
    ...hookMocks,
    react: { useRef: () => ({ current: null }), useEffect: (effect) => devEffects.push(effect) },
  }, { ...globals, __DEV__: true }).default(true, 'online', 2, 'dev-game');
  const beforeDev = calls.length;
  devEffects.forEach((effect) => effect());
  assert.equal(calls.length, beforeDev, 'Development builds must not upload analytics');
  console.log('Activity tracking tests passed: offline recovery, deduplication, per-game players, date boundaries, retention, storage failure, installation identity.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
