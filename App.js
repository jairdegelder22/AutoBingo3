import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { Asset } from 'expo-asset';
import { Animated, Easing, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import CircularReveal from './components/CircularReveal';
import HomeScreen from './screens/HomeScreen';
import ApparaatKeuzeScreen from './screens/ApparaatKeuzeScreen';
import SoloSetupScreen from './screens/SoloSetupScreen';
import MultiplayerKeuzeScreen from './screens/MultiplayerKeuzeScreen';
import SyncKeuzeScreen from './screens/SyncKeuzeScreen';
import HostSetupScreen from './screens/HostSetupScreen';
import JoinScreen from './screens/JoinScreen';
import PlayerSetupScreen from './screens/PlayerSetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen';
import SettingsScreen from './screens/SettingsScreen';
import BingoCardScreen from './screens/BingoCardScreen';
import ButtonTestScreen from './src/screens/ButtonTestScreen';
import CircularRevealDemoScreen from './src/screens/CircularRevealDemoScreen';
import SingleDeviceSetupTestScreen from './src/screens/SingleDeviceSetupTestScreen';
import { createRandomSalt, createRandomSeed, getPlayerThemes, withDefaultPlayerNames } from './screens/gameFlowConfig';
import { getRandomIcons, getThemeIcons } from './screens/themeIcons';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_FUTURE_SKIN_IMAGE, PLAYER_IMAGES } from './assets/images/players/playerImages';
import { THEME_CARD_IMAGES } from './assets/images/theme-cards/themeCardImages';
import { clearBoardState, getLobbySnapshot, removePlayers, restartLobbyGame, stopLobbyGame, subscribeToLobby } from './src/services/liveLobbyService';
import { AppSettingsProvider } from './src/settings/AppSettingsContext';
import { PremiumProvider } from './src/premium/PremiumContext';
import { getResponsiveMetrics } from './src/utils/responsive';
import useOnlineConnectionStatus from './src/hooks/useOnlineConnectionStatus';
import LegalConsentGate, { hasAcceptedCurrentLegalTerms } from './src/legal/LegalConsentGate';

const SCREEN_COMPONENTS = {
  Home: HomeScreen,
  ApparaatKeuze: ApparaatKeuzeScreen,
  SoloSetup: SoloSetupScreen,
  MultiplayerKeuze: MultiplayerKeuzeScreen,
  SyncKeuze: SyncKeuzeScreen,
  HostSetup: HostSetupScreen,
  Join: JoinScreen,
  SpelerSetup: PlayerSetupScreen,
  Lobby: LobbyScreen,
  Wachten: WaitingScreen,
  Instellingen: SettingsScreen,
  ButtonTest: ButtonTestScreen,
  CircularRevealDemo: CircularRevealDemoScreen,
  SingleDeviceSetupTest: SingleDeviceSetupTestScreen,
  Spel: GameScreen,
};

const HOME_TAB_ASSETS = [
  require('./assets/images/navigation/back-button.png'),
  require('./assets/images/navigation/back-button-pressed.png'),
  require('./assets/images/navigation/settings-gear.png'),
  require('./assets/homepage.png'),
  require('./assets/logo.png'),
  require('./assets/images/home-online-button.png'),
  require('./assets/images/online-car-yellow.png'),
  require('./assets/images/online-car-blue.png'),
  require('./assets/images/online-car-green.png'),
  require('./assets/images/backgrounds/skin-road-background.png'),
  require('./assets/images/backgrounds/theme-road-scroll-background-v4.png'),
  require('./assets/images/nav-icons/nav-palette.png'),
  require('./assets/images/nav-icons/nav-home.png'),
  require('./assets/images/nav-icons/nav-cards.png'),
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
];
const SETTINGS_GEAR_IMAGE = require('./assets/images/navigation/settings-gear.png');
const SINGLEPLAYER_SETUP_ASSETS = [
  require('./assets/images/backgrounds/game-setup-birds-eye-background-v4.png'),
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
];

