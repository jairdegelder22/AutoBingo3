import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { Animated, AppState, Easing, Image, ImageBackground, InteractionManager, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import CircularReveal from './components/CircularReveal';
import GlossyButton from './src/components/GlossyButton';
import WarmupImages from './src/components/WarmupImages';
import HomeScreen from './screens/HomeScreen';
import HostSetupScreen from './screens/HostSetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen';
import SettingsScreen from './screens/SettingsScreen';
import BingoCardScreen from './screens/BingoCardScreen';
import SingleDeviceSetupTestScreen from './src/screens/SingleDeviceSetupTestScreen';
import { createRandomSalt, createRandomSeed, getPlayerThemes, withDefaultPlayerNames } from './screens/gameFlowConfig';
import { PLAYER_IMAGES } from './assets/images/players/playerImages';
import { clearBoardState, getLobbySnapshot, removePlayers, restartLobbyGame, stopLobbyGame, subscribeToLobby } from './src/services/liveLobbyService';
import { AppSettingsProvider, useAppSettings } from './src/settings/AppSettingsContext';
import { PremiumProvider } from './src/premium/PremiumContext';
import { AdsProvider, useAds } from './src/ads/AdProvider';
import { getResponsiveMetrics } from './src/utils/responsive';
import useOnlineConnectionStatus from './src/hooks/useOnlineConnectionStatus';
import LegalConsentGate, { hasAcceptedCurrentLegalTerms } from './src/legal/LegalConsentGate';
import { playSoundEffect, preloadSoundEffect } from './src/audio/soundEffects';
import {
  fadeOutHomeBackgroundMusic,
  pauseBackgroundMusic,
  playGameBackgroundMusic,
  playHomeBackgroundMusic,
  resetGameBackgroundMusicForNewRound,
  restoreBackgroundMusicAfterInterruption,
} from './src/audio/backgroundMusic';
import {
  BOOT_ASSETS,
  BOOT_WARMUP_ROUTE_NAMES,
  getRouteAssets,
} from './src/assets/preloadManifest';
import { preloadImageAssets } from './src/assets/preloadImages';

const SCREEN_COMPONENTS = {
  Home: HomeScreen,
  HostSetup: HostSetupScreen,
  Lobby: LobbyScreen,
  Wachten: WaitingScreen,
  Instellingen: SettingsScreen,
  SingleDeviceSetupTest: SingleDeviceSetupTestScreen,
  Spel: GameScreen,
};

const SETTINGS_GEAR_IMAGE = require('./assets/images/navigation/settings-gear.png');
const DRIVER_WARNING_MENU_IMAGE = require('./assets/images/ui/driver-warning-menu.png');
const DRIVER_WARNING_ICON_IMAGE = require('./assets/images/ui/driver-warning-icon.png');
const DRIVER_WARNING_BOOT_ICON_WIDTH_RATIO = 0.532;
const DRIVER_WARNING_BOOT_ICON_MAX_SIZE = 224;
const DRIVER_WARNING_BOOT_POPUP_DELAY_MS = 1000;
const DRIVER_WARNING_BOOT_BUTTON_DELAY_MS = 2500;
const DRIVER_WARNING_BOOT_BUTTON_FADE_MS = 520;
const GAME_ROUTE_SETTLE_MS = 180;
const ROUTE_RENDER_SETTLE_MS = 220;
const ROUTE_MIN_SOLID_MS = 460;
const BOOT_MIN_SOLID_MS = Platform.OS === 'android' ? 900 : 120;
const BOOT_RENDER_SETTLE_MS = Platform.OS === 'android' ? ROUTE_RENDER_SETTLE_MS : 40;
const ROUTE_READY_TIMEOUT_MS = 12000;
const BOOT_ROUTE_READY_TIMEOUT_MS = 12000;
const SETTINGS_GEAR_SOUND = 'settingsGearClick';
const routePreloadPromises = new Map();

async function hideAndroidSystemNavigation() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await NavigationBar.setPositionAsync('absolute');
    await NavigationBar.setBehaviorAsync('overlay-swipe');
    await NavigationBar.setBackgroundColorAsync('#00000000');
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setVisibilityAsync('hidden');
  } catch (_error) {
    // Sommige Android builds ondersteunen niet elke NavigationBar API.
  }
}

