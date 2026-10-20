import { makeHandler } from './handler.mjs';
import { codeHashes } from './premium-code-hashes.mjs';
import { revenueCatReadKey } from './revenuecat-read-key.mjs';

// The handler validates every bearer token using Supabase Auth, including ES256
// device sessions. The legacy gateway's HS256 check must not replace this check.
Deno.serve(makeHandler({
  env: (name: string) => name === 'REVENUECAT_API_KEY'
    ? (Deno.env.get(name) ?? revenueCatReadKey)
    : Deno.env.get(name),
  codeHashes,
}));
