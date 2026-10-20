import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  getDefaultOffering,
  getOfferings,
  getRevenueCatAvailable,
  hasPremiumEntitlement,
  identifyRevenueCatUser,
  purchasePackage,
  restorePurchases,
  syncStorePurchases,
} from './revenueCatClient';
import {
  trackAppInstallation,
  trackRevenueCatPremiumStatus,
  trackUnlockCodeRedemption,
} from '../services/usageTrackingService';
import {
  PAID_SKIN_ENTITLEMENT_IDS,
  PAID_SKIN_OPTIONS,
  PAID_SKIN_PRODUCT_IDS,
} from '../skins/skinCatalog';
import { useAccount } from '../account/AccountContext';
import { HOST_CODE_REVOCATION_KEY, HOST_PREMIUM_CODE_KEY, revokeHostCodeGrant } from '../services/hostPremiumService';

const CODE_PREMIUM_STORAGE_KEY = 'autobingo:premium-code-unlock:v1';
const CODE_PAID_SKINS_STORAGE_KEY = 'autobingo:paid-skins-code-unlock:v1';
const STARTUP_STORE_SYNC_STORAGE_KEY = 'autobingo:premium-startup-store-sync:v1';

const PremiumContext = createContext({
  isPremium: false,
  codePremiumUnlocked: false,
  codePaidSkinsUnlocked: false,
  loading: true,
  available: false,
  offering: null,
  monthlyPackage: null,
  lifetimePackage: null,
  ownedPaidSkins: [],
  paidSkinPackagesBySkin: {},
  error: null,
  refreshPremium: async () => {},
  unlockPremiumWithCode: async () => {},
  disablePremiumCodeUnlock: async () => {},
  unlockAllPaidSkinsWithCode: async () => {},
  disablePaidSkinCodeUnlock: async () => {},
  purchasePremiumPackage: async () => null,
  purchasePaidSkin: async () => null,
  getPaidSkinPrice: () => null,
  restorePremiumPurchases: async () => null,
});

function getPackageByType(offering, packageType) {
  if (!offering) {
    return null;
  }

  const directPackage = packageType === 'MONTHLY'
    ? offering.monthly
    : offering.lifetime;

  return directPackage
    ?? offering.availablePackages?.find((availablePackage) => availablePackage.packageType === packageType)
    ?? null;
}

function collectAvailablePackages(offerings) {
  const packages = [];
  const seenPackageIds = new Set();

  Object.values(offerings?.all ?? {}).forEach((offering) => {
    offering?.availablePackages?.forEach((availablePackage) => {
      const productId = availablePackage?.product?.identifier;
      const packageId = availablePackage?.identifier ?? `${availablePackage?.packageType ?? 'package'}:${productId}`;

      if (!productId || seenPackageIds.has(packageId)) {
        return;
      }

      seenPackageIds.add(packageId);
      packages.push(availablePackage);
    });
  });

  return packages;
}

function getPaidSkinPackagesBySkin(offerings) {
  const availablePackages = collectAvailablePackages(offerings);

  return Object.fromEntries(
    PAID_SKIN_OPTIONS.map((skin) => {
      const productId = PAID_SKIN_PRODUCT_IDS[skin];
      const skinPackage = availablePackages.find((availablePackage) => (
        availablePackage?.product?.identifier === productId
      )) ?? null;

      return [skin, skinPackage];
    })
  );
}

function getOwnedPaidSkins(customerInfo) {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};

  return PAID_SKIN_OPTIONS.filter((skin) => {
    const entitlementId = PAID_SKIN_ENTITLEMENT_IDS[skin];
    const entitlement = activeEntitlements[entitlementId];
    const isActive = entitlement?.isActive;

    return isActive === undefined ? Boolean(entitlement) : Boolean(isActive);
  });
}