const HOST_SETUP_ASSETS = [
  require('./assets/images/backgrounds/game-setup-birds-eye-background-v4.png'),
  require('./assets/images/game-mode-cards/wifi-required.png'),
  require('./assets/images/game-mode-cards/wifi-not-required.png'),
  require('./assets/images/game-mode-cards/wifi-status-panel.png'),
  require('./assets/images/game-mode-cards/klassiek-card-red.png'),
  require('./assets/images/game-mode-cards/klassiek-card-green.png'),
  require('./assets/images/game-mode-cards/klassiek-card-blue.png'),
  require('./assets/images/game-mode-cards/claim-bingo-board.png'),
  require('./assets/images/game-mode-cards/claim-direct-bingo-board.png'),
  require('./assets/images/game-mode-cards/collectief-bingo-board.png'),
  require('./assets/images/settings/crown-logo.png'),
  require('./assets/images/settings/diagonal-logo.png'),
  require('./assets/images/settings/win-1-line.png'),
  require('./assets/images/settings/win-2-lines.png'),
  require('./assets/images/settings/win-full-card.png'),
  require('./assets/images/settings/diagonal-on.png'),
  require('./assets/images/settings/diagonal-off.png'),
  ...Object.values(THEME_CARD_IMAGES),
];

const WAITING_ROOM_ASSETS = [
  require('./assets/images/backgrounds/lobby-road-background.png'),
  require('./assets/images/lobby/lobby-parking-grid.png'),
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  ...Object.values(PLAYER_IMAGES),
];

const SETTINGS_SCREEN_ASSETS = [
  require('./assets/images/settings/settings-menu-panel.png'),
  require('./assets/images/settings/settings-language.png'),
  require('./assets/images/settings/settings-tutorial.png'),
  require('./assets/images/settings/settings-privacy.png'),
  require('./assets/images/settings/settings-premium-restore.png'),
  require('./assets/images/premium/main-menu-premium-crown.png'),
  require('./assets/images/settings/toggles/sfx-on.png'),
  require('./assets/images/settings/toggles/sfx-off.png'),
  require('./assets/images/settings/toggles/music-on.png'),
  require('./assets/images/settings/toggles/music-off.png'),
  require('./assets/images/settings/toggles/haptics-on.png'),
  require('./assets/images/settings/toggles/haptics-off.png'),
  require('./assets/images/settings/toggles/state-on.png'),
  require('./assets/images/settings/toggles/state-off.png'),
];

const POPUP_PANEL_ASSETS = [
  require('./assets/images/ui/popups/popup-menu-panel.png'),
];

const BINGO_BOARD_ASSETS = [
  require('./assets/images/bingo-boards/board-blauw.png'),
  require('./assets/images/bingo-boards/board-geel.png'),
  require('./assets/images/bingo-boards/board-groen.png'),
  require('./assets/images/bingo-boards/board-lichtblauw.png'),
  require('./assets/images/bingo-boards/board-oranje.png'),
  require('./assets/images/bingo-boards/board-paars.png'),
  require('./assets/images/bingo-boards/board-rood.png'),
  require('./assets/images/bingo-boards/board-roze.png'),
  require('./assets/images/bingo-boards/board-wit.png'),
  require('./assets/images/bingo-boards/board-zwart.png'),
  require('./assets/images/bingo-boards/board-neutral.png'),
];

const PREMIUM_PAYWALL_ASSETS = [
  require('./assets/images/premium/premium-menu.png'),
  require('./assets/images/premium/benefits/no-ads-user.png'),
  require('./assets/images/premium/benefits/extra-themes-user.png'),
  require('./assets/images/premium/benefits/host-bingo-user.png'),
  require('./assets/images/premium/close-premium.png'),
  require('./assets/images/premium/take-premium-button.png'),
  require('./assets/images/premium/take-premium-button-pressed.png'),
  require('./assets/images/premium/radio-unselected.png'),
  require('./assets/images/premium/radio-selected.png'),
  require('./assets/images/premium/main-menu-premium-crown.png'),
];

const BINGO_GAME_BASE_ASSETS = [
  require('./assets/images/backgrounds/bingo-original-background.png'),
  require('./assets/images/navigation/back-button.png'),
  require('./assets/images/navigation/back-button-pressed.png'),
  ...BINGO_BOARD_ASSETS,
  require('./assets/logo (bingo-geel).png'),
  require('./assets/logo (bingo-rood).png'),
  require('./assets/logo (bingo-blauw).png'),
  require('./assets/logo (bingo-groen).png'),
  require('./assets/logo (bingo-lichtblauw).png'),
  require('./assets/logo (bingo-oranje).png'),
  require('./assets/logo (bingo-paars).png'),
  require('./assets/logo (bingo-roze).png'),
  require('./assets/logo (bingo-wit).png'),
  require('./assets/logo (bingo-zwart).png'),
  require('./assets/animations/bingo-light.json'),
];
const GAME_ROUTE_SETTLE_MS = 850;

