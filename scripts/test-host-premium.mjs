import assert from 'node:assert/strict';
import { makeHandler, revenueCatPremium } from '../supabase/functions/verify-host-premium/handler.mjs';
import { codeHashes } from '../supabase/functions/verify-host-premium/premium-code-hashes.mjs';

const now = Date.parse('2026-10-20T18:00:00Z');
const userId = '11111111-1111-4111-8111-111111111111';
const active = { subscriber: { entitlements: { premium: { expires_date: '2026-11-20T00:00:00Z', product_identifier: 'monthly' } } } };
const expired = { subscriber: { entitlements: { premium: { expires_date: '2026-10-19T00:00:00Z', product_identifier: 'monthly' } } } };
const empty = { subscriber: { entitlements: {} } };

async function run({ body = {}, payload = active, auth = true, token = true, configured = true, codeGrant = [], rcStatus = 200 } = {}) {
  const calls = [];
  const handler = makeHandler({
    now: () => now, codeHashes,
    env: (key) => ({ SUPABASE_URL: 'https://project.example', SUPABASE_ANON_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'server-only', REVENUECAT_API_KEY: configured ? 'read-key' : undefined })[key],
    fetch: async (url, options = {}) => {
      calls.push({ url, ...options, body: options.body ? JSON.parse(options.body) : null });
      if (url.endsWith('/auth/v1/user')) return Response.json(auth ? { id: userId, is_anonymous: true } : {}, { status: auth ? 200 : 401 });
      if (url.includes('/v1/subscribers/')) return Response.json(payload, { status: rcStatus });
      if (options.method === 'POST' || options.method === 'PATCH') return new Response(null, { status: 204 });
      return Response.json(codeGrant);
    },
  });
  const response = await handler(new Request('https://function.example', { method: 'POST', headers: token ? { authorization: 'Bearer device-token' } : {}, body: JSON.stringify(body) }));
  return { status: response.status, result: await response.json(), calls };
}

for (const options of [{ token: false }, { auth: false }]) {
  const result = await run(options);
  assert.equal(result.status, 401);
  assert.ok(!result.calls.some((call) => call.method === 'POST'));
}
const paid = await run();
assert.equal(paid.result.premium, true);
assert.ok(paid.calls.some((call) => call.url.endsWith(`/subscribers/account-${userId}`)));
assert.equal(paid.calls.find((call) => call.method === 'POST').body.user_id, userId);
const free = await run({ payload: empty, body: { userId: 'victim', premium: true } });
assert.equal(free.status, 403);
assert.equal(free.calls.find((call) => call.method === 'POST').body.active, false);
assert.equal(free.calls.find((call) => call.method === 'POST').body.user_id, userId);
assert.equal((await run({ payload: expired })).status, 403);
assert.equal((await run({ payload: {}, rcStatus: 200 })).status, 502);
assert.equal((await run({ rcStatus: 500 })).status, 502);
assert.equal((await run({ configured: false })).status, 503);

const code = await run({ configured: false, body: { unlockCode: ' autobingo-test-skins-2026 ' } });
assert.equal(code.result.premium, true);
assert.equal(code.calls.find((call) => call.method === 'POST').body.entitlement_id, 'premium_host_code');
assert.ok(!code.calls.some((call) => call.url.includes('revenuecat.com')));
assert.equal((await run({ body: { unlockCode: 'AUTOBINGO-SKINS-2026' } })).status, 403);
assert.equal((await run({ body: { unlockCode: true } })).status, 400);
assert.equal((await run({ configured: false, codeGrant: [{ expires_at: null }] })).result.premium, true);
const revoke = await run({ body: { revokeCode: true } });
assert.equal(revoke.calls.find((call) => call.method === 'PATCH').body.active, false);
assert.ok(revoke.calls.find((call) => call.method === 'PATCH').url.includes(`user_id=eq.${userId}`));

assert.equal(revenueCatPremium(expired, now), null);
assert.ok(revenueCatPremium({ subscriber: { entitlements: { 'AutoBingo Premium': { expires_date: null, product_identifier: 'lifetime' } } } }, now));
assert.equal(revenueCatPremium({ subscriber: { entitlements: { premium: { product_identifier: 'invalid-missing-expiry' } } } }, now), null);
assert.ok(revenueCatPremium({ subscriber: { entitlements: { premium: { expires_date: '2026-10-19T00:00:00Z', grace_period_expires_date: '2026-10-21T00:00:00Z', product_identifier: 'monthly' } } } }, now));
console.log('PASS: validated device identity, subscriptions/lifetime/grace/expiry, fail-closed responses, premium codes, code revocation and spoofed user/premium rejection.');
