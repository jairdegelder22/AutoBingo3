import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getOrCreateInstallationId } from '../services/appInstallationService';

export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium';
export const REVENUECAT_OFFERING_DEFAULT = 'default';
const REVENUECAT_PREMIUM_ENTITLEMENT_ALIASES = [
  REVENUECAT_ENTITLEMENT_PREMIUM,
  'AutoBingo Premium',
  'Autobingo Premium',
  'auto_bingo_premium',
  'autobingo_premium',
];

const REVENUECAT_PUBLIC_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? 'appl_dCHcvbUfDJlLdPflYCQkYTGFUhe',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? null,
};

let purchasesModule = null;
let configured = false;
let configurePromise = null;
let configuredAppUserId = null;
let currentIdentifyPromise = null;

function getRevenueCatUserIdForAccount(userId) {
  return userId ? `account-${userId}` : null;
}

function isRunningInExpoGo() {
  return (
    Constants?.executionEnvironment === 'storeClient'
    || Constants?.appOwnership === 'expo'
  );
}

function getPurchasesModule() {
  if (isRunningInExpoGo()) {
    purchasesModule = undefined;
    return purchasesModule;
  }

  if (purchasesModule !== null) {
    return purchasesModule;
  }

  try {
    // RevenueCat is a native module. Keeping this lazy prevents Expo Go/native-module
    // availability issues from crashing the settings and menu screens.
    purchasesModule = require('react-native-purchases').default;
  } catch (_error) {
    purchasesModule = undefined;
  }

  return purchasesModule;
}

export function getRevenueCatAvailable() {
  return Boolean(getPurchasesModule());
}

export async function configureRevenueCat() {
  if (configurePromise) {
    return configurePromise;
  }

  configurePromise = configureRevenueCatOnce();
  const ready = await configurePromise;

  if (!ready) {
    configurePromise = null;
  }

  return ready;
}

async function configureRevenueCatOnce() {
  const Purchases = getPurchasesModule();

  if (!Purchases || configured) {
    return Boolean(Purchases);
  }

  const apiKey = REVENUECAT_PUBLIC_API_KEYS[Platform.OS] ?? REVENUECAT_PUBLIC_API_KEYS.ios;

  if (!apiKey) {
    return false;
  }

  try {
    const appUserID = await getOrCreateInstallationId();

    if (__DEV__ && Purchases.LOG_LEVEL?.DEBUG) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey, appUserID });
    configuredAppUserId = appUserID;
    configured = true;
    return true;
  } catch (_error) {
    return false;
  }
}

export async function identifyRevenueCatUser(userId) {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();
  const appUserID = getRevenueCatUserIdForAccount(userId);

  if (!ready || !Purchases || !appUserID || configuredAppUserId === appUserID) {
    return null;
  }

  if (currentIdentifyPromise) {
    await currentIdentifyPromise.catch(() => null);
  }

  currentIdentifyPromise = Purchases.logIn(appUserID)
    .then((result) => {
      configuredAppUserId = appUserID;
      return result?.customerInfo ?? null;
    })
    .finally(() => {
      currentIdentifyPromise = null;
    });

  return currentIdentifyPromise;
}

export function addCustomerInfoUpdateListener(listener) {
  const Purchases = getPurchasesModule();

  if (!Purchases?.addCustomerInfoUpdateListener) {
    return () => {};
  }

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener?.(listener);
  };
}

export async function getCustomerInfo() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  return Purchases.getCustomerInfo();
}

export async function getOfferings() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  return Purchases.getOfferings();
}

export async function purchasePackage(packageToPurchase) {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases || !packageToPurchase) {
    return null;
  }

  const result = await Purchases.purchasePackage(packageToPurchase);

  if (hasPremiumEntitlement(result?.customerInfo)) {
    return result;
  }

  const customerInfo = await getFreshCustomerInfo();
  return {
    ...result,
    customerInfo: customerInfo ?? result?.customerInfo ?? null,
  };
}

export async function restorePurchases() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  await Purchases.invalidateCustomerInfoCache?.().catch(() => {});

  const restoredCustomerInfo = await Purchases.restorePurchases();

  if (hasPremiumEntitlement(restoredCustomerInfo)) {
    return restoredCustomerInfo;
  }

  const syncedCustomerInfo = await syncStorePurchases();

  if (hasPremiumEntitlement(syncedCustomerInfo)) {
    return syncedCustomerInfo;
  }

  const freshCustomerInfo = await getFreshCustomerInfo();
  return freshCustomerInfo ?? restoredCustomerInfo ?? syncedCustomerInfo ?? null;
}

async function getFreshCustomerInfo() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  await Purchases.invalidateCustomerInfoCache?.().catch(() => {});
  return Purchases.getCustomerInfo();
}

export async function syncStorePurchases() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  if (Purchases.syncPurchasesForResult) {
    const result = await Purchases.syncPurchasesForResult();
    return result?.customerInfo ?? null;
  }

  await Purchases.syncPurchases?.();
  return getFreshCustomerInfo();
}

export function hasPremiumEntitlement(customerInfo) {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};
  const premiumEntitlementIds = new Set(
    REVENUECAT_PREMIUM_ENTITLEMENT_ALIASES.map((entitlementId) => entitlementId.toLowerCase())
  );
  const entitlement = Object.entries(activeEntitlements)
    .find(([entitlementId]) => premiumEntitlementIds.has(entitlementId.toLowerCase()))?.[1];
  const isActive = entitlement?.isActive;

  return isActive === undefined ? Boolean(entitlement) : Boolean(isActive);
}

export function getDefaultOffering(offerings) {
  return offerings?.all?.[REVENUECAT_OFFERING_DEFAULT] ?? offerings?.current ?? null;
}
