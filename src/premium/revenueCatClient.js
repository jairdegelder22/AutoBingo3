import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium';
export const REVENUECAT_OFFERING_DEFAULT = 'default';
const REVENUECAT_PREMIUM_ENTITLEMENT_ALIASES = [
  REVENUECAT_ENTITLEMENT_PREMIUM,
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
  const Purchases = getPurchasesModule();

  if (!Purchases || configured) {
    return Boolean(Purchases);
  }

  const apiKey = REVENUECAT_PUBLIC_API_KEYS[Platform.OS] ?? REVENUECAT_PUBLIC_API_KEYS.ios;

  if (!apiKey) {
    return false;
  }

  try {
    if (__DEV__ && Purchases.LOG_LEVEL?.DEBUG) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (_error) {
    return false;
  }
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

  return Purchases.purchasePackage(packageToPurchase);
}

export async function restorePurchases() {
  const ready = await configureRevenueCat();
  const Purchases = getPurchasesModule();

  if (!ready || !Purchases) {
    return null;
  }

  return Purchases.restorePurchases();
}

export function hasPremiumEntitlement(customerInfo) {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};
  const entitlement = REVENUECAT_PREMIUM_ENTITLEMENT_ALIASES
    .map((entitlementId) => activeEntitlements[entitlementId])
    .find(Boolean);
  const isActive = entitlement?.isActive;

  return isActive === undefined ? Boolean(entitlement) : Boolean(isActive);
}

export function getDefaultOffering(offerings) {
  return offerings?.all?.[REVENUECAT_OFFERING_DEFAULT] ?? offerings?.current ?? null;
}
