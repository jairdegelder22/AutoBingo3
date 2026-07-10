import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  getDefaultOffering,
  getOfferings,
  getRevenueCatAvailable,
  hasPremiumEntitlement,
  purchasePackage,
  restorePurchases,
} from './revenueCatClient';

const PremiumContext = createContext({
  isPremium: false,
  loading: true,
  available: false,
  offering: null,
  monthlyPackage: null,
  lifetimePackage: null,
  error: null,
  refreshPremium: async () => {},
  purchasePremiumPackage: async () => null,
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

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(getRevenueCatAvailable());
  const [error, setError] = useState(null);

  const refreshPremium = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ready = await configureRevenueCat();
      setAvailable(ready);

      if (!ready) {
        setLoading(false);
        return null;
      }

      const [nextCustomerInfo, nextOfferings] = await Promise.all([
        getCustomerInfo(),
        getOfferings(),
      ]);

      setCustomerInfo(nextCustomerInfo);
      setOfferings(nextOfferings);
      setIsPremium(hasPremiumEntitlement(nextCustomerInfo));

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
      setIsPremium(hasPremiumEntitlement(nextCustomerInfo));
    });
  }, [available]);

  const purchasePremiumPackage = useCallback(async (packageToPurchase) => {
    setError(null);

    try {
      const result = await purchasePackage(packageToPurchase);
      const nextCustomerInfo = result?.customerInfo ?? null;

      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        setIsPremium(hasPremiumEntitlement(nextCustomerInfo));
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
        setIsPremium(hasPremiumEntitlement(nextCustomerInfo));
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

  const value = useMemo(() => ({
    isPremium,
    customerInfo,
    loading,
    available,
    offering,
    monthlyPackage,
    lifetimePackage,
    error,
    refreshPremium,
    purchasePremiumPackage,
    restorePremiumPurchases,
  }), [
    available,
    customerInfo,
    error,
    isPremium,
    lifetimePackage,
    loading,
    monthlyPackage,
    offering,
    purchasePremiumPackage,
    refreshPremium,
    restorePremiumPurchases,
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