const ROUTE_PRELOADERS = {
  SingleDeviceSetupTest: SINGLEPLAYER_SETUP_ASSETS,
  HostSetup: HOST_SETUP_ASSETS,
  Join: [],
  Wachten: WAITING_ROOM_ASSETS,
  Lobby: WAITING_ROOM_ASSETS,
  Instellingen: SETTINGS_SCREEN_ASSETS,
};

function getSpelAssets(params = {}) {
  const config = params.config ?? params.preloadConfig ?? {};
  const playerSkins = (config.spelers ?? [])
    .map((player) => PLAYER_IMAGES[player?.skin])
    .filter(Boolean);
  const playerCount = Math.max(
    1,
    config.aantalSpelersOpDitApparaat ?? config.spelers?.length ?? 1
  );
  const themeIds = config.kaartOpzet === 'ander-thema'
    ? getPlayerThemes(config.thema, playerCount)
    : [config.thema];
  const themeAssets = [...new Set(themeIds.filter(Boolean))]
    .flatMap((themeId) => getThemeIcons(themeId));
  const boardCellCount = 16;
  const seed = Number.isFinite(config.seed) ? config.seed : 0;
  const boardIconAssets = config.kaartOpzet === 'ander-thema'
    ? getPlayerThemes(config.thema, playerCount)
      .flatMap((themeId, index) => getRandomIcons(themeId, boardCellCount, seed + index))
    : config.kaartOpzet === 'zelfde'
      ? getRandomIcons(config.thema, boardCellCount, seed)
      : Array.from({ length: playerCount }, (_, index) =>
        getRandomIcons(config.thema, boardCellCount, seed + index)
      ).flat();

  return [
    ...BINGO_GAME_BASE_ASSETS,
    ...Object.values(PLAYER_IMAGES),
    ...playerSkins,
    ...themeAssets,
    ...boardIconAssets,
  ];
}

async function preloadImageAssets(assets) {
  const uniqueAssets = [...new Set(assets.filter(Boolean))];

  if (!uniqueAssets.length) {
    return;
  }

  const loadedAssets = await Asset.loadAsync(uniqueAssets);
  await Promise.all(
    loadedAssets
      .map((asset) => asset.localUri ?? asset.uri)
      .filter(Boolean)
      .map((uri) => Image.prefetch(uri).catch(() => false))
  );
}

