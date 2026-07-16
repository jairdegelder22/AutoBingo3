import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';
import { usePremium } from '../premium/PremiumContext';

const AD_MIN_INTERVAL_MS = 120000;
const IOS_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-5873918058071695/5969038745';
const IOS_TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/4411468910';
const ANDROID_TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';

const AdsContext = createContext({
  ready: false,
  available: false,
  maybeShowInterstitial: async () => false,
});

function getGoogleMobileAdsModule() {
  if (!TurboModuleRegistry.get('RNGoogleMobileAdsModule')) {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads');
  } catch (_error) {
    return null;
  }
}

function getInterstitialUnitId(adsModule) {
  const useRealAds = process.env.EXPO_PUBLIC_ADMOB_USE_REAL_ADS === 'true';

  if (__DEV__ || !useRealAds) {
    if (Platform.OS === 'ios') {
      return adsModule.TestIds?.INTERSTITIAL ?? IOS_TEST_INTERSTITIAL_AD_UNIT_ID;
    }

    if (Platform.OS === 'android') {
      return adsModule.TestIds?.INTERSTITIAL ?? ANDROID_TEST_INTERSTITIAL_AD_UNIT_ID;
    }

    return adsModule.TestIds?.INTERSTITIAL ?? null;
  }

  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? IOS_INTERSTITIAL_AD_UNIT_ID;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? null;
  }

  return null;
}

export function AdsProvider({ children, onInterstitialFinished }) {
  const { isPremium } = usePremium();
  const adsModuleRef = useRef(null);
  const interstitialRef = useRef(null);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const lastShownAtRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);

  const preloadInterstitial = useCallback(() => {
    const adsModule = adsModuleRef.current;
    const unitId = adsModule ? getInterstitialUnitId(adsModule) : null;

    if (!adsModule || !unitId || isPremium || loadingRef.current || loadedRef.current) {
      return;
    }

    const { AdEventType, InterstitialAd } = adsModule;
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    loadingRef.current = true;
    loadedRef.current = false;
    interstitialRef.current = interstitial;

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loadingRef.current = false;
      loadedRef.current = true;
    });
    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      loadingRef.current = false;
      loadedRef.current = false;
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    });
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
      preloadInterstitial();
    });

    interstitial.load();
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) {
      loadedRef.current = false;
      loadingRef.current = false;
      interstitialRef.current = null;
      return undefined;
    }

    const adsModule = getGoogleMobileAdsModule();
    const mobileAds = adsModule?.default ?? adsModule;

    if (!adsModule || typeof mobileAds !== 'function') {
      setReady(false);
      setAvailable(false);
      return undefined;
    }

    let cancelled = false;
    adsModuleRef.current = adsModule;

    async function initializeAds() {
      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: adsModule.MaxAdContentRating?.G,
          tagForChildDirectedTreatment: true,
          tagForUnderAgeOfConsent: true,
          testDeviceIdentifiers: ['EMULATOR'],
        });
        await mobileAds().initialize();

        if (cancelled) {
          return;
        }

        setReady(true);
        setAvailable(true);
        preloadInterstitial();
      } catch (_error) {
        if (!cancelled) {
          setReady(false);
          setAvailable(false);
        }
      }
    }

    void initializeAds();

    return () => {
      cancelled = true;
    };
  }, [isPremium, preloadInterstitial]);

  const maybeShowInterstitial = useCallback(async (_placement = 'default') => {
    if (isPremium || !available || !loadedRef.current || !interstitialRef.current) {
      preloadInterstitial();
      return false;
    }

    const now = Date.now();

    if (now - lastShownAtRef.current < AD_MIN_INTERVAL_MS) {
      preloadInterstitial();
      return false;
    }

    const interstitial = interstitialRef.current;
    const adsModule = adsModuleRef.current;
    const { AdEventType } = adsModule;

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (shown) => {
        if (resolved) {
          return;
        }

        resolved = true;
        unsubscribeClosed();
        unsubscribeError();
        setTimeout(() => {
          onInterstitialFinished?.();
        }, 250);
        resolve(shown);
      };
      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        lastShownAtRef.current = Date.now();
        finish(true);
      });
      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
        finish(false);
      });

      loadedRef.current = false;

      try {
        interstitial.show();
      } catch (_error) {
        finish(false);
        preloadInterstitial();
      }
    });
  }, [available, isPremium, onInterstitialFinished, preloadInterstitial]);

  const value = useMemo(() => ({
    ready,
    available,
    maybeShowInterstitial,
  }), [available, maybeShowInterstitial, ready]);

  return (
    <AdsContext.Provider value={value}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  return useContext(AdsContext);
}
