const aliases = new Set(['premium', 'autobingo premium', 'auto_bingo_premium', 'autobingo_premium']);

export function revenueCatPremium(payload, now) {
  const entries = Object.entries(payload?.subscriber?.entitlements ?? {});
  for (const [name, entitlement] of entries) {
    if (!aliases.has(name.toLowerCase()) || !entitlement?.product_identifier) continue;
    if (entitlement.expires_date === null) return { expiresAt: null, productId: entitlement.product_identifier };
    const expiry = Math.max(Date.parse(entitlement.expires_date) || 0, Date.parse(entitlement.grace_period_expires_date) || 0);
    if (expiry > now) return { expiresAt: new Date(expiry).toISOString(), productId: entitlement.product_identifier };
  }
  return null;
}

export function makeHandler({ env, fetch: request = fetch, now = Date.now, codeHashes = [] }) {
  const response = (status, body) => Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info' },
  });
  const call = (url, options) => request(url, { ...options, signal: AbortSignal.timeout(10000) });
  return async (req) => {
    if (req.method === 'OPTIONS') return response(200, {});
    if (req.method !== 'POST') return response(405, { error: 'method_not_allowed' });
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return response(401, { error: 'device_session_required' });
    try {
      // Validate the token with Supabase Auth; never trust decoded JWT claims or a body user ID.
      const auth = await call(`${env('SUPABASE_URL')}/auth/v1/user`, {
        headers: { authorization, apikey: env('SUPABASE_ANON_KEY') },
      });
      if (!auth.ok) return response(401, { error: 'invalid_device_session' });
      const user = await auth.json();
      if (!user?.id) return response(401, { error: 'invalid_device_session' });
      const text = await req.text();
      if (text.length > 1024) return response(413, { error: 'body_too_large' });
      let body;
      try { body = JSON.parse(text || '{}'); } catch { return response(400, { error: 'invalid_json' }); }
      if (!body || Array.isArray(body) || typeof body !== 'object') return response(400, { error: 'invalid_json' });

      const adminHeaders = {
        apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
        authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      };
      const writeGrant = async (grant) => {
        const result = await call(`${env('SUPABASE_URL')}/rest/v1/account_entitlements?on_conflict=user_id,entitlement_id`, {
          method: 'POST',
          headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ user_id: user.id, entitlement_id: 'premium', host_verified_at: new Date(now()).toISOString(), ...grant }),
        });
        if (!result.ok) throw new Error('grant_write_failed');
      };
      const codeGrantUrl = `${env('SUPABASE_URL')}/rest/v1/account_entitlements?user_id=eq.${encodeURIComponent(user.id)}&entitlement_id=eq.premium_host_code`;
      if (body.revokeCode === true) {
        const result = await call(codeGrantUrl, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ active: false }) });
        if (!result.ok) throw new Error('grant_write_failed');
        return response(200, { premium: false, userId: user.id });
      }
      if (body.unlockCode !== undefined) {
        if (typeof body.unlockCode !== 'string' || body.unlockCode.length > 120) return response(400, { error: 'invalid_code' });
        const code = body.unlockCode.trim().toUpperCase().replace(/\s+/g, '-');
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
        const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
        if (!codeHashes.includes(hash)) return response(403, { error: 'invalid_code' });
        await writeGrant({ entitlement_id: 'premium_host_code', source: 'unlock_code', active: true, expires_at: null });
        return response(200, { premium: true, userId: user.id, source: 'unlock_code' });
      }

      const existing = await call(`${codeGrantUrl}&active=eq.true&select=expires_at`, { headers: adminHeaders });
      if (!existing.ok) throw new Error('grant_read_failed');
      const grants = await existing.json();
      if (grants.some((g) => g.expires_at === null || Date.parse(g.expires_at) > now())) {
        return response(200, { premium: true, userId: user.id, source: 'unlock_code' });
      }
      const key = env('REVENUECAT_API_KEY');
      if (!key) return response(503, { error: 'revenuecat_not_configured' });
      const customerId = `account-${user.id}`;
      const result = await call(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(customerId)}`, {
        headers: { authorization: `Bearer ${key}`, Accept: 'application/json' },
      });
      if (!result.ok) return response(502, { error: 'purchase_verification_unavailable' });
      const payload = await result.json();
      if (!payload?.subscriber?.entitlements || typeof payload.subscriber.entitlements !== 'object') {
        return response(502, { error: 'invalid_purchase_response' });
      }
      const premium = revenueCatPremium(payload, now());
      await writeGrant({
        active: Boolean(premium), source: 'revenuecat', expires_at: premium?.expiresAt ?? null,
        product_id: premium?.productId ?? null, revenuecat_app_user_id: customerId,
      });
      return response(premium ? 200 : 403, { premium: Boolean(premium), userId: user.id });
    } catch {
      return response(503, { error: 'premium_verification_unavailable' });
    }
  };
}
