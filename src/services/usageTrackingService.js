import { Platform } from 'react-native';
import { getOrCreateInstallationId } from './appInstallationService';
import { supabase } from './supabaseClient';

const APP_VERSION = require('../../app.json').expo.version;

function getPlatform() {
  return ['ios', 'android', 'web', 'macos', 'windows'].includes(Platform.OS)
    ? Platform.OS
    : 'unknown';
}

function buildRevenueCatDetails(customerInfo) {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};

  return {
    activeEntitlementIds: Object.keys(activeEntitlements),
    managementUrlAvailable: Boolean(customerInfo?.managementURL),
  };
}

async function callTrackingRpc(functionName, params) {
  const { error } = await supabase.rpc(functionName, params);

  if (error) {
    throw error;
  }
}

export async function trackAppInstallation() {
  const installationId = await getOrCreateInstallationId();

  await callTrackingRpc('track_app_installation', {
    p_installation_id: installationId,
    p_platform: getPlatform(),
    p_app_version: APP_VERSION,
  });

  return installationId;
}

export async function trackRevenueCatPremiumStatus(customerInfo, active) {
  const installationId = await getOrCreateInstallationId();

  await callTrackingRpc('track_premium_status', {
    p_installation_id: installationId,
    p_source: 'revenuecat',
    p_active: Boolean(active),
    p_entitlement_id: 'premium',
    p_code_id: null,
    p_revenuecat_app_user_id: customerInfo?.originalAppUserId ?? null,
    p_details: buildRevenueCatDetails(customerInfo),
    p_platform: getPlatform(),
    p_app_version: APP_VERSION,
  });
}

export async function trackUnlockCodeRedemption(codeId, effects = []) {
  const installationId = await getOrCreateInstallationId();

  await callTrackingRpc('track_unlock_code_redemption', {
    p_installation_id: installationId,
    p_code_id: codeId,
    p_effects: effects,
    p_platform: getPlatform(),
    p_app_version: APP_VERSION,
  });
}