async function preloadAssetsForRoute(routeName, params = {}) {
  const assets = routeName === 'Spel'
    ? getSpelAssets(params)
    : (ROUTE_PRELOADERS[routeName] ?? []);

  if (!assets.length) {
    return;
  }

  await preloadImageAssets(assets);
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
  const [stack, setStack] = useState([{ name: 'Home', params: {} }]);
  const [enterTransition, setEnterTransition] = useState(null);
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
  const enterRevealRef = useRef(null);
  const bootRevealRef = useRef(null);
  const settingsWiggle = useRef(new Animated.Value(0)).current;
  const settingsWiggleTimeoutRef = useRef(null);
  const preloadedTransitionKeysRef = useRef(new Set());
  const navigationRequestRef = useRef(0);
  const currentRoute = stack[stack.length - 1];
  const CurrentScreen = SCREEN_COMPONENTS[currentRoute.name] ?? HomeScreen;
  const showGlobalSettingsButton = currentRoute.name !== 'Instellingen' && !settingsMenuVisible;

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
        await preloadImageAssets([
          ...HOME_TAB_ASSETS,
          ...POPUP_PANEL_ASSETS,
          ...SETTINGS_SCREEN_ASSETS,
          ...PREMIUM_PAYWALL_ASSETS,
        ]);
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

  useEffect(() => {
    if (!fontsLoaded || !assetsLoaded || legalStatus !== 'accepted' || bootRevealComplete) {
      return;
    }

    requestAnimationFrame(() => {
      bootRevealRef.current?.reveal();
    });
  }, [assetsLoaded, bootRevealComplete, fontsLoaded, legalStatus]);

  useLayoutEffect(() => {
    const transition = currentRoute.params?.transition;

    if (!transition?.transitionKey) {
      return;
    }

    setEnterTransition((current) => (
      current?.transitionKey === transition.transitionKey ? current : transition
    ));
  }, [currentRoute]);

  useEffect(() => {
    if (!enterTransition) {
      return;
    }

    let cancelled = false;

    function revealAfterRouteSettles() {
      const settleMs = enterTransition.settleMs
        ?? (enterTransition.routeName === 'Spel' ? GAME_ROUTE_SETTLE_MS : 0);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (!cancelled) {
              enterRevealRef.current?.reveal();
            }
          }, settleMs);
        });
      });
    }

    async function startEnterTransition() {
      if (preloadedTransitionKeysRef.current.has(enterTransition.transitionKey)) {
        preloadedTransitionKeysRef.current.delete(enterTransition.transitionKey);
        revealAfterRouteSettles();
        return;
      }

      const pauseMs = enterTransition.pauseMs ?? 260;

      try {
        await Promise.all([
          preloadAssetsForRoute(enterTransition.routeName, currentRoute.params),
          new Promise((resolve) => setTimeout(resolve, pauseMs)),
        ]);
      } catch (_error) {
        // Als preload faalt, willen we alsnog de transitie afronden.
      }

      if (cancelled) {
        return;
      }

      revealAfterRouteSettles();
    }

    void startEnterTransition();

    return () => {
      cancelled = true;
    };
  }, [enterTransition]);

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
      setEnterTransition(transition);
      applyNavigation();
      return;
    }

    async function preloadThenNavigate() {
      const routeName = transition.routeName ?? name;
      const pauseMs = transition.pauseMs ?? 260;

      try {
        await Promise.all([
          preloadAssetsForRoute(routeName, params),
          new Promise((resolve) => setTimeout(resolve, pauseMs)),
        ]);
      } catch (_error) {
        // Als preload faalt, moet navigeren nog steeds kunnen.
      }

      if (navigationRequestRef.current !== requestId) {
        return;
      }

      preloadedTransitionKeysRef.current.add(transition.transitionKey);
      setEnterTransition(transition);
      applyNavigation();
    }

    void preloadThenNavigate();
  }

  const navigation = useMemo(() => ({
    canGoBack: stack.length > 1,
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

      setEnterTransition(backTransition);
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
    },
  }), [stack]);

  function openSettingsFromGlobalButton(event) {
    if (currentRoute.name === 'Instellingen' || enterTransition || settingsMenuVisible) {
      return;
    }

    if (settingsWiggleTimeoutRef.current) {
      clearTimeout(settingsWiggleTimeoutRef.current);
      settingsWiggleTimeoutRef.current = null;
    }
    requestAnimationFrame(() => {
      setSettingsMenuVisible(true);
    });
  }

  if (!fontsLoaded || !assetsLoaded || legalStatus === 'checking') {
    return (
      <View style={styles.bootScreen}>
        <StatusBar style="light" hidden />
      </View>
    );
  }

  if (legalStatus !== 'accepted') {
    return (
      <>
        <StatusBar style="light" hidden />
        <LegalConsentGate onAccepted={() => setLegalStatus('accepted')} />
      </>
    );
  }

  return (
    <AppSettingsProvider>
      <PremiumProvider>
        <StatusBar style="dark" hidden />
        <CurrentScreen navigation={navigation} route={currentRoute} />
        <SettingsScreen
          navigation={navigation}
          route={{ name: 'Instellingen', params: {} }}
          visible={settingsMenuVisible}
          onClose={() => setSettingsMenuVisible(false)}
        />
      {showGlobalSettingsButton ? (
        <Pressable
          onPressIn={runSettingsWiggle}
          onPress={openSettingsFromGlobalButton}
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
      ) : null}
      {!bootRevealComplete ? (
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
      </PremiumProvider>
    </AppSettingsProvider>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: '#E03030',
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
        pauseMs: 300,
        transitionKey,
      },
    });
  }

  return (
    <>
    <BingoCardScreen
      key={replayAt}
      thema={config.thema}
      seed={config.seed}
      lobbyCode={config.lobbyCode}
      liveLobbyPlayers={displayLiveLobbyPlayers}
      startedAt={config.startedAt}
      wincondition={config.wincondition}
      diagonaal={config.diagonaal}
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
          pauseMs: 320,
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
      onMenu={(origin = {}) => navigation.reset('Home', {
        transition: {
          color: origin.color ?? '#F5C400',
          originX: width / 2,
          originY: height / 2,
          routeName: 'Home',
          pauseMs: 360,
          transitionKey: `winner-home-${Date.now()}`,
        },
      })}
      onSettings={(origin = {}) => {
        if (isLiveLobbyGame) {
          navigation.reset('Lobby', {
            config,
            transition: {
              color: '#1A7BD4',
              originX: width / 2,
              originY: height / 2,
              routeName: 'Lobby',
              pauseMs: 420,
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
            pauseMs: 420,
            transitionKey: `winner-settings-${Date.now()}`,
          },
        });
      }}
      onReplay={async () => {
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
