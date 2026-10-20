// Run: node --experimental-vm-modules scripts/test-host-lobby-service.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

async function load(path, dependencies) {
  const module = new vm.SourceTextModule(fs.readFileSync(path, 'utf8'), { identifier: path });
  await module.link(async (name) => {
    const value = dependencies[name];
    assert.ok(value, `Unexpected dependency ${name}`);
    const names = Object.keys(value);
    return new vm.SyntheticModule(names, function () {
      for (const key of names) this.setExport(key, value[key]);
    });
  });
  await module.evaluate();
  return module.namespace;
}

async function hostService({ signedIn = false, code = null, allowed = true, mismatch = false, revokeOffline = false } = {}) {
  let session = signedIn ? { user: { id: 'existing-account' } } : null;
  const calls = [];
  const storage = new Map(code ? [['autobingo:host-premium-code:v1', code]] : []);
  const service = await load('src/services/hostPremiumService.js', {
    '@react-native-async-storage/async-storage': { default: {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
      removeItem: async (key) => { storage.delete(key); },
    } },
    './supabaseClient': { supabase: {
      auth: {
        getSession: async () => ({ data: { session } }),
        signInAnonymously: async () => {
          calls.push('device-session');
          session = { user: { id: 'automatic-device', is_anonymous: true } };
          return { data: { session } };
        },
      },
      functions: { invoke: async (_name, { body }) => {
        calls.push({ body });
        if (body.revokeCode && revokeOffline) return { error: Error('Offline') };
        return { data: { premium: allowed, userId: mismatch ? 'other-user' : session.user.id } };
      } },
    } },
    '../premium/revenueCatClient': {
      identifyRevenueCatUser: async (id) => { calls.push(`identify:${id}`); },
      getCustomerInfo: async () => ({ premium: true }),
      hasPremiumEntitlement: (info) => Boolean(info?.premium),
      syncStorePurchases: async () => { calls.push('restore'); },
    },
  });
  return { service, calls, storage };
}
const device = await hostService();
assert.deepEqual(await Promise.all([device.service.verifyHostPremium(), device.service.verifyHostPremium()]), ['automatic-device', 'automatic-device']);
assert.equal(device.calls.filter((call) => call === 'device-session').length, 1);
assert.equal(device.calls.filter((call) => typeof call === 'object').length, 1);
const account = await hostService({ signedIn: true });
assert.equal(await account.service.verifyHostPremium(), 'existing-account');
assert.ok(!account.calls.includes('device-session'));
const code = await hostService({ code: 'AUTOBINGO-TEST-SKINS-2026' });
await code.service.verifyHostPremium();
assert.equal(code.calls.find((call) => typeof call === 'object').body.unlockCode, 'AUTOBINGO-TEST-SKINS-2026');
assert.ok(!code.calls.some((call) => String(call).startsWith('identify:')));
await assert.rejects((await hostService({ allowed: false })).service.verifyHostPremium());
await assert.rejects((await hostService({ mismatch: true })).service.verifyHostPremium());
const offlineReset = await hostService({ signedIn: true, revokeOffline: true });
await offlineReset.service.revokeHostCodeGrant();
assert.equal(offlineReset.storage.get(offlineReset.service.HOST_CODE_REVOCATION_KEY), 'true');
await assert.rejects(offlineReset.service.verifyHostPremium());
assert.ok(!offlineReset.calls.some((call) => typeof call === 'object' && !call.body.revokeCode));

const operations = [];
const lobby = { id: 'lobby-id', lobby_code: 'ABCDEFGH', theme: 'snelweg', game_mode: 'klassiek', sync_type: 'live', status: 'waiting' };
let checks = 0;
let rejectHost = false;
const service = await load('src/services/liveLobbyService.js', {
  './hostPremiumService': { verifyHostPremium: async () => {
    checks += 1;
    if (rejectHost) throw Error('Premium required');
    return 'verified-owner';
  } },
  './supabaseClient': { supabase: { from: (table) => {
    const result = { data: table === 'lobbies' ? [lobby] : [], error: null };
    const builder = {};
    for (const method of ['select', 'eq', 'neq', 'in', 'order', 'upsert', 'update', 'delete']) {
      builder[method] = (...args) => { operations.push({ table, method, args }); return builder; };
    }
    builder.maybeSingle = async () => ({ data: lobby, error: null });
    builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return builder;
  } } },
});
await service.joinLobby({ code: 'ABCDEFGH', players: [{ playerId: 'guest', naam: 'Guest', skin: 'rood', role: 'guest' }] });
assert.equal(checks, 0);
assert.ok(!operations.some((op) => op.table === 'lobbies' && ['update', 'upsert'].includes(op.method)));
assert.ok(operations.some((op) => op.table === 'lobby_players' && op.method === 'upsert'));
await service.ensureLobby({ code: 'ABCDEFGH', config: {}, hostPlayer: { playerId: 'host' }, resetExisting: false });
assert.ok(operations.some((op) => op.table === 'lobbies' && op.method === 'upsert' && op.args[0].host_user_id === 'verified-owner'));
rejectHost = true;
const writes = operations.filter((op) => op.method === 'upsert').length;
await assert.rejects(service.ensureLobby({ code: 'ABCDEFGH', config: {}, hostPlayer: { playerId: 'host' } }));
assert.equal(operations.filter((op) => op.method === 'upsert').length, writes);
console.log('PASS: automatic device session, existing account, concurrent verification, code verification, denied/spoofed premium, free guest join, and verified host ownership.');
