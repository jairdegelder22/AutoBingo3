const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');

function loadModule(file, mocks) {
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
  console.log('Activity tracking tests passed: offline recovery, deduplication, per-game players, date boundaries, retention, storage failure, installation identity.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
