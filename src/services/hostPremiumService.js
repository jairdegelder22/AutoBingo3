import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { getCustomerInfo, hasPremiumEntitlement, identifyRevenueCatUser, syncStorePurchases } from '../premium/revenueCatClient';

export const HOST_PREMIUM_CODE_KEY = 'autobingo:host-premium-code:v1';
export const HOST_CODE_REVOCATION_KEY = 'autobingo:host-code-revocation:v1';
let verificationPromise = null;

async function verifyHost() {
  let { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) {
    const result = await supabase.auth.signInAnonymously();
    if (result.error || !result.data?.session) {
      throw new Error('De apparaatverbinding voor online spelen is niet beschikbaar. Probeer het later opnieuw.');
    }
    session = result.data.session;
  }

  if (await AsyncStorage.getItem(HOST_CODE_REVOCATION_KEY) === 'true') {
    await sendCodeRevocation();
    await AsyncStorage.removeItem(HOST_CODE_REVOCATION_KEY);
  }
  const unlockCode = await AsyncStorage.getItem(HOST_PREMIUM_CODE_KEY);
  if (!unlockCode) {
    await identifyRevenueCatUser(session.user.id);
    const info = await getCustomerInfo();
    if (!hasPremiumEntitlement(info)) await syncStorePurchases();
  }

  const { data, error: verifyError } = await supabase.functions.invoke('verify-host-premium', {
    body: { unlockCode: unlockCode || undefined },
  });
  if (verifyError || !data?.premium || data.userId !== session.user.id) {
    throw new Error('Premium kon niet worden bevestigd. Herstel je aankoop of voer je premiumcode opnieuw in via Instellingen.');
  }
  return session.user.id;
}

export function verifyHostPremium() {
  if (!verificationPromise) {
    verificationPromise = verifyHost().finally(() => { verificationPromise = null; });
  }
  return verificationPromise;
}

export async function revokeHostCodeGrant() {
  // Local test-code resets must also work offline. Revoke on the next host
  // verification before an older server grant can be reused.
  await AsyncStorage.setItem(HOST_CODE_REVOCATION_KEY, 'true');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  try {
    await sendCodeRevocation();
    await AsyncStorage.removeItem(HOST_CODE_REVOCATION_KEY);
  } catch {
    // Keep the pending revocation until an online request succeeds.
  }
}

async function sendCodeRevocation() {
  const { error } = await supabase.functions.invoke('verify-host-premium', { body: { revokeCode: true } });
  if (error) throw error;
}