function GlobalSettingsButton({
  isTablet,
  tabletScale,
  runSettingsWiggle,
  openSettingsFromGlobalButton,
  settingsWiggleStyle,
}) {
  const { settings } = useAppSettings();

  useEffect(() => {
    preloadSoundEffect(SETTINGS_GEAR_SOUND);
  }, []);

  function handlePress(event) {
    void playSoundEffect(SETTINGS_GEAR_SOUND, settings);
    openSettingsFromGlobalButton(event);
  }

  return (
    <Pressable
      onPressIn={runSettingsWiggle}
      onPress={handlePress}
      hitSlop={10}
      style={[
        styles.globalSettingsButton,
        isTablet && {
          top: 24,
          right: 24,
          width: 54 * tabletScale,
          height: 54 * tabletScale,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.globalSettingsIconWrap,
          isTablet && {
            width: 54 * tabletScale,
            height: 54 * tabletScale,
          },
          settingsWiggleStyle,
        ]}
      >
        <Image
          source={SETTINGS_GEAR_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.globalSettingsIcon,
            isTablet && {
              width: 52 * tabletScale,
              height: 52 * tabletScale,
            },
            styles.globalSettingsIconShadow,
          ]}
        />
        <Image
          source={SETTINGS_GEAR_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.globalSettingsIcon,
            isTablet && {
              width: 52 * tabletScale,
              height: 52 * tabletScale,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

function BackgroundMusicController({ mode, sessionKey }) {
  const { settings } = useAppSettings();
  const previousGameSessionKeyRef = useRef(null);

  useEffect(() => {
    if (mode === 'home') {
      previousGameSessionKeyRef.current = null;
      void playHomeBackgroundMusic(settings);
      return;
    }

    if (mode === 'game') {
      const nextSessionKey = sessionKey ?? 'game';

      async function startGameMusic() {
        if (previousGameSessionKeyRef.current !== nextSessionKey) {
          previousGameSessionKeyRef.current = nextSessionKey;
          await resetGameBackgroundMusicForNewRound();
        }

        await playGameBackgroundMusic(settings);
      }

      void startGameMusic();
      return;
    }

    previousGameSessionKeyRef.current = null;
    void pauseBackgroundMusic();
  }, [mode, sessionKey, settings]);

  useEffect(() => () => {
    void pauseBackgroundMusic();
  }, []);

  return null;
}

function AudioAwareAdProvider({ children }) {
  const { settings } = useAppSettings();

  const restoreAudioAfterInterstitial = useCallback(() => {
    void restoreBackgroundMusicAfterInterruption(settings);
  }, [settings]);

  return (
    <PremiumProvider>
      <AdsProvider onInterstitialFinished={restoreAudioAfterInterstitial}>
        {children}
      </AdsProvider>
    </PremiumProvider>
  );
}

function DriverWarningBootGate({ width, isTablet, onComplete }) {
  const warningFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const dismissedRef = useRef(false);
  const [buttonReady, setButtonReady] = useState(false);
  const iconSize = isTablet
    ? Math.min(372, Math.max(326, width * 0.395))
    : Math.min(
        DRIVER_WARNING_BOOT_ICON_MAX_SIZE,
        width * DRIVER_WARNING_BOOT_ICON_WIDTH_RATIO
      );

  useEffect(() => {
    const popupTimer = setTimeout(() => {
      Animated.timing(warningFade, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, DRIVER_WARNING_BOOT_POPUP_DELAY_MS);

    const buttonTimer = setTimeout(() => {
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: DRIVER_WARNING_BOOT_BUTTON_FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setButtonReady(true);
        }
      });
    }, DRIVER_WARNING_BOOT_BUTTON_DELAY_MS);

    return () => {
      clearTimeout(popupTimer);
      clearTimeout(buttonTimer);
    };
  }, [buttonFade, warningFade]);

  function handleConfirm() {
    if (dismissedRef.current) {
      return;
    }

    dismissedRef.current = true;
    setButtonReady(false);

    Animated.parallel([
      Animated.timing(warningFade, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonFade, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }

  return (
    <View style={styles.driverWarningBootLayer}>
      <Animated.View
        style={[
          styles.driverWarningBootContent,
          isTablet && styles.driverWarningBootContentTablet,
          {
            opacity: warningFade,
            transform: [
              {
                translateY: warningFade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-48, -58],
                }),
              },
            ],
          },
        ]}
      >
        <ImageBackground
          source={DRIVER_WARNING_MENU_IMAGE}
          resizeMode="contain"
          style={styles.driverWarningBootMenu}
          imageStyle={styles.driverWarningBootMenuImage}
        >
          <Text style={[styles.driverWarningBootTitle, isTablet && styles.driverWarningBootTitleTablet, { fontFamily: 'FredokaOne_400Regular' }]}>
            Rij veilig!
          </Text>
          <View style={[styles.driverWarningBootBody, isTablet && styles.driverWarningBootBodyTablet]}>
            <Text style={[styles.driverWarningBootText, isTablet && styles.driverWarningBootTextTablet, { fontFamily: 'FredokaOne_400Regular' }]}>
              Gebruik AutoBingo niet als bestuurder
            </Text>
            <Image
              source={DRIVER_WARNING_ICON_IMAGE}
              resizeMode="contain"
              style={[
                styles.driverWarningBootIcon,
                isTablet && styles.driverWarningBootIconTablet,
                {
                  width: iconSize,
                  height: iconSize,
                },
              ]}
            />
            <Text style={[styles.driverWarningBootFooterText, isTablet && styles.driverWarningBootFooterTextTablet, { fontFamily: 'FredokaOne_400Regular' }]}>
              De app is bedoeld voor passagiers
            </Text>
          </View>
          <Animated.View
            pointerEvents={buttonReady ? 'box-none' : 'none'}
            style={[
              styles.driverWarningBootButtonWrap,
              {
                opacity: buttonFade,
                transform: [
                  {
                    translateY: buttonFade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <GlossyButton
              label="Ik ben geen bestuurder"
              variant="green"
              heightOverride={isTablet ? 66 : 54}
              horizontalPadding={isTablet ? 34 : 22}
              labelFontScale={isTablet ? 0.88 : 0.78}
              onPress={handleConfirm}
            />
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

async function preloadAssetsForRoute(routeName, params = {}) {
  const assets = getRouteAssets(routeName, params);

  if (!assets.length) {
    return;
  }

  if (routeName === 'Spel') {
    await preloadImageAssets(assets);
    return;
  }

  if (!routePreloadPromises.has(routeName)) {
    routePreloadPromises.set(
      routeName,
      preloadImageAssets(assets).catch((error) => {
        routePreloadPromises.delete(routeName);
        throw error;
      })
    );
  }

  await routePreloadPromises.get(routeName);
}

async function preloadBootWarmupAssets() {
  await Promise.all(
    BOOT_WARMUP_ROUTE_NAMES.map((routeName) => preloadAssetsForRoute(routeName))
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForStableFrame(extraDelayMs = 0) {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (extraDelayMs > 0) {
            setTimeout(resolve, extraDelayMs);
            return;
          }

          resolve();
        });
      });
    });
  });
}

function waitForMinimumElapsed(startedAt, minimumMs) {
  const elapsed = Date.now() - startedAt;
  return wait(Math.max(0, minimumMs - elapsed));
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(width, height);
  const [fontsLoaded] = useFonts({
    FredokaOne_400Regular,
    KentekenSmits1951: require('./assets/fonts/KentekenSmits1951.otf'),
  });
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [legalStatus, setLegalStatus] = useState('checking');
  const [bootRevealComplete, setBootRevealComplete] = useState(false);
  const [driverWarningComplete, setDriverWarningComplete] = useState(false);
  const [stack, setStack] = useState([{ name: 'Home', params: {} }]);
  const [enterTransition, setEnterTransition] = useState(null);
  const [gameMusicReady, setGameMusicReady] = useState(false);
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
  const enterRevealRef = useRef(null);
  const bootRevealRef = useRef(null);
  const settingsWiggle = useRef(new Animated.Value(0)).current;
  const settingsWiggleTimeoutRef = useRef(null);
  const preloadedTransitionKeysRef = useRef(new Set());
  const navigationRequestRef = useRef(0);
  const routeReadyRef = useRef(false);
  const routeReadyResolverRef = useRef(null);
  const currentRoute = stack[stack.length - 1];
  const CurrentScreen = SCREEN_COMPONENTS[currentRoute.name] ?? HomeScreen;
  const currentRouteReadyKey = currentRoute.params?.transition?.transitionKey
    ?? currentRoute.params?.replayAt
    ?? currentRoute.name;
  const legalAccepted = legalStatus === 'accepted';
  const legalRequired = legalStatus === 'required';
  const shouldShowDriverWarning = legalAccepted && currentRoute.name === 'Home' && !driverWarningComplete;
  const bootRevealCanStart = legalAccepted && driverWarningComplete;
  const showGlobalSettingsButton = legalAccepted
    && driverWarningComplete
    && currentRoute.name !== 'Instellingen'
    && !settingsMenuVisible;
  const backgroundMusicMode = !legalAccepted || !driverWarningComplete
    ? 'none'
    : currentRoute.name === 'Spel'
      ? (gameMusicReady ? 'game' : 'none')
      : 'home';
  const backgroundMusicSessionKey = currentRoute.name === 'Spel'
    ? [
        currentRoute.params?.replayAt ?? 'initial',
        currentRoute.params?.config?.startedAt ?? 'local',
        currentRoute.params?.config?.seed ?? 'seed',
        currentRoute.params?.config?.salt ?? 'salt',
      ].join(':')
    : null;

  useEffect(() => {
    void hideAndroidSystemNavigation();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hideAndroidSystemNavigation();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    void hideAndroidSystemNavigation();
  }, [currentRoute.name, settingsMenuVisible]);

  const markCurrentRouteReady = useCallback(() => {
    routeReadyRef.current = true;
    routeReadyResolverRef.current?.();
    routeReadyResolverRef.current = null;
  }, []);

  const waitForCurrentRouteReady = useCallback((timeoutMs = ROUTE_READY_TIMEOUT_MS) => (
    new Promise((resolve) => {
      if (routeReadyRef.current) {
        resolve();
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;
        if (routeReadyResolverRef.current === finish) {
          routeReadyResolverRef.current = null;
        }
        resolve();
      };

      routeReadyResolverRef.current = finish;
      setTimeout(finish, timeoutMs);
    })
  ), []);

  const activateEnterTransition = useCallback((transition) => {
    if (!transition?.transitionKey) {
      return;
    }

    setEnterTransition((current) => (
      current?.transitionKey === transition.transitionKey ? current : transition
    ));
  }, []);

  const applyNavigationAfterSolidCommit = useCallback((transition, applyNavigation, requestId = null) => {
    activateEnterTransition(transition);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (requestId !== null && navigationRequestRef.current !== requestId) {
          return;
        }

        applyNavigation();
      });
    });
  }, [activateEnterTransition]);

  useEffect(() => {
    let cancelled = false;

    async function checkLegalAcceptance() {
      const accepted = await hasAcceptedCurrentLegalTerms();

      if (!cancelled) {
        setLegalStatus(accepted ? 'accepted' : 'required');
      }
    }

    void checkLegalAcceptance();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preloadAppAssets() {
      try {
        await preloadImageAssets(BOOT_ASSETS);
      } catch (_error) {
        // Laat de app gewoon door als een preload faalt.
      } finally {
        if (!cancelled) {
          setAssetsLoaded(true);
        }
      }
    }

    void preloadAppAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    routeReadyRef.current = false;
    routeReadyResolverRef.current = null;
  }, [currentRouteReadyKey]);

  useEffect(() => {
    if (currentRoute.name !== 'Spel' && gameMusicReady) {
      setGameMusicReady(false);
    }
  }, [currentRoute.name, gameMusicReady]);

  useEffect(() => {
    if (!fontsLoaded || !assetsLoaded || !legalAccepted || bootRevealComplete) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      void preloadBootWarmupAssets().catch(() => {
        // Warm-up is alleen bedoeld om latere schermen soepeler te maken.
      });
    });
  }, [assetsLoaded, bootRevealComplete, fontsLoaded, legalAccepted]);

  useEffect(() => {
    if (!fontsLoaded || !assetsLoaded || !bootRevealCanStart || bootRevealComplete) {
      return;
    }

    let cancelled = false;

    async function revealAfterInitialRouteIsReady() {
      const startedAt = Date.now();

      try {
        await Promise.all([
          Platform.OS === 'android'
            ? preloadAssetsForRoute(currentRoute.name, currentRoute.params)
            : Promise.resolve(),
          waitForCurrentRouteReady(BOOT_ROUTE_READY_TIMEOUT_MS),
          waitForMinimumElapsed(startedAt, BOOT_MIN_SOLID_MS),
        ]);
      } catch (_error) {
        // Als preload faalt, blijft de app niet hangen op het rode boot-scherm.
      }

      await waitForStableFrame(BOOT_RENDER_SETTLE_MS);

      if (!cancelled) {
        bootRevealRef.current?.reveal();
      }
    }

    void revealAfterInitialRouteIsReady();

    return () => {
      cancelled = true;
    };
  }, [assetsLoaded, bootRevealCanStart, bootRevealComplete, currentRoute.name, currentRoute.params, fontsLoaded, waitForCurrentRouteReady]);

  useLayoutEffect(() => {
    const transition = currentRoute.params?.transition;

    if (!transition?.transitionKey) {
      return;
    }

    activateEnterTransition(transition);
  }, [activateEnterTransition, currentRoute]);

  useEffect(() => {
    if (!enterTransition) {
      return;
    }

    let cancelled = false;

    async function revealAfterRouteSettles(settleOverrideMs = null) {
      const settleMs = settleOverrideMs ?? enterTransition.settleMs ?? ROUTE_RENDER_SETTLE_MS;

      await Promise.all([
        waitForCurrentRouteReady(ROUTE_READY_TIMEOUT_MS),
        waitForStableFrame(settleMs),
      ]);

      if (!cancelled) {
        enterRevealRef.current?.reveal();
      }
    }

    async function startEnterTransition() {
      const startedAt = Date.now();
      const wasPreloaded = preloadedTransitionKeysRef.current.has(enterTransition.transitionKey);

      if (wasPreloaded) {
        preloadedTransitionKeysRef.current.delete(enterTransition.transitionKey);
      }

      const pauseMs = wasPreloaded ? 0 : (enterTransition.pauseMs ?? 80);
      const preloadPromise = wasPreloaded
        ? Promise.resolve()
        : preloadAssetsForRoute(enterTransition.routeName, currentRoute.params);

      try {
        await Promise.all([
          preloadPromise,
          wait(pauseMs),
          waitForMinimumElapsed(startedAt, enterTransition.minSolidMs ?? ROUTE_MIN_SOLID_MS),
        ]);
      } catch (_error) {
        // Als preload faalt, willen we alsnog de transitie afronden.
      }

      if (cancelled) {
        return;
      }

      if (enterTransition.routeName === 'Spel') {
        const settleMs = enterTransition.settleMs ?? GAME_ROUTE_SETTLE_MS;
        await Promise.all([
          fadeOutHomeBackgroundMusic(),
          wait(settleMs),
        ]);

        if (cancelled) {
          return;
        }

        setGameMusicReady(true);
        void revealAfterRouteSettles(enterTransition.routeReadySettleMs ?? ROUTE_RENDER_SETTLE_MS);
        return;
      }

      void revealAfterRouteSettles();
    }

    void startEnterTransition();

    return () => {
      cancelled = true;
    };
  }, [enterTransition, waitForCurrentRouteReady]);

  useEffect(() => () => {
    if (settingsWiggleTimeoutRef.current) {
      clearTimeout(settingsWiggleTimeoutRef.current);
      settingsWiggleTimeoutRef.current = null;
    }
  }, []);

  const settingsWiggleStyle = useMemo(() => ({
    transform: [
      {
        rotate: settingsWiggle.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-9deg', '0deg', '9deg'],
        }),
      },
    ],
  }), [settingsWiggle]);

  function runSettingsWiggle() {
    settingsWiggle.stopAnimation();
    settingsWiggle.setValue(0);
    Animated.sequence([
      Animated.timing(settingsWiggle, {
        toValue: 1,
        duration: 54,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(settingsWiggle, {
        toValue: -1,
        duration: 76,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(settingsWiggle, {
        toValue: 0.72,
        duration: 66,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(settingsWiggle, {
        toValue: -0.34,
        duration: 56,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(settingsWiggle, {
        toValue: 0,
        duration: 64,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }

  function runNavigationAfterPreload(name, params, applyNavigation) {
    const transition = params.transition;

    navigationRequestRef.current += 1;
    const requestId = navigationRequestRef.current;

    if (!transition?.transitionKey) {
      applyNavigation();
      return;
    }

    if (transition.preloaded) {
      preloadedTransitionKeysRef.current.add(transition.transitionKey);
      applyNavigationAfterSolidCommit(transition, applyNavigation, requestId);
      return;
    }

    async function preloadThenNavigate() {
      const routeName = transition.routeName ?? name;
      const pauseMs = transition.pauseMs ?? 80;

      try {
        await Promise.all([
          preloadAssetsForRoute(routeName, params),
          wait(pauseMs),
        ]);
      } catch (_error) {
        // Als preload faalt, moet navigeren nog steeds kunnen.
      }

      if (navigationRequestRef.current !== requestId) {
        return;
      }

      preloadedTransitionKeysRef.current.add(transition.transitionKey);
      applyNavigationAfterSolidCommit(transition, applyNavigation, requestId);
    }

    void preloadThenNavigate();
  }

  const navigation = useMemo(() => ({
    canGoBack: stack.length > 1,
    markRouteReady: markCurrentRouteReady,
    navigate: (name, params = {}) => {
      runNavigationAfterPreload(name, params, () => {
        setStack((current) => [...current, { name, params }]);
      });
    },
    replace: (name, params = {}) => {
      runNavigationAfterPreload(name, params, () => {
        setStack((current) => [
          ...current.slice(0, current.length - 1),
          { name, params },
        ]);
      });
    },
    reset: (name, params = {}) => {
      runNavigationAfterPreload(name, params, () => {
        setStack([{ name, params }]);
      });
    },
    goBack: () => {
      setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
    },
    goBackWithTransition: (transition = {}) => {
      const previousRoute = stack[stack.length - 2] ?? { name: 'Home', params: {} };

      if (stack.length <= 1 && stack[stack.length - 1]?.name === previousRoute.name) {
        return;
      }

      const backTransition = {
        ...transition,
        routeName: previousRoute.name,
        transitionKey: transition.transitionKey ?? `${previousRoute.name}-back-${Date.now()}`,
      };

      applyNavigationAfterSolidCommit(backTransition, () => {
        setStack((current) => {
          return [
            ...current.slice(0, Math.max(0, current.length - 2)),
            {
              ...previousRoute,
              params: {
                ...(previousRoute.params ?? {}),
                transition: backTransition,
              },
            },
          ];
        });
      });
    },
  }), [applyNavigationAfterSolidCommit, markCurrentRouteReady, stack]);

  async function openSettingsFromGlobalButton(event) {
    if (currentRoute.name === 'Instellingen' || enterTransition || settingsMenuVisible) {
      return;
    }

    if (settingsWiggleTimeoutRef.current) {
      clearTimeout(settingsWiggleTimeoutRef.current);
      settingsWiggleTimeoutRef.current = null;
    }
    try {
      await preloadAssetsForRoute('Instellingen');
      await waitForStableFrame(80);
    } catch (_error) {
      // Instellingen mag alsnog openen als prefetch faalt.
    }

    setSettingsMenuVisible(true);
  }

  if (!fontsLoaded || !assetsLoaded || legalStatus === 'checking') {
    return (
      <View style={styles.bootScreen}>
        <StatusBar style="light" hidden />
      </View>
    );
  }

  return (
    <AppSettingsProvider>
      <BackgroundMusicController
        mode={backgroundMusicMode}
        sessionKey={backgroundMusicSessionKey}
      />
      {legalAccepted && driverWarningComplete ? (
        <AudioAwareAdProvider>
            <StatusBar style="dark" hidden />
            <CurrentScreen navigation={navigation} route={currentRoute} />
            <SettingsScreen
              navigation={navigation}
              route={{ name: 'Instellingen', params: {} }}
              visible={settingsMenuVisible}
              onClose={() => setSettingsMenuVisible(false)}
            />
        </AudioAwareAdProvider>
      ) : null}
      {legalRequired ? (
        <View style={styles.legalBootLayer}>
          <StatusBar style="light" hidden />
          <LegalConsentGate
            backgroundColor="transparent"
            onAccepted={() => setLegalStatus('accepted')}
          />
        </View>
      ) : null}
      {legalAccepted ? (
        <>
      {showGlobalSettingsButton ? (
        <GlobalSettingsButton
          isTablet={isTablet}
          tabletScale={tabletScale}
          runSettingsWiggle={runSettingsWiggle}
          openSettingsFromGlobalButton={openSettingsFromGlobalButton}
          settingsWiggleStyle={settingsWiggleStyle}
        />
      ) : null}
        </>
      ) : null}
      {shouldShowDriverWarning ? (
        <DriverWarningBootGate
          width={width}
          isTablet={isTablet}
          onComplete={() => setDriverWarningComplete(true)}
        />
      ) : null}
      {!bootRevealComplete && bootRevealCanStart ? (
        <CircularReveal
          ref={bootRevealRef}
          color="#E03030"
          originX={width / 2}
          originY={height / 2}
          initiallyVisible
          initialProgress={0}
          mode="uncover"
          onComplete={() => {
            setBootRevealComplete(true);
          }}
        />
      ) : null}
      {enterTransition ? (
        <CircularReveal
          key={`enter-${enterTransition.transitionKey}`}
          ref={enterRevealRef}
          color={enterTransition.color ?? '#E03030'}
          originX={width / 2}
          originY={height / 2}
          initiallyVisible
          initialProgress={0}
          mode="uncover"
          onComplete={() => {
            setEnterTransition(null);
          }}
        />
      ) : null}
    </AppSettingsProvider>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: '#E03030',
  },
  legalBootLayer: {
    flex: 1,
    backgroundColor: '#E03030',
    zIndex: 9400,
    elevation: 9400,
  },
  driverWarningBootLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E03030',
    zIndex: 9500,
    elevation: 9500,
  },
  driverWarningBootContent: {
    width: '96%',
    maxWidth: 430,
    aspectRatio: 1122 / 1402,
  },
  driverWarningBootContentTablet: {
    width: '68%',
    maxWidth: 560,
  },
  driverWarningBootMenu: {
    width: '100%',
    height: '100%',
  },
  driverWarningBootMenuImage: {
    width: '100%',
    height: '100%',
  },
  driverWarningBootTitle: {
    position: 'absolute',
    top: '5.5%',
    left: '20%',
    right: '20%',
    height: '10%',
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 37,
    textAlign: 'center',
    textAlignVertical: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(120, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  driverWarningBootTitleTablet: {
    fontSize: 38,
    lineHeight: 44,
  },
  driverWarningBootBody: {
    position: 'absolute',
    top: '16%',
    left: '11%',
    right: '11%',
    bottom: '8%',
    alignItems: 'center',
  },
  driverWarningBootBodyTablet: {
    top: '16.8%',
    left: '10%',
    right: '10%',
  },
  driverWarningBootText: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 25,
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
  },
  driverWarningBootTextTablet: {
    marginTop: 18,
    fontSize: 24,
    lineHeight: 31,
  },
  driverWarningBootIcon: {
    marginTop: 10,
    marginBottom: 5,
  },
  driverWarningBootIconTablet: {
    marginTop: 18,
    marginBottom: 16,
  },
  driverWarningBootFooterText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
  },
  driverWarningBootFooterTextTablet: {
    fontSize: 24,
    lineHeight: 31,
  },
  driverWarningBootButtonWrap: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    bottom: -64,
    alignItems: 'center',
    zIndex: 5,
    elevation: 5,
  },
  globalSettingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
    elevation: 9000,
  },
  globalSettingsIconWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalSettingsIcon: {
    width: 52,
    height: 52,
  },
  globalSettingsIconShadow: {
    position: 'absolute',
    tintColor: 'rgba(0, 0, 0, 0.34)',
    transform: [{ translateX: 2 }, { translateY: 3 }, { scale: 0.98 }],
    opacity: 0.34,
  },
});

function GameScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const { maybeShowInterstitial } = useAds();
  const config = route.params?.config ?? {};
  const replayAt = route.params?.replayAt ?? 'initial-game';
  const isLiveLobbyGame = config.syncType === 'live' && Boolean(config.lobbyCode);
  const connectionStatus = useOnlineConnectionStatus(isLiveLobbyGame);
  const liveConnectionOffline = isLiveLobbyGame && connectionStatus.isOffline;
  const [liveLobby, setLiveLobby] = useState(null);
  const leavingLiveGameRef = useRef(false);
  const stopGameCheckTimeoutRef = useRef(null);
  const stopGameRevealRef = useRef(null);
  const [stopGameReveal, setStopGameReveal] = useState(null);
  const [gameAssetsReady, setGameAssetsReady] = useState(false);
  const gameWarmupAssets = useMemo(() => getRouteAssets('Spel', route.params), [route.params]);
  const spelers = withDefaultPlayerNames(config.spelers?.length
    ? config.spelers
    : Array.from({ length: config.aantalSpelersOpDitApparaat ?? 1 }, (_, index) => ({
        naam: `Speler ${index + 1}`,
        skin: index === 0 ? 'rood' : 'blauw',
        playerId: `placeholder-${index + 1}`,
      })));
  const displayLiveLobbyPlayers = withDefaultPlayerNames(liveLobby?.players ?? config.liveLobbyPlayers ?? []);
  const localPlayerIds = useMemo(
    () => spelers.map((player) => player.playerId).filter(Boolean),
    [spelers]
  );
  const canReplayLive = useMemo(
    () => (
      config.syncType === 'live'
        ? (liveLobby?.players ?? config.liveLobbyPlayers ?? []).some((player) => (
            localPlayerIds.includes(player.playerId) && player.role === 'host'
          ))
        : true
    ),
    [config.liveLobbyPlayers, config.syncType, liveLobby?.players, localPlayerIds]
  );
  const isLocalLiveHost = useMemo(
    () => (
      config.syncType === 'live'
        ? (liveLobby?.players ?? config.liveLobbyPlayers ?? []).some((player) => (
            localPlayerIds.includes(player.playerId) && player.role === 'host'
          ))
        : true
    ),
    [config.liveLobbyPlayers, config.syncType, liveLobby?.players, localPlayerIds]
  );
  const handleGameWarmupReady = useCallback(() => {
    setGameAssetsReady(true);
  }, []);

  useEffect(() => {
    if (!gameAssetsReady) {
      return undefined;
    }

    let cancelled = false;

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            navigation.markRouteReady?.();
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [gameAssetsReady, navigation]);

  useEffect(() => {
    if (config.syncType !== 'live' || !config.lobbyCode) {
      return undefined;
    }

    return subscribeToLobby(config.lobbyCode, setLiveLobby);
  }, [config.lobbyCode, config.syncType]);

  useEffect(() => {
    if (config.syncType !== 'live' || !liveLobby?.started || liveConnectionOffline) {
      return;
    }

    const nextSeed = liveLobby.config?.seed;
    const nextSalt = liveLobby.config?.salt;
    const nextStartedAt = liveLobby.startedAt ?? null;
    const currentStartedAt = config.startedAt ?? null;

    if (!currentStartedAt) {
      return;
    }

    if (nextSeed === config.seed && nextSalt === config.salt && nextStartedAt === currentStartedAt) {
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...config,
        ...liveLobby.config,
        startedAt: nextStartedAt,
        liveLobbyPlayers: liveLobby.players,
      },
      replayAt: Date.now(),
      transition: {
        color: '#159B3B',
        originX: width / 2,
        originY: height / 2,
        routeName: 'Spel',
        pauseMs: 80,
        minSolidMs: 360,
        settleMs: 120,
        routeReadySettleMs: 160,
        transitionKey: `live-replay-${Date.now()}`,
      },
    });
  }, [config, liveConnectionOffline, liveLobby, navigation]);

  useEffect(() => {
    if (config.syncType !== 'live' || !liveLobby || liveConnectionOffline) {
      return;
    }

    if (liveLobby.started) {
      if (stopGameCheckTimeoutRef.current) {
        clearTimeout(stopGameCheckTimeoutRef.current);
        stopGameCheckTimeoutRef.current = null;
      }
      return;
    }

    if (leavingLiveGameRef.current) {
      return;
    }

    if ((config.startedAt ?? null) === null) {
      return;
    }

    if (stopGameReveal || stopGameCheckTimeoutRef.current) {
      return;
    }

    stopGameCheckTimeoutRef.current = setTimeout(() => {
      stopGameCheckTimeoutRef.current = null;
      void getLobbySnapshot(config.lobbyCode).then((snapshot) => {
        if (leavingLiveGameRef.current || stopGameReveal) {
          return;
        }

        if (snapshot && !snapshot.started && (config.startedAt ?? null) !== null) {
          setStopGameReveal({
            transitionKey: `game-stopped-lobby-${Date.now()}`,
          });
        }
      });
    }, 1200);
  }, [config.lobbyCode, config.startedAt, config.syncType, liveConnectionOffline, liveLobby, stopGameReveal]);

  useEffect(() => () => {
    if (stopGameCheckTimeoutRef.current) {
      clearTimeout(stopGameCheckTimeoutRef.current);
      stopGameCheckTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!stopGameReveal) {
      return;
    }

    requestAnimationFrame(() => {
      stopGameRevealRef.current?.reveal();
    });
  }, [stopGameReveal]);

  function openStoppedLobby(transitionKey) {
    navigation.reset('Lobby', {
      config: {
        ...config,
        ...(liveLobby?.config ?? {}),
        startedAt: null,
        liveLobbyPlayers: liveLobby?.players ?? config.liveLobbyPlayers,
      },
      transition: {
        color: '#159B3B',
        originX: width / 2,
        originY: height / 2,
        routeName: 'Lobby',
        pauseMs: 100,
        transitionKey,
      },
    });
  }

  return (
    <>
    <WarmupImages
      assets={gameWarmupAssets}
      timeoutMs={null}
      imageSize={128}
      batchSize={16}
      onReady={handleGameWarmupReady}
    />
    <BingoCardScreen
      key={replayAt}
      thema={config.thema}
      seed={config.seed}
      lobbyCode={config.lobbyCode}
      liveLobbyPlayers={displayLiveLobbyPlayers}
      startedAt={config.startedAt}
      wincondition={config.wincondition}
      diagonaal={config.diagonaal}
      nederlands={config.nederlands}
      aantalSpelersOpDitApparaat={config.aantalSpelersOpDitApparaat ?? spelers.length}
      kaartOpzet={config.kaartOpzet}
      modus={config.modus}
      syncType={config.syncType}
      spelers={spelers}
      canReplay={canReplayLive}
      settingsLabel={isLiveLobbyGame ? 'Lobby' : 'Instellingen'}
      isLiveLobbyHost={isLocalLiveHost}
      playerThemes={
        config.kaartOpzet === 'ander-thema'
          ? getPlayerThemes(config.thema, config.aantalSpelersOpDitApparaat ?? spelers.length)
          : undefined
      }
      onGameBack={(origin = {}) => {
        const targetRoute = isLiveLobbyGame
          ? (isLocalLiveHost ? 'Lobby' : 'Home')
          : 'SingleDeviceSetupTest';
        const transitionKey = `${
          isLiveLobbyGame
            ? (isLocalLiveHost ? 'game-lobby' : 'game-home')
            : 'game-setup'
        }-${Date.now()}`;
        const transition = {
          color: origin.color ?? '#F5C400',
          originX: width / 2,
          originY: height / 2,
          routeName: targetRoute,
        pauseMs: 80,
          transitionKey,
        };

        if (isLiveLobbyGame) {
          if (isLocalLiveHost) {
            void stopLobbyGame(config.lobbyCode).then((stoppedLobby) => {
              navigation.reset('Lobby', {
                config: {
                  ...config,
                  ...(stoppedLobby?.config ?? {}),
                  startedAt: null,
                  liveLobbyPlayers: stoppedLobby?.players ?? config.liveLobbyPlayers,
                },
                transition,
              });
            });
            return;
          }

          leavingLiveGameRef.current = true;
          void removePlayers(config.lobbyCode, localPlayerIds).finally(() => {
            navigation.reset('Home', { transition });
          });
          return;
        }

        navigation.reset('SingleDeviceSetupTest', {
          initialConfig: config,
          transition,
        });
      }}
      onMenu={async (origin = {}) => {
        await maybeShowInterstitial('winner-home');

        navigation.reset('Home', {
          transition: {
            color: origin.color ?? '#F5C400',
            originX: width / 2,
            originY: height / 2,
            routeName: 'Home',
            pauseMs: 80,
            transitionKey: `winner-home-${Date.now()}`,
          },
        });
      }}
      onSettings={async (origin = {}) => {
        await maybeShowInterstitial(isLiveLobbyGame ? 'winner-lobby' : 'winner-settings');

        if (isLiveLobbyGame) {
          navigation.reset('Lobby', {
            config,
            transition: {
              color: '#1A7BD4',
              originX: width / 2,
              originY: height / 2,
              routeName: 'Lobby',
              pauseMs: 100,
              transitionKey: `winner-lobby-${Date.now()}`,
            },
          });
          return;
        }

        navigation.reset('SingleDeviceSetupTest', {
          initialConfig: config,
          transition: {
            color: '#1A7BD4',
            originX: width / 2,
            originY: height / 2,
            routeName: 'SingleDeviceSetupTest',
            pauseMs: 100,
            transitionKey: `winner-settings-${Date.now()}`,
          },
        });
      }}
      onReplay={async () => {
        await maybeShowInterstitial('winner-replay');

        if (config.syncType === 'live' && config.lobbyCode) {
          if (!canReplayLive) {
            return;
          }

          await restartLobbyGame(config.lobbyCode, {
            seed: createRandomSeed(),
            salt: createRandomSalt(),
          });
          return;
        }

        navigation.replace('Spel', {
          config: {
            ...config,
            seed: createRandomSeed(),
            salt: createRandomSalt(),
          },
          replayAt: Date.now(),
          transition: {
            color: '#159B3B',
            originX: width / 2,
            originY: height / 2,
            routeName: 'Spel',
            pauseMs: 80,
            minSolidMs: 360,
            settleMs: 120,
            routeReadySettleMs: 160,
            transitionKey: `winner-replay-${Date.now()}`,
          },
        });
      }}
    />
    {stopGameReveal ? (
      <CircularReveal
        key={stopGameReveal.transitionKey}
        ref={stopGameRevealRef}
        color="#159B3B"
        originX={width / 2}
        originY={height / 2}
        onComplete={() => {
          openStoppedLobby(stopGameReveal.transitionKey);
        }}
      />
    ) : null}
    </>
  );
}