export function PremiumProvider({ children }) {
  const { session } = useAccount();
  const purchaseIdentityId = session?.user?.id;
  const [revenueCatPremium, setRevenueCatPremium] = useState(false);
  const [codePremiumUnlocked, setCodePremiumUnlocked] = useState(false);
  const [codePaidSkinsUnlocked, setCodePaidSkinsUnlocked] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(getRevenueCatAvailable());
  const [error, setError] = useState(null);

  useEffect(() => {
    void trackAppInstallation().catch(() => {});
  }, []);

  const refreshPremium = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ready, storedCodePremiumUnlocked, storedCodePaidSkinsUnlocked] = await Promise.all([
        configureRevenueCat(),
        AsyncStorage.getItem(CODE_PREMIUM_STORAGE_KEY).then((storedValue) => {
          const unlocked = storedValue === 'true';
          setCodePremiumUnlocked(unlocked);
          return unlocked;
        }),
        AsyncStorage.getItem(CODE_PAID_SKINS_STORAGE_KEY).then((storedValue) => {
          const unlocked = storedValue === 'true';
          setCodePaidSkinsUnlocked(unlocked);
          return unlocked;
        }),
      ]);
      setAvailable(ready);

      if (storedCodePremiumUnlocked) {
        void trackUnlockCodeRedemption('legacy-local-code-unlock', ['premium']).catch(() => {});
      }

      if (storedCodePaidSkinsUnlocked) {
        void trackUnlockCodeRedemption('legacy-local-code-unlock', ['allPaidSkins']).catch(() => {});
      }

      if (!ready) {
        setLoading(false);
        return null;
      }

      let [nextCustomerInfo, nextOfferings] = await Promise.all([
        getCustomerInfo(),
        getOfferings(),
      ]);

      let nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
      const startupStoreSyncDone = await AsyncStorage.getItem(STARTUP_STORE_SYNC_STORAGE_KEY);

      if (!nextRevenueCatPremium && !startupStoreSyncDone) {
        const syncedCustomerInfo = await syncStorePurchases().catch(() => null);
        await AsyncStorage.setItem(STARTUP_STORE_SYNC_STORAGE_KEY, 'true');

        if (syncedCustomerInfo) {
          nextCustomerInfo = syncedCustomerInfo;
          nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
        }
      }

      setCustomerInfo(nextCustomerInfo);
      setOfferings(nextOfferings);
      setRevenueCatPremium(nextRevenueCatPremium);
      void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});

      return nextCustomerInfo;
    } catch (nextError) {
      setError(nextError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapPremium() {
      const info = await refreshPremium();

      if (cancelled || !info) {
        return;
      }
    }

    void bootstrapPremium();

    return () => {
      cancelled = true;
    };
  }, [refreshPremium]);

  useEffect(() => {
    if (!available) {
      return undefined;
    }

    return addCustomerInfoUpdateListener((nextCustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
      const nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
      setRevenueCatPremium(nextRevenueCatPremium);
      void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});
    });
  }, [available]);

  useEffect(() => {
    if (!available || !purchaseIdentityId) {
      return;
    }

    let cancelled = false;

    async function identifyCurrentUser() {
      try {
        const nextCustomerInfo = await identifyRevenueCatUser(purchaseIdentityId);

        if (cancelled || !nextCustomerInfo) {
          return;
        }

        setCustomerInfo(nextCustomerInfo);
        const nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
        setRevenueCatPremium(nextRevenueCatPremium);
        void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError);
        }
      }
    }

    void identifyCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [available, purchaseIdentityId]);

  const unlockPremiumWithCode = useCallback(async (code) => {
    if (code) {
      await AsyncStorage.setItem(HOST_PREMIUM_CODE_KEY, code);
      await AsyncStorage.removeItem(HOST_CODE_REVOCATION_KEY);
    }
    await AsyncStorage.setItem(CODE_PREMIUM_STORAGE_KEY, 'true');
    setCodePremiumUnlocked(true);
  }, []);

  const disablePremiumCodeUnlock = useCallback(async () => {
    await revokeHostCodeGrant();
    await AsyncStorage.removeItem(HOST_PREMIUM_CODE_KEY);
    await AsyncStorage.removeItem(CODE_PREMIUM_STORAGE_KEY);
    setCodePremiumUnlocked(false);
  }, []);

  const unlockAllPaidSkinsWithCode = useCallback(async () => {
    await AsyncStorage.setItem(CODE_PAID_SKINS_STORAGE_KEY, 'true');
    setCodePaidSkinsUnlocked(true);
  }, []);

  const disablePaidSkinCodeUnlock = useCallback(async () => {
    await AsyncStorage.removeItem(CODE_PAID_SKINS_STORAGE_KEY);
    setCodePaidSkinsUnlocked(false);
  }, []);

  const purchasePremiumPackage = useCallback(async (packageToPurchase) => {
    setError(null);

    try {
      const result = await purchasePackage(packageToPurchase);
      const nextCustomerInfo = result?.customerInfo ?? null;

      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        const nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
        setRevenueCatPremium(nextRevenueCatPremium);
        void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});
      }

      return result;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    }
  }, []);

  const restorePremiumPurchases = useCallback(async () => {
    setError(null);

    try {
      const nextCustomerInfo = await restorePurchases();

      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        const nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
        setRevenueCatPremium(nextRevenueCatPremium);
        void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});
      }

      return nextCustomerInfo;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    }
  }, []);

  const offering = getDefaultOffering(offerings);
  const monthlyPackage = getPackageByType(offering, 'MONTHLY');
  const lifetimePackage = getPackageByType(offering, 'LIFETIME');
  const isPremium = revenueCatPremium || codePremiumUnlocked;
  const ownedPaidSkins = useMemo(() => {
    const revenueCatOwnedPaidSkins = getOwnedPaidSkins(customerInfo);

    if (!codePaidSkinsUnlocked) {
      return revenueCatOwnedPaidSkins;
    }

    return Array.from(new Set([...revenueCatOwnedPaidSkins, ...PAID_SKIN_OPTIONS]));
  }, [codePaidSkinsUnlocked, customerInfo]);
  const paidSkinPackagesBySkin = useMemo(() => getPaidSkinPackagesBySkin(offerings), [offerings]);

  const purchasePaidSkin = useCallback(async (skin) => {
    const packageToPurchase = paidSkinPackagesBySkin[skin];

    if (!packageToPurchase) {
      return null;
    }

    setError(null);

    try {
      const result = await purchasePackage(packageToPurchase);
      const nextCustomerInfo = result?.customerInfo ?? null;

      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        const nextRevenueCatPremium = hasPremiumEntitlement(nextCustomerInfo);
        setRevenueCatPremium(nextRevenueCatPremium);
        void trackRevenueCatPremiumStatus(nextCustomerInfo, nextRevenueCatPremium).catch(() => {});
      }

      return result;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    }
  }, [paidSkinPackagesBySkin]);

  const getPaidSkinPrice = useCallback((skin) => {
    const productPrice = paidSkinPackagesBySkin[skin]?.product?.priceString;
    return productPrice ?? '€0,99';
  }, [paidSkinPackagesBySkin]);

  const value = useMemo(() => ({
    isPremium,
    codePremiumUnlocked,
    codePaidSkinsUnlocked,
    customerInfo,
    loading,
    available,
    offering,
    monthlyPackage,
    lifetimePackage,
    ownedPaidSkins,
    paidSkinPackagesBySkin,
    error,
    refreshPremium,
    unlockPremiumWithCode,
    disablePremiumCodeUnlock,
    unlockAllPaidSkinsWithCode,
    disablePaidSkinCodeUnlock,
    purchasePremiumPackage,
    purchasePaidSkin,
    getPaidSkinPrice,
    restorePremiumPurchases,
  }), [
    available,
    codePaidSkinsUnlocked,
    codePremiumUnlocked,
    customerInfo,
    error,
    isPremium,
    lifetimePackage,
    loading,
    monthlyPackage,
    ownedPaidSkins,
    offering,
    paidSkinPackagesBySkin,
    getPaidSkinPrice,
    purchasePaidSkin,
    purchasePremiumPackage,
    refreshPremium,
    restorePremiumPurchases,
    unlockPremiumWithCode,
    unlockAllPaidSkinsWithCode,
    disablePaidSkinCodeUnlock,
    disablePremiumCodeUnlock,
  ]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
