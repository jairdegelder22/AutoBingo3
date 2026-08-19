import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../src/settings/haptics';
import ThemeCarousel from '../src/components/ThemeCarousel';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import AnimatedRouteBackButton from '../src/components/AnimatedRouteBackButton';
import WarmupImages from '../src/components/WarmupImages';
import CircularReveal from '../components/CircularReveal';
import PremiumPaywallModal from '../src/premium/PremiumPaywallModal';
import { usePremium } from '../src/premium/PremiumContext';
import { getThemeCardImage, THEME_CARD_IMAGES, THEME_LOCK_OVERLAY_IMAGE } from '../assets/images/theme-cards/themeCardImages';
import {
  createGameConfig,
  createPlayer,
  DEFAULT_ZICHTBAARHEID,
  EQUIPPED_SKIN_STORAGE_KEY,
  GAME_RULE_PREFERENCES_STORAGE_KEY,
  PREFERRED_PLAYER_NAME_STORAGE_KEY,
  SKIN_OPTIONS,
  parseStoredGameRulePreferences,
  serializeGameRulePreferences,
  normalizeCustomPlayerName,
} from './gameFlowConfig';
import { THEMES } from './themeCatalog';
import { LOBBY_CODE_SALT_ENTROPY_BITS, generateLobbyCode } from '../src/utils/lobbyCode';
import { getResponsiveMetrics } from '../src/utils/responsive';
import { ensureLobby } from '../src/services/liveLobbyService';
import { useAppSettings } from '../src/settings/AppSettingsContext';
import { playSoundEffect, preloadSoundEffect } from '../src/audio/soundEffects';
import { HOST_ASSETS } from '../src/assets/preloadManifest';

const GAME_SETUP_BACKGROUND = require('../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const LOBBY_ROAD_BACKGROUND_IMAGE = require('../assets/images/backgrounds/lobby-road-background.png');
const LOBBY_PARKING_GRID_IMAGE = require('../assets/images/lobby/lobby-parking-grid.png');
const WIFI_REQUIRED_IMAGE = require('../assets/images/game-mode-cards/wifi-required.png');
const WIFI_NOT_REQUIRED_IMAGE = require('../assets/images/game-mode-cards/offline-section-no-wifi.png');
const WIFI_STATUS_PANEL_IMAGE = require('../assets/images/game-mode-cards/wifi-status-panel.png');
const KLASSIEK_CARD_RED = require('../assets/images/game-mode-cards/klassiek-card-red.png');
const KLASSIEK_CARD_GREEN = require('../assets/images/game-mode-cards/klassiek-card-green.png');
const KLASSIEK_CARD_BLUE = require('../assets/images/game-mode-cards/klassiek-card-blue.png');
const KLASSIEK_GAME_MODE_BASE = require('../assets/images/game-mode-cards/klassiek-game-mode-base.png');
const CLAIM_GAME_MODE_BASE = require('../assets/images/game-mode-cards/claim-game-mode-base.png');
const COLLECTIEF_GAME_MODE_BASE = require('../assets/images/game-mode-cards/collectief-game-mode-base.png');
const KAARTCODE_GAME_MODE_BASE = require('../assets/images/game-mode-cards/kaartcode-game-mode-base.png');
const KAARTCODE_CARD_YELLOW = require('../assets/images/game-mode-cards/kaartcode-card-yellow.png');
const KAARTCODE_CARD_BLUE = require('../assets/images/game-mode-cards/kaartcode-card-blue.png');
const KAARTCODE_NO_WIFI = require('../assets/images/game-mode-cards/kaartcode-no-wifi.png');
const KAARTCODE_LICENSE_PLATE = require('../assets/images/license-plates/dutch-join-plate-cropped.png');
const COLLECTIEF_BINGO_BOARD = require('../assets/images/game-mode-cards/collectief-bingo-board.png');
const CLAIM_BINGO_BOARD = require('../assets/images/game-mode-cards/claim-direct-bingo-board.png');
const SETTINGS_CROWN_ICON = require('../assets/images/settings/crown-logo.png');
const SETTINGS_DIAGONAL_ICON = require('../assets/images/settings/diagonal-logo.png');
const SETTINGS_RULES_PANEL_IMAGE = require('../assets/images/settings/rules-menu-panel-v2.png');
const SETTINGS_RULE_SLIDER_FRAME_WINCONDITION = require('../assets/images/settings/rules-slider-frame-wincondition.png');
const SETTINGS_RULE_SLIDER_FRAME_DIAGONAL = require('../assets/images/settings/rules-slider-frame-diagonal.png');
const SETTINGS_RULE_SLIDER_FRAME_DUTCH_ITEMS = require('../assets/images/settings/rules-slider-frame-dutch-items.png');
const SETTINGS_RULE_SLIDER_FRAME_CARD_LAYOUT = require('../assets/images/settings/rules-slider-frame-card-layout.png');
const SETTINGS_WIN_CONDITION_TITLE_ICON = require('../assets/images/settings/win-condition-title.png');
const SETTINGS_DIAGONAL_TITLE_ICON = require('../assets/images/settings/diagonal-rule-title.png');
const SETTINGS_CARD_LAYOUT_TITLE_ICON = require('../assets/images/settings/card-layout-title.png');
const SETTINGS_WIN_ONE_LINE = require('../assets/images/settings/win-1-line.png');
const SETTINGS_WIN_TWO_LINES = require('../assets/images/settings/win-2-lines.png');
const SETTINGS_WIN_FULL_CARD = require('../assets/images/settings/win-full-card.png');
const SETTINGS_DIAGONAL_ON = require('../assets/images/settings/diagonal-on.png');
const SETTINGS_DIAGONAL_OFF = require('../assets/images/settings/diagonal-off.png');
const SETTINGS_DUTCH_ITEMS_ON = require('../assets/images/settings/dutch-items-on.png');
const SETTINGS_DUTCH_ITEMS_OFF = require('../assets/images/settings/dutch-items-off.png');
const SETTINGS_DUTCH_ITEMS_TITLE = require('../assets/images/settings/dutch-items-title.png');
const SETTINGS_CARD_LAYOUT_SAME = require('../assets/images/settings/card-layout-same.png');
const SETTINGS_CARD_LAYOUT_DIFFERENT = require('../assets/images/settings/card-layout-different.png');
const CREATE_LOBBY_REVEAL_BLUE = '#1A7BD4';
const ANDROID_DISABLE_SETUP_IDLE_MOTION = Platform.OS === 'android';
const CONFIRM_CREATE_LOBBY_REVEAL_GREEN = '#159B3B';

function withAlpha(hexColor, alpha) {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return hexColor;
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function isEmbeddedThemeCard(themeId) {
  return (
    themeId === 'snelweg'
    || themeId === 'stad'
    || themeId === 'platteland'
    || themeId === 'vakantie'
    || themeId === 'voertuigen'
    || themeId === 'winter'
    || themeId === 'bergen'
    || themeId === 'verkeersborden'
  );
}

function getEmbeddedThemeTitleStyle(themeId) {
  if (themeId === 'verkeersborden') {
    return {
      color: '#111111',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(255, 255, 255, 0.52)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    };
  }

  return {
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: '#15539D',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };
}

function getEmbeddedThemeTitleScale(themeId) {
  if (themeId === 'verkeersborden') {
    return 0.48;
  }

  if (themeId === 'voertuigen') {
    return 0.8;
  }

  return themeId === 'platteland' ? 0.93 : 1;
}

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  outline: theme.cardOutline,
  premium: theme.premium,
}));
const PREMIUM_THEME_IDS = new Set(THEMES.filter((theme) => theme.premium).map((theme) => theme.id));

const GAME_MODE_CARDS = [
  {
    id: 'klassiek',
    title: 'Klassiek',
    subtitle: 'Iedereen speelt een eigen kaart.',
    requiresWifi: true,
  },
  {
    id: 'claim',
    title: 'Claim',
    subtitle: 'Claim vakjes live tegen elkaar.',
    requiresWifi: true,
  },
  {
    id: 'collectief',
    title: 'Collectief',
    subtitle: 'Werk samen op dezelfde voortgang.',
    requiresWifi: true,
  },
  {
    id: 'wegenkaart',
    title: 'Kaartcode',
    subtitle: 'Speel met dezelfde kaartcode, zonder wifi.',
    requiresWifi: false,
  },
];
const WIFI_GAME_MODE_CARDS = GAME_MODE_CARDS.filter((mode) => mode.requiresWifi);
const OFFLINE_GAME_MODE_CARDS = GAME_MODE_CARDS.filter((mode) => !mode.requiresWifi);
const GAME_MODE_PICKER_SEQUENCE = [
  'wifiIcon',
  'klassiek',
  'claim',
  'collectief',
  'offlineIcon',
  'wegenkaart',
];
const SETTINGS_WIN_OPTIONS = [
  { id: '1rij', label: '1 rij', image: SETTINGS_WIN_ONE_LINE },
  { id: '2rijen', label: '2 rijen', image: SETTINGS_WIN_TWO_LINES },
  { id: 'heel-blok', label: 'Hele kaart', image: SETTINGS_WIN_FULL_CARD },
];
const SETTINGS_DIAGONAL_OPTIONS = [
  { id: true, label: 'Wel', image: SETTINGS_DIAGONAL_ON },
  { id: false, label: 'Niet', image: SETTINGS_DIAGONAL_OFF },
];
const SETTINGS_DUTCH_OPTIONS = [
  { id: true, label: 'Wel Nederlandse items', image: SETTINGS_DUTCH_ITEMS_ON },
  { id: false, label: 'Geen Nederlandse items', image: SETTINGS_DUTCH_ITEMS_OFF },
];
const SETTINGS_CARD_LAYOUT_OPTIONS = [
  { id: 'zelfde', label: 'Zelfde kaart', image: SETTINGS_CARD_LAYOUT_SAME },
  { id: 'anders', label: 'Andere kaarten', image: SETTINGS_CARD_LAYOUT_DIFFERENT },
];
const GAME_SETTINGS_KLAP_IN_SOUND = 'gameSettingsKlapIn';
const GAME_SETTINGS_KLAP_UIT_SOUND = 'gameSettingsKlapUit';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function measureViewCenter(ref, fallback) {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node?.measureInWindow) {
      resolve(fallback);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: x + width / 2,
        y: y + height / 2,
      });
    });
  });
}

export default function HostSetupScreen({ navigation }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(screenWidth, screenHeight);
  const { isPremium } = usePremium();
  const { settings } = useAppSettings();
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [selectedGameModeIndex, setSelectedGameModeIndex] = useState(0);
  const [gameModePickerOpen, setGameModePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [wincondition, setWincondition] = useState('1rij');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');
  const [nederlands, setNederlands] = useState(true);
  const [gameRulePreferencesLoaded, setGameRulePreferencesLoaded] = useState(false);
  const [createLobbyConfirmVisible, setCreateLobbyConfirmVisible] = useState(false);
  const [connectionErrorVisible, setConnectionErrorVisible] = useState(false);
  const [createLobbyReveal, setCreateLobbyReveal] = useState(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [hostLayoutReady, setHostLayoutReady] = useState(false);
  const [hostAssetsReady, setHostAssetsReady] = useState(false);
  const [settingsScrollMetrics, setSettingsScrollMetrics] = useState({ contentHeight: 0, viewportHeight: 0 });

  const scale = clamp(Math.min(screenWidth / 430, screenHeight / 932), 0.88, isTablet ? 1.34 : 1.18);
  const collapsedPanelHeight = Math.round(clamp(screenHeight * (isTablet ? 0.09 : 0.078), 66, isTablet ? 118 : 88));
  const expandedPanelHeight = Math.round(clamp(screenHeight * (isTablet ? 0.79 : 0.74), isTablet ? 720 : 560, screenHeight * 0.86));
  const setupMetrics = useMemo(() => {
    const horizontalPadding = Math.round(clamp(screenWidth * 0.058, 20, 64));

    const themeCardWidth = Math.round(clamp(screenWidth * (isTablet ? 0.39 : 0.45), 194, isTablet ? 350 : 250));
    const bottomSafeAreaEstimate = screenHeight >= 812
      ? Math.round(clamp(screenHeight * 0.034, 24, 34))
      : 0;

    return {
      scale,
      horizontalPadding,
      contentTop: Platform.OS === 'android'
        ? Math.round(clamp(screenHeight * (isTablet ? 0.042 : 0.047), 34, isTablet ? 72 : 54))
        : Math.round(clamp(screenHeight * 0.018, 12, 28)),
      contentBottom: Math.max(0, collapsedPanelHeight - bottomSafeAreaEstimate),
      titleMarginTop: Math.round(clamp(screenHeight * 0.011, 8, 14)),
      titleMarginBottom: Math.round(clamp(screenHeight * 0.006, 5, 8)),
      pageTitleMarginBottom: Math.round(clamp(screenHeight * 0.013, 10, 16)),
      topBlockMarginTop: Math.round(clamp(screenHeight * 0.004, 2, 6)),
      selectedGameModeMarginTop: Math.round(clamp(screenHeight * 0.003, 2, 5)),
      selectedGameModeHeight: Math.round(clamp(screenHeight * (isTablet ? 0.18 : 0.148), 126, isTablet ? 240 : 170)),
      selectedGameModeWidth: isTablet ? '72%' : '58%',
      themeCardWidth,
      themeCardHeight: Math.round(clamp(themeCardWidth * 1.17, 230, isTablet ? 430 : 320)),
      carouselSpacing: Math.round(clamp(screenWidth * (isTablet ? 0.034 : 0.024), 8, isTablet ? 30 : 16)),
      actionButtonHeight: Math.round(clamp(screenHeight * (isTablet ? 0.098 : 0.082), 68, isTablet ? 124 : 92)),
      actionButtonPadding: Math.round(clamp(screenWidth * 0.11, 42, 76)),
      panelContentPaddingHorizontal: Math.round(clamp(screenWidth * 0.052, 20, 48)),
      panelContentPaddingTop: Math.round(clamp(screenHeight * 0.013, 10, 18)),
      panelContentPaddingBottom: Math.round(clamp(screenHeight * 0.024, 20, 34)),
      pickerPaddingHorizontal: Math.round(clamp(screenWidth * 0.047, 18, 52)),
      pickerPaddingTop: Math.round(clamp(screenHeight * 0.084, 64, 94)) + Math.round(8 * scale),
      pickerPaddingBottom: Math.round(clamp(screenHeight * 0.099, 78, 112)),
      pickerGap: Math.round(clamp(screenHeight * 0.017, 13, 20)),
      pickerPanelToChoiceGap: Math.round(10 * scale),
      pickerChoiceGap: Math.round(clamp(screenWidth * 0.033, 12, 20)),
      pickerIconWidth: Math.round(clamp(screenWidth * 0.274, 106, 142)),
      pickerIconHeight: Math.round(clamp(screenHeight * 0.137, 116, 152)),
      pickerStatusPanelWidth: Math.round(clamp(screenWidth * 0.70, 268, 326)),
      pickerStatusPanelHeight: Math.round(clamp(screenWidth * 0.70 / (1672 / 941), 150, 184)),
      pickerStatusPanelIconSize: Math.round(clamp(screenWidth * 0.235, 90, 112)),
      pickerChoiceHeight: Math.round(clamp(screenHeight * (isTablet ? 0.175 : 0.133), 114, isTablet ? 244 : 156)),
      pickerFeaturedChoiceHeight: Math.round(clamp(screenHeight * (isTablet ? 0.188 : 0.144), 124, isTablet ? 262 : 170)),
      backButtonSize: Math.round(clamp(screenWidth * (isTablet ? 0.105 : 0.13), 54, isTablet ? 88 : 66)),
      backButtonInset: Math.round(clamp(screenWidth * 0.037, 14, isTablet ? 34 : 24)),
      settingsPillIconSize: Math.round(clamp(screenWidth * 0.052, 20, 30)),
      settingsTileSize: Math.round(clamp(screenWidth * 0.22, 78, 118)),
      settingsTileImageSize: Math.round(clamp(screenWidth * 0.16, 58, 86)),
      settingsDiagonalTileSize: Math.round(clamp(screenWidth * 0.23, 84, 124)),
      settingsDiagonalImageSize: Math.round(clamp(screenWidth * 0.17, 64, 92)),
      settingsLabelFontSize: Math.round(clamp(screenWidth * 0.045, 17, 24)),
      settingsTitleIconSize: Math.round(clamp(screenWidth * 0.118, 46, isTablet ? 88 : 66)),
      settingsSliderHeight: Math.round(clamp(screenHeight * (isTablet ? 0.18 : 0.156), 126, isTablet ? 210 : 156)),
      settingsSliderImageSize: Math.round(clamp(screenWidth * 0.155, 58, isTablet ? 108 : 78)),
      settingsSliderDiagonalImageSize: Math.round(clamp(screenWidth * 0.178, 68, isTablet ? 124 : 92)),
      settingsPillFontSize: Math.round(clamp(screenWidth * 0.035, 14, isTablet ? 25 : 19)),
      settingsSectionGap: Math.round(clamp(screenHeight * (isTablet ? 0.046 : 0.038), 28, isTablet ? 64 : 42)),
      settingsOptionGap: Math.round(clamp(screenWidth * 0.05, 18, 34)),
      isTablet,
      tabletScale,
    };
  }, [collapsedPanelHeight, isTablet, scale, screenHeight, screenWidth, tabletScale]);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const settingsProgress = useRef(new Animated.Value(0)).current;
  const settingsScrollY = useRef(new Animated.Value(0)).current;
  const gameModePickerOpacity = useRef(new Animated.Value(0)).current;
  const gameModeMotionProgress = useRef(new Animated.Value(0)).current;
  const createLobbyConfirmProgress = useRef(new Animated.Value(0)).current;
  const gameModePickerItemProgress = useRef(
    GAME_MODE_CARDS.reduce((acc, mode) => ({
      ...acc,
      [mode.id]: new Animated.Value(0),
    }), {
      wifiIcon: new Animated.Value(0),
      offlineIcon: new Animated.Value(0),
    })
  ).current;
  const setupGameModeCardRef = useRef(null);
  const createLobbyButtonRef = useRef(null);
  const confirmCreateLobbyButtonRef = useRef(null);
  const createLobbyRevealRef = useRef(null);
  const gameModeChoiceRefs = useRef({});
  const [gameModeMotion, setGameModeMotion] = useState(null);
  const [gameModePickerExiting, setGameModePickerExiting] = useState(false);
  const [hiddenGameModeChoiceId, setHiddenGameModeChoiceId] = useState(null);
  const [setupGameModeDetached, setSetupGameModeDetached] = useState(false);
  const selectedTheme = THEME_CARDS[selectedThemeIndex] ?? THEME_CARDS[0];
  const selectedGameMode = GAME_MODE_CARDS[selectedGameModeIndex] ?? GAME_MODE_CARDS[0];
  const liveSyncEnabled = selectedGameMode?.requiresWifi ?? true;
  const isCardCodeMode = selectedGameMode?.id === 'wegenkaart';
  const showWinAndDiagonalRuleSettings = (
    selectedGameMode?.id === 'klassiek'
    || selectedGameMode?.id === 'wegenkaart'
    || selectedGameMode?.id === 'collectief'
  );
  const showCardLayoutRuleSettings = selectedGameMode?.id === 'klassiek' || selectedGameMode?.id === 'wegenkaart';
  const selectedThemeLocked = Boolean(selectedTheme?.id && PREMIUM_THEME_IDS.has(selectedTheme.id) && !isPremium);
  const selectedThemeAvailable = !selectedThemeLocked;

  const canGenerate = useMemo(
    () => Boolean(selectedTheme?.id && selectedThemeAvailable && selectedGameMode?.id),
    [selectedGameMode?.id, selectedTheme?.id, selectedThemeAvailable]
  );
  const settingsPanelTranslateY = settingsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedPanelHeight - collapsedPanelHeight - Math.round(20 * scale), 0],
  });
  const settingsContentTranslateY = settingsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const settingsScrollbarVisible = settingsScrollMetrics.contentHeight > settingsScrollMetrics.viewportHeight + 10;
  const settingsScrollbarTrackHeight = Math.max(0, settingsScrollMetrics.viewportHeight - Math.round(22 * scale));
  const settingsScrollbarThumbHeight = settingsScrollbarVisible
    ? Math.max(
        Math.round(34 * scale),
        (settingsScrollbarTrackHeight * settingsScrollMetrics.viewportHeight) / settingsScrollMetrics.contentHeight
      )
    : 0;
  const settingsScrollbarTranslateY = settingsScrollY.interpolate({
    inputRange: [0, Math.max(1, settingsScrollMetrics.contentHeight - settingsScrollMetrics.viewportHeight)],
    outputRange: [0, Math.max(0, settingsScrollbarTrackHeight - settingsScrollbarThumbHeight)],
    extrapolate: 'clamp',
  });
  const handleHostWarmupReady = useCallback(() => {
    setHostAssetsReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(GAME_RULE_PREFERENCES_STORAGE_KEY).then((storedValue) => {
      if (cancelled) {
        return;
      }

      const preferences = parseStoredGameRulePreferences(storedValue);
      setWincondition(preferences.wincondition);
      setDiagonaal(preferences.diagonaal);
      setKaartOpzet(preferences.kaartOpzet);
      setNederlands(preferences.nederlands);
      setGameRulePreferencesLoaded(true);
    }).catch(() => {
      if (!cancelled) {
        setGameRulePreferencesLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gameRulePreferencesLoaded) {
      return;
    }

    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences({ wincondition, diagonaal, kaartOpzet, nederlands })
    );
  }, [diagonaal, gameRulePreferencesLoaded, kaartOpzet, nederlands, wincondition]);

  useEffect(() => {
    if (!hostLayoutReady || !hostAssetsReady) {
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
  }, [hostAssetsReady, hostLayoutReady, navigation]);

  useEffect(() => {
    if (!createLobbyConfirmVisible) {
      createLobbyConfirmProgress.setValue(0);
      return;
    }

    createLobbyConfirmProgress.setValue(0);
    Animated.spring(createLobbyConfirmProgress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [createLobbyConfirmProgress, createLobbyConfirmVisible]);

  useEffect(() => {
    if (!createLobbyReveal) {
      return;
    }

    requestAnimationFrame(() => {
      createLobbyRevealRef.current?.reveal();
    });
  }, [createLobbyReveal]);

  useEffect(() => {
    panelHeight.setValue(expandedPanelHeight);
    settingsProgress.setValue(settingsOpen ? 1 : 0);
  }, [collapsedPanelHeight, expandedPanelHeight, panelHeight]);

  useEffect(() => {
    preloadSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND);
    preloadSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND);
  }, []);

  function animateSettings(open) {
    if (open) {
      setSettingsPanelVisible(true);
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
    }

    Animated.parallel([
      Animated.timing(settingsProgress, {
        toValue: open ? 1 : 0,
        duration: open ? 440 : 420,
        easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 300 : 360,
        easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished && !open) {
        settingsProgress.setValue(0);
        backdropOpacity.setValue(0);
        setSettingsPanelVisible(false);
      }
    });
  }

  function openSettings() {
    void Haptics.selectionAsync();
    void playSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND, settings);
    animateSettings(true);
  }

  function closeSettings() {
    void playSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND, settings);
    animateSettings(false);
  }

  function measureNode(node) {
    return new Promise((resolve) => {
      if (!node?.measureInWindow) {
        resolve(null);
        return;
      }

      node.measureInWindow((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    });
  }

  function animateGameModeMotion({ mode, from, to, duration = 360, onComplete }) {
    if (!from || !to) {
      onComplete?.();
      return;
    }

    gameModeMotionProgress.stopAnimation();
    gameModeMotionProgress.setValue(0);
    setGameModeMotion({ mode, from, to });

    Animated.timing(gameModeMotionProgress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setGameModeMotion(null);
        onComplete?.();
      }
    });
  }

  function stageGameModeMotion({ mode, from, to }) {
    if (!from || !to) {
      return false;
    }

    gameModeMotionProgress.stopAnimation();
    gameModeMotionProgress.setValue(0);
    setGameModeMotion({ mode, from, to });
    return true;
  }

  function playStagedGameModeMotion({ duration = 420, onComplete }) {
    Animated.timing(gameModeMotionProgress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setGameModeMotion(null);
        onComplete?.();
      }
    });
  }

  function animateGameModePickerItemsOut(keptModeId) {
    return new Promise((resolve) => {
      const exitAnimations = GAME_MODE_PICKER_SEQUENCE
        .filter((key) => key !== keptModeId)
        .reverse()
        .map((key) => Animated.timing(gameModePickerItemProgress[key], {
          toValue: 0,
          duration: 190,
          useNativeDriver: true,
        }));

      Animated.stagger(42, exitAnimations).start(() => {
        resolve();
      });
    });
  }

  function openGameModePicker() {
    if (gameModeMotion || gameModePickerExiting) {
      return;
    }

    void Haptics.selectionAsync();
    if (settingsOpen) {
      closeSettings();
    }

    setGameModePickerOpen(true);
    setSetupGameModeDetached(false);
    gameModePickerOpacity.setValue(0);
    setHiddenGameModeChoiceId(selectedGameMode.id);
    Object.values(gameModePickerItemProgress).forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });
    gameModePickerItemProgress[selectedGameMode.id]?.setValue(1);

    Animated.timing(gameModePickerOpacity, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      68,
      GAME_MODE_PICKER_SEQUENCE
        .filter((key) => key !== selectedGameMode.id)
        .map((key) => Animated.timing(gameModePickerItemProgress[key], {
          toValue: 1,
          duration: 285,
          useNativeDriver: true,
        }))
    ).start();

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        const from = await measureNode(setupGameModeCardRef.current);
        const to = await measureNode(gameModeChoiceRefs.current[selectedGameMode.id]);

        animateGameModeMotion({
          mode: selectedGameMode,
          from,
          to,
          duration: 420,
          onComplete: () => {
            gameModePickerItemProgress[selectedGameMode.id]?.setValue(1);
            setHiddenGameModeChoiceId(null);
          },
        });
        requestAnimationFrame(() => {
          setSetupGameModeDetached(true);
        });
      });
    });
  }

  function closeGameModePicker(force = false) {
    if (!force && (gameModeMotion || gameModePickerExiting)) {
      return;
    }

    Animated.timing(gameModePickerOpacity, {
      toValue: 0,
      duration: 230,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setGameModePickerOpen(false);
        setGameModeMotion(null);
        setHiddenGameModeChoiceId(null);
        setGameModePickerExiting(false);
        setSetupGameModeDetached(false);
      }
    });
  }

  function closeGameModePickerWithReturn() {
    if (gameModeMotion || gameModePickerExiting) {
      return;
    }

    void Haptics.selectionAsync();
    setGameModePickerExiting(true);

    requestAnimationFrame(async () => {
      const mode = selectedGameMode;
      const from = await measureNode(gameModeChoiceRefs.current[mode.id]);
      const to = await measureNode(setupGameModeCardRef.current);

      if (!stageGameModeMotion({ mode, from, to })) {
        closeGameModePicker(true);
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gameModePickerItemProgress[mode.id]?.stopAnimation();
          gameModePickerItemProgress[mode.id]?.setValue(0);
          setHiddenGameModeChoiceId(mode.id);
          void animateGameModePickerItemsOut(mode.id);
          playStagedGameModeMotion({
            duration: 460,
            onComplete: () => {
              setSetupGameModeDetached(false);
              requestAnimationFrame(() => {
                setGameModeMotion(null);
                closeGameModePicker(true);
              });
            },
          });
        });
      });
    });
  }

  function selectGameMode(modeId) {
    if (gameModeMotion || gameModePickerExiting) {
      return;
    }

    const nextIndex = GAME_MODE_CARDS.findIndex((mode) => mode.id === modeId);

    if (nextIndex < 0) {
      return;
    }

    if (nextIndex === selectedGameModeIndex) {
      closeGameModePickerWithReturn();
      return;
    }

    void Haptics.selectionAsync();
    setGameModePickerExiting(true);

    requestAnimationFrame(async () => {
      const nextMode = GAME_MODE_CARDS[nextIndex];
      const from = await measureNode(gameModeChoiceRefs.current[modeId]);
      const to = await measureNode(setupGameModeCardRef.current);

      if (!stageGameModeMotion({ mode: nextMode, from, to })) {
        setSelectedGameModeIndex(nextIndex);
        closeGameModePicker(true);
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gameModePickerItemProgress[modeId]?.stopAnimation();
          gameModePickerItemProgress[modeId]?.setValue(0);
          setHiddenGameModeChoiceId(modeId);
          void animateGameModePickerItemsOut(modeId);
          playStagedGameModeMotion({
            duration: 460,
            onComplete: () => {
              setSelectedGameModeIndex(nextIndex);
              setSetupGameModeDetached(false);
              requestAnimationFrame(() => {
                setGameModeMotion(null);
                closeGameModePicker(true);
              });
            },
          });
        });
      });
    });
  }

  async function handleGenerateCode() {
    if (!isPremium || !selectedThemeAvailable) {
      setPremiumModalVisible(true);
      return;
    }

    if (!canGenerate || createLobbyConfirmVisible || createLobbyReveal) {
      return;
    }

    setCreateLobbyConfirmVisible(true);
  }

  async function handleConfirmCreateLobbyPress(event) {
    if (!canGenerate || createLobbyReveal) {
      return;
    }

    const syncType = liveSyncEnabled ? 'live' : 'geen';
    const seed = Math.floor(Math.random() * 2 ** 16);
    const salt = Math.floor(Math.random() * 2 ** LOBBY_CODE_SALT_ENTROPY_BITS);
    const lobbyCode = generateLobbyCode({
      thema: selectedTheme.id,
      gameMode: selectedGameMode.id,
      syncType: syncType === 'live' ? 'live' : 'offline',
      seed,
      salt,
      wincondition,
      diagonaal,
      kaartOpzet,
      nederlands,
    });
    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences({ wincondition, diagonaal, kaartOpzet, nederlands })
    );

    const [storedEquippedSkin, storedPreferredName] = await Promise.all([
      AsyncStorage.getItem(EQUIPPED_SKIN_STORAGE_KEY),
      AsyncStorage.getItem(PREFERRED_PLAYER_NAME_STORAGE_KEY),
    ]);
    const hostPlayer = createPlayer({
      naam: normalizeCustomPlayerName(storedPreferredName),
      skin: SKIN_OPTIONS.includes(storedEquippedSkin) ? storedEquippedSkin : 'rood',
    });

    const config = createGameConfig({
      thema: selectedTheme.id,
      wincondition,
      diagonaal,
      kaartOpzet,
      nederlands,
      modus: selectedGameMode.id,
      syncType,
      lobbyCode,
      seed,
      salt,
      aantalSpelersOpDitApparaat: 1,
      zichtbaarheid: liveSyncEnabled
        ? { ...DEFAULT_ZICHTBAARHEID }
        : { eigenVoortgang: false, andermansVoortgang: false },
      spelers: [hostPlayer],
    });

    const origin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : await measureViewCenter(confirmCreateLobbyButtonRef, {
        x: screenWidth / 2,
        y: screenHeight / 2,
      });

    const liveLobbySetupPromise = liveSyncEnabled
      ? ensureLobby({
          code: lobbyCode,
          config,
          hostPlayer,
          resetExisting: true,
        }).catch(() => null)
      : Promise.resolve(null);

    setCreateLobbyReveal({
      config,
      liveLobbySetupPromise,
      originX: origin.x,
      originY: origin.y,
      transitionKey: `host-lobby-${Date.now()}`,
    });
  }

  return (
    <View
      style={styles.safeArea}
      onLayout={() => setHostLayoutReady(true)}
    >
      <WarmupImages
        assets={HOST_ASSETS}
        timeoutMs={null}
        imageSize={128}
        batchSize={16}
        onReady={handleHostWarmupReady}
      />
      <ImageBackground
        source={GAME_SETUP_BACKGROUND}
        resizeMode="cover"
        style={styles.background}
      >
        <SafeAreaView style={styles.safeAreaContent}>
          <AnimatedRouteBackButton
            navigation={navigation}
            size={setupMetrics.backButtonSize}
            style={[
              styles.backButton,
              {
                left: setupMetrics.backButtonInset,
                top: setupMetrics.backButtonInset,
              },
            ]}
          />
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: setupMetrics.horizontalPadding,
                paddingTop: setupMetrics.contentTop,
                paddingBottom: setupMetrics.contentBottom,
              },
            ]}
          >
            <TitleBlock label="Bingo Thema" metrics={setupMetrics} />
            <View
              style={[
                styles.topBlock,
                {
                  marginHorizontal: -setupMetrics.horizontalPadding,
                  marginTop: setupMetrics.topBlockMarginTop,
                },
              ]}
            >
              <ThemeCarousel
                items={THEME_CARDS}
                itemSpacing={setupMetrics.carouselSpacing}
                itemWidth={setupMetrics.themeCardWidth}
                keyExtractor={(item) => item.id}
                loop
                focusedIndex={selectedThemeIndex}
                onSnapToItem={setSelectedThemeIndex}
                renderCard={({ item }) => (
                  <ThemeCard
                    item={item}
                    metrics={setupMetrics}
                    isPremium={isPremium}
                    onLockedPress={() => setPremiumModalVisible(true)}
                  />
                )}
              />
            </View>

            <TitleBlock label="Gamemode" metrics={setupMetrics} />
            <Pressable
              ref={setupGameModeCardRef}
              collapsable={false}
              onPress={openGameModePicker}
              style={[
                styles.selectedGameModeCard,
                {
                  height: setupMetrics.selectedGameModeHeight,
                  marginTop: setupMetrics.selectedGameModeMarginTop,
                  width: setupMetrics.selectedGameModeWidth,
                },
                setupGameModeDetached && styles.selectedGameModeCardHidden,
              ]}
            >
              <GameModeCardArt mode={selectedGameMode} selected setupPreview={setupMetrics.isTablet} />
            </Pressable>

            <View style={styles.actionRail}>
              <View
                ref={createLobbyButtonRef}
                collapsable={false}
                style={styles.actionStack}
              >
                <GlossyButton
                  label={isCardCodeMode ? 'Maak kaartcode aan' : 'Maak lobby aan'}
                  variant="blue"
                  size="large"
                  heightOverride={setupMetrics.actionButtonHeight}
                  horizontalPadding={setupMetrics.actionButtonPadding}
                  onPress={handleGenerateCode}
                  disabled={!canGenerate || !selectedThemeAvailable || createLobbyConfirmVisible || Boolean(createLobbyReveal)}
                />
              </View>
            </View>
          </View>

          {settingsPanelVisible ? (
            <View pointerEvents={settingsOpen ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
              <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
              </Animated.View>
            </View>
          ) : null}
        </SafeAreaView>

        <View pointerEvents="box-none" style={styles.bottomDock}>
          <Animated.View
            pointerEvents={settingsPanelVisible ? 'auto' : 'none'}
            style={[
              styles.panelShell,
              settingsPanelVisible ? styles.panelShellOpen : styles.panelShellClosed,
              {
                height: expandedPanelHeight,
                transform: [{ translateY: settingsPanelTranslateY }],
              },
            ]}
          >
            <ImageBackground
              pointerEvents="none"
              source={SETTINGS_RULES_PANEL_IMAGE}
              resizeMode={setupMetrics.isTablet ? 'contain' : 'stretch'}
              style={[
                styles.rulesPanelImage,
                setupMetrics.isTablet && styles.rulesPanelImageTablet,
              ]}
              imageStyle={styles.rulesPanelImageAsset}
            />
            <Pressable
              onPress={settingsOpen ? closeSettings : openSettings}
              style={[
                styles.panelHeader,
                { minHeight: collapsedPanelHeight },
                settingsPanelVisible ? styles.panelHeaderOpen : styles.panelHeaderClosed,
              ]}
            >
              <Text style={styles.panelHeaderText}>Spelregels</Text>
            </Pressable>

            <Animated.View
              pointerEvents={settingsOpen ? 'auto' : 'none'}
              style={[
                styles.panelContent,
                {
                  opacity: settingsProgress,
                  paddingHorizontal: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  transform: [{ translateY: settingsContentTranslateY }],
                },
              ]}
            >
              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.settingsMenuScroll}
                contentContainerStyle={[styles.settingsMenuBody, { gap: setupMetrics.settingsSectionGap }]}
                scrollEventThrottle={Platform.OS === 'android' ? 32 : 16}
                removeClippedSubviews={Platform.OS === 'android'}
                onLayout={(event) => {
                  const viewportHeight = event.nativeEvent.layout.height;
                  setSettingsScrollMetrics((current) => (
                    current.viewportHeight === viewportHeight
                      ? current
                      : { ...current, viewportHeight }
                  ));
                }}
                onContentSizeChange={(_, contentHeight) => {
                  setSettingsScrollMetrics((current) => (
                    current.contentHeight === contentHeight
                      ? current
                      : { ...current, contentHeight }
                  ));
                }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: settingsScrollY } } }],
                  { useNativeDriver: true }
                )}
              >
                {showWinAndDiagonalRuleSettings ? (
                  <>
                    <SettingsRuleSlider
                      title="Winconditie"
                      titleIcon={SETTINGS_WIN_CONDITION_TITLE_ICON}
                      value={wincondition}
                      options={SETTINGS_WIN_OPTIONS}
                      onChange={setWincondition}
                      metrics={setupMetrics}
                    />

                    <SettingsRuleSlider
                      title="Diagonaal"
                      titleIcon={SETTINGS_DIAGONAL_TITLE_ICON}
                      value={diagonaal}
                      options={SETTINGS_DIAGONAL_OPTIONS}
                      onChange={setDiagonaal}
                      metrics={setupMetrics}
                      variant="diagonal"
                    />
                  </>
                ) : null}

                <SettingsRuleSlider
                  title="Nederlands"
                  titleIcon={SETTINGS_DUTCH_ITEMS_TITLE}
                  value={nederlands}
                  options={SETTINGS_DUTCH_OPTIONS}
                  onChange={setNederlands}
                  metrics={setupMetrics}
                  variant="dutch"
                />

                {showCardLayoutRuleSettings ? (
                  <SettingsRuleSlider
                    title="Kaarten"
                    titleIcon={SETTINGS_CARD_LAYOUT_TITLE_ICON}
                    value={kaartOpzet}
                    options={SETTINGS_CARD_LAYOUT_OPTIONS}
                    onChange={setKaartOpzet}
                    metrics={setupMetrics}
                    variant="cardLayout"
                  />
                ) : null}
              </Animated.ScrollView>
              {settingsScrollbarVisible ? (
                <View pointerEvents="none" style={styles.settingsScrollbarTrack}>
                  <Animated.View
                    style={[
                      styles.settingsScrollbarThumb,
                      {
                        height: settingsScrollbarThumbHeight,
                        transform: [{ translateY: settingsScrollbarTranslateY }],
                      },
                    ]}
                  />
                </View>
              ) : null}
            </Animated.View>
          </Animated.View>
          {!settingsPanelVisible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open spelregels"
              onPress={openSettings}
              style={[
                styles.collapsedPanelPressTarget,
                { height: collapsedPanelHeight + Math.round(24 * scale) },
              ]}
            />
          ) : null}
        </View>
        {gameModePickerOpen ? (
          <Animated.View style={[styles.gameModePickerLayer, { opacity: gameModePickerOpacity }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeGameModePickerWithReturn}
            />
            <View
              pointerEvents="box-none"
              style={[
                styles.gameModePickerContent,
                {
                  paddingHorizontal: setupMetrics.pickerPaddingHorizontal,
                  paddingTop: setupMetrics.pickerPaddingTop,
                  paddingBottom: setupMetrics.pickerPaddingBottom,
                  gap: setupMetrics.pickerGap,
                },
              ]}
            >
              <GameModePickerSection
                icon={WIFI_REQUIRED_IMAGE}
                modes={WIFI_GAME_MODE_CARDS}
                selectedModeId={selectedGameMode.id}
                hiddenModeId={hiddenGameModeChoiceId}
                choiceRefs={gameModeChoiceRefs}
                itemProgress={gameModePickerItemProgress}
                onSelect={selectGameMode}
                variant="wifi"
                metrics={setupMetrics}
              />
              <GameModePickerSection
                icon={WIFI_NOT_REQUIRED_IMAGE}
                modes={OFFLINE_GAME_MODE_CARDS}
                selectedModeId={selectedGameMode.id}
                hiddenModeId={hiddenGameModeChoiceId}
                choiceRefs={gameModeChoiceRefs}
                itemProgress={gameModePickerItemProgress}
                onSelect={selectGameMode}
                variant="offline"
                metrics={setupMetrics}
              />
            </View>
            {gameModeMotion ? (
              <MovingGameModeCard motion={gameModeMotion} progress={gameModeMotionProgress} />
            ) : null}
          </Animated.View>
        ) : null}
      </ImageBackground>
      <Modal
        visible={createLobbyConfirmVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          if (!createLobbyReveal) {
            setCreateLobbyConfirmVisible(false);
          }
        }}
      >
        <View style={styles.confirmBackdrop}>
          <Animated.View
            style={{
              opacity: createLobbyConfirmProgress,
              transform: [
                {
                  scale: createLobbyConfirmProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            }}
          >
            <PopupPanel
              title={isCardCodeMode ? 'Kaartcode aanmaken' : 'Lobby aanmaken'}
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label="Nee"
                      variant="red"
                      onPress={() => setCreateLobbyConfirmVisible(false)}
                      disabled={Boolean(createLobbyReveal)}
                      heightOverride={setupMetrics.isTablet ? 84 : 54}
                      horizontalPadding={setupMetrics.isTablet ? 38 : 18}
                      labelFontScale={setupMetrics.isTablet ? 1.18 : 1}
                    />
                  </View>
                  <View
                    ref={confirmCreateLobbyButtonRef}
                    collapsable={false}
                    style={styles.confirmGlossyButton}
                  >
                    <GlossyButton
                      label="Ja"
                      variant="green"
                      onPress={(event) => {
                        void handleConfirmCreateLobbyPress(event);
                      }}
                      soundEffectName="onlineHornMode"
                      disabled={Boolean(createLobbyReveal)}
                      heightOverride={setupMetrics.isTablet ? 84 : 54}
                      horizontalPadding={setupMetrics.isTablet ? 38 : 18}
                      labelFontScale={setupMetrics.isTablet ? 1.18 : 1}
                    />
                  </View>
                </>
              )}
            >
              {isCardCodeMode
                ? 'Weet je zeker dat je deze kaartcode wilt aanmaken?'
                : 'Weet je zeker dat je deze lobby wilt aanmaken?'}
            </PopupPanel>
          </Animated.View>
          {createLobbyReveal ? (
            <CircularReveal
              key={createLobbyReveal.transitionKey}
              ref={createLobbyRevealRef}
              color={CONFIRM_CREATE_LOBBY_REVEAL_GREEN}
              originX={createLobbyReveal.originX}
              originY={createLobbyReveal.originY}
              onComplete={async () => {
                const setupSnapshot = await createLobbyReveal.liveLobbySetupPromise;
                if (liveSyncEnabled && !setupSnapshot) {
                  setCreateLobbyConfirmVisible(false);
                  setCreateLobbyReveal(null);
                  setConnectionErrorVisible(true);
                  return;
                }

                const lobbyConfig = setupSnapshot
                  ? {
                      ...createLobbyReveal.config,
                      liveLobbyPlayers: setupSnapshot.players ?? [],
                      startedAt: setupSnapshot.startedAt ?? null,
                    }
                  : createLobbyReveal.config;

                navigation.navigate('Lobby', {
                  config: lobbyConfig,
                  transition: {
                    color: CONFIRM_CREATE_LOBBY_REVEAL_GREEN,
                    originX: screenWidth / 2,
                    originY: screenHeight / 2,
                    routeName: 'Lobby',
                    pauseMs: 0,
                    minSolidMs: 420,
                    settleMs: 180,
                    preloaded: true,
                    transitionKey: createLobbyReveal.transitionKey,
                  },
                });
                setCreateLobbyConfirmVisible(false);
                setTimeout(() => {
                  setCreateLobbyReveal(null);
                }, 80);
              }}
            />
          ) : null}
        </View>
      </Modal>
      <PremiumPaywallModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUnlocked={() => setPremiumModalVisible(false)}
        title="Premium nodig"
        message="Met Premium kun je lobby’s hosten en alle premium thema’s gebruiken. Joinen blijft gratis."
      />
      <Modal
        visible={connectionErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConnectionErrorVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <PopupPanel
            title="Online lobby niet aangemaakt"
            fontFamily="FredokaOne_400Regular"
            compact
            actionsStyle={styles.connectionErrorActions}
            actions={(
              <View style={styles.confirmGlossyButton}>
                <GlossyButton
                  label="Oké"
                  variant="green"
                  heightOverride={setupMetrics.isTablet ? 74 : 52}
                  horizontalPadding={setupMetrics.isTablet ? 38 : 26}
                  labelFontScale={setupMetrics.isTablet ? 1 : 0.92}
                  onPress={() => setConnectionErrorVisible(false)}
                />
              </View>
            )}
          >
            De online lobby kon niet worden aangemaakt. Probeer het nog een keer.
          </PopupPanel>
        </View>
      </Modal>
    </View>
  );
}

function ThemeCard({ item, metrics, isPremium = false, onLockedPress }) {
  const themeImage = getThemeCardImage(item.id);
  const isLocked = item.premium && !isPremium;
  const usesEmbeddedFrame = isEmbeddedThemeCard(item.id);
  const cardBorderColor = item.outline ?? item.border;
  const cardBodyStyle = {
    width: metrics.themeCardWidth,
    height: usesEmbeddedFrame ? Math.round(metrics.themeCardWidth * 1.5) : metrics.themeCardHeight,
  };
  const titleStyle = usesEmbeddedFrame
    ? [
        styles.carouselCardTitleWrapEmbedded,
        metrics.isTablet && styles.carouselCardTitleWrapEmbeddedTablet,
        item.id === 'verkeersborden' && styles.carouselCardTitleWrapEmbeddedWide,
      ]
    : {
        top: Math.round((metrics.isTablet ? 34 : 26) * metrics.scale),
        left: Math.round(12 * metrics.scale),
        right: Math.round(12 * metrics.scale),
      };
  const titleScale = getEmbeddedThemeTitleScale(item.id);
  const isTrafficSignsTitle = item.id === 'verkeersborden';
  const isLongThemeTitle = item.id === 'platteland';
  const titleTextStyle = {
    fontSize: Math.round((usesEmbeddedFrame ? 32 : 28) * metrics.scale * titleScale),
    lineHeight: Math.round((isTrafficSignsTitle ? 34 : usesEmbeddedFrame ? 42 : 34) * metrics.scale * titleScale),
    ...(usesEmbeddedFrame ? { width: '100%' } : null),
    ...(usesEmbeddedFrame ? getEmbeddedThemeTitleStyle(item.id) : { color: '#ffffff' }),
  };

  return (
    <View style={styles.carouselCardShell}>
      <View
        style={[
          styles.carouselCardOutline,
          usesEmbeddedFrame
            ? styles.carouselCardOutlineEmbedded
            : { borderColor: isLocked ? withAlpha(cardBorderColor, 0.42) : cardBorderColor },
        ]}
      >
        {themeImage ? (
          <View
            style={[
              styles.carouselCardBody,
              usesEmbeddedFrame && styles.carouselCardBodyEmbedded,
              cardBodyStyle,
            ]}
          >
            <ExpoImage
              source={themeImage}
              contentFit={usesEmbeddedFrame ? 'contain' : 'cover'}
              cachePolicy="memory-disk"
              transition={0}
              style={[
                styles.carouselCardImageFill,
                styles.carouselCardImage,
                usesEmbeddedFrame && styles.carouselCardImageEmbedded,
              ]}
            />
            {usesEmbeddedFrame ? null : <View style={styles.carouselCardOverlay} />}
            {isLocked ? <View style={styles.carouselCardLockedDim} /> : null}
            {isLocked ? (
              <View pointerEvents="none" style={styles.carouselCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.carouselCardLockOverlay} />
              </View>
            ) : null}
            <View style={[styles.carouselCardTitleWrap, titleStyle]}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit={isTrafficSignsTitle || isLongThemeTitle}
                minimumFontScale={isLongThemeTitle ? 0.8 : 0.72}
                maxFontSizeMultiplier={1}
                style={[
                  styles.carouselCardTitle,
                  titleTextStyle,
                  isTrafficSignsTitle && styles.carouselCardTitleNoWrap,
                ]}
              >
                {item.title}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.carouselCardBody, cardBodyStyle, { backgroundColor: item.surface }]}>
            {isLocked ? <View style={styles.carouselCardLockedDim} /> : null}
            {isLocked ? (
              <View pointerEvents="none" style={styles.carouselCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.carouselCardLockOverlay} />
              </View>
            ) : null}
            <View style={[styles.carouselCardTitleWrap, titleStyle]}>
              <Text style={[styles.carouselCardTitle, titleTextStyle]}>{item.title}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function ChoiceChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SettingsRuleSlider({ title, titleIcon, value, options, onChange, metrics, variant = 'win' }) {
  const isDiagonal = variant === 'diagonal';
  const isDutch = variant === 'dutch';
  const isCardLayout = variant === 'cardLayout';
  const [railWidth, setRailWidth] = useState(0);
  const selectorTranslateX = useRef(new Animated.Value(0)).current;
  const selectorScale = useRef(new Animated.Value(1)).current;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
  const optionCount = options.length;
  const selectorWidth = railWidth > 0 ? railWidth / optionCount : 0;
  const frameSource = isDutch
    ? SETTINGS_RULE_SLIDER_FRAME_DUTCH_ITEMS
    : isCardLayout
      ? SETTINGS_RULE_SLIDER_FRAME_CARD_LAYOUT
      : isDiagonal
        ? SETTINGS_RULE_SLIDER_FRAME_DIAGONAL
        : SETTINGS_RULE_SLIDER_FRAME_WINCONDITION;
  const frameAspectRatio = isDutch ? (992 / 1586) : isCardLayout ? (1024 / 1536) : isDiagonal ? (919 / 1475) : (935 / 1490);
  const selectorColors = isDutch
    ? ['#FFB02A', '#FF7A00', '#C84A00']
    : isCardLayout
      ? ['#40B8FF', '#1086E8', '#0050B5']
      : isDiagonal
        ? ['#A553FF', '#7B24D8', '#4F1196']
        : ['#62D629', '#2EAA0F', '#146E06'];
  const titleShadowColor = isDutch ? '#A64000' : isCardLayout ? '#004C9F' : isDiagonal ? '#4A0A83' : '#155F04';
  const frameWidth = Math.round(clamp(metrics.scale * 346, 314, metrics.isTablet ? 520 : 382));
  const frameHeight = Math.round(frameWidth * frameAspectRatio);
  const selectorVisualWidth = isDiagonal || isDutch || isCardLayout ? selectorWidth : selectorWidth * 1.06;
  const selectorVisualOffset = isDiagonal || isDutch || isCardLayout ? 0 : selectorWidth * -0.03;

  function animateSelectorToIndex(index) {
    if (!selectorWidth) {
      return;
    }

    Animated.spring(selectorTranslateX, {
      toValue: selectorWidth * index,
      useNativeDriver: true,
      speed: 22,
      bounciness: 7,
    }).start();
  }

  function popSelector(strength = 1.045) {
    Animated.sequence([
      Animated.spring(selectorScale, {
        toValue: strength,
        useNativeDriver: true,
        speed: 34,
        bounciness: 7,
      }),
      Animated.spring(selectorScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 26,
        bounciness: 7,
      }),
    ]).start();
  }

  function handleOptionPress(option, index) {
    if (!option) {
      return;
    }

    selectorTranslateX.stopAnimation();

    if (option.id === value) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateSelectorToIndex(index);
      popSelector(1.035);
      return;
    }

    void Haptics.selectionAsync();
    onChange(option.id);
    animateSelectorToIndex(index);
    popSelector(1.055);
  }

  useEffect(() => {
    animateSelectorToIndex(selectedIndex);
  }, [selectedIndex, selectorWidth]);

  return (
    <View style={styles.settingsRuleSection}>
      <ImageBackground
        source={frameSource}
        resizeMode="stretch"
        style={[
          styles.settingsRuleFrame,
          {
            width: frameWidth,
            height: frameHeight,
          },
        ]}
        imageStyle={styles.settingsRuleFrameImage}
      >
        <View style={styles.settingsRuleTitleOverlay}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.95}
            style={[
              styles.settingsRuleTitle,
              {
                fontSize: Math.round((isDutch ? (metrics.isTablet ? 30 : 27) : isCardLayout ? (metrics.isTablet ? 30 : 27) : (metrics.isTablet ? 32 : 29)) * metrics.scale),
                textShadowColor: titleShadowColor,
              },
            ]}
          >
            {title}
          </Text>
          <Image
            source={titleIcon}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.settingsRuleTitleIcon,
              {
                width: isDiagonal
                  ? Math.round(metrics.settingsTitleIconSize * 1.14)
                  : isDutch
                    ? Math.round(metrics.settingsTitleIconSize * 1.18)
                    : isCardLayout
                      ? Math.round(metrics.settingsTitleIconSize * 0.96)
                    : Math.round(metrics.settingsTitleIconSize * 0.92),
                height: isDiagonal
                  ? Math.round(metrics.settingsTitleIconSize * 0.92)
                  : isDutch
                    ? Math.round(metrics.settingsTitleIconSize * 0.98)
                    : isCardLayout
                      ? Math.round(metrics.settingsTitleIconSize * 0.96)
                    : Math.round(metrics.settingsTitleIconSize * 0.92),
              },
            ]}
          />
        </View>

        <View
          onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
          style={[
            styles.settingsRuleSlider,
            isDiagonal && styles.settingsRuleSliderDiagonal,
          ]}
        >
          {selectorWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.settingsRuleSelector,
                {
                  width: selectorVisualWidth,
                  transform: [
                    { translateX: selectorTranslateX },
                    { translateX: selectorVisualOffset },
                    { scale: selectorScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={selectorColors}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.92, y: 1 }}
                style={styles.settingsRuleSelectorGradient}
              />
            </Animated.View>
          ) : null}

          <View style={styles.settingsRuleOptionsRow}>
            {options.map((option, index) => {
              const selected = option.id === value;
              const isLongLabel = option.label.length >= 9;
              const hasImage = Boolean(option.image);
              const baseLabelSize = isDiagonal ? 25 : isDutch ? 18 : isCardLayout ? 18 : (metrics.isTablet ? 22 : 20);
              const labelSize = option.label.length >= 9
                ? (isDutch || isCardLayout ? 15 : 17)
                : baseLabelSize;
              const optionImageSize = isDiagonal
                ? Math.round(metrics.settingsSliderDiagonalImageSize * 0.84)
                : isDutch
                  ? Math.round(metrics.settingsSliderImageSize * 1.02)
                  : isCardLayout
                    ? Math.round(metrics.settingsSliderImageSize * 1.04)
                  : Math.round(metrics.settingsSliderImageSize * (isLongLabel ? 0.82 : 0.88));

              return (
                <Pressable
                  key={String(option.id)}
                  onPress={() => handleOptionPress(option, index)}
                  style={styles.settingsRuleOption}
                >
                  <View style={styles.settingsRuleOptionContent}>
                    {hasImage ? (
                      <Image
                        source={option.image}
                        resizeMode="contain"
                        fadeDuration={0}
                        style={[
                          styles.settingsRuleOptionImage,
                          {
                            width: optionImageSize,
                            height: optionImageSize,
                          },
                        ]}
                      />
                    ) : null}
                    <Text
                      numberOfLines={isDutch || isCardLayout ? 2 : 1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.58}
                      style={[
                        styles.settingsRuleOptionLabel,
                        {
                          fontSize: Math.round(labelSize * metrics.scale),
                          lineHeight: Math.round((labelSize + (isDutch || isCardLayout ? 5 : 9)) * metrics.scale),
                        },
                        selected && styles.settingsRuleOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function SettingsTextSegment({ title, value, options, onChange, metrics }) {
  return (
    <View style={styles.settingsTextSection}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.76}
        style={[
          styles.settingsTextTitle,
          { fontSize: Math.round((metrics.isTablet ? 24 : 21) * metrics.scale) },
        ]}
      >
        {title}
      </Text>
      <View style={styles.settingsTextOptionsRow}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={String(option.id)}
              onPress={() => onChange(option.id)}
              style={[
                styles.settingsTextOption,
                selected && styles.settingsTextOptionSelected,
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[
                  styles.settingsTextOptionLabel,
                  selected && styles.settingsTextOptionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TitleBlock({ label, variant = 'section', metrics }) {
  const isPage = variant === 'page';
  const titleScale = metrics?.scale ?? 1;
  const blockStyle = metrics ? {
    minWidth: Math.round((isPage ? 220 : 184) * titleScale),
    minHeight: Math.round((isPage ? 50 : 46) * titleScale),
    paddingHorizontal: Math.round((isPage ? 28 : 24) * titleScale),
    marginTop: isPage ? 0 : metrics.titleMarginTop,
    marginBottom: isPage ? metrics.pageTitleMarginBottom : metrics.titleMarginBottom,
  } : null;
  const textStyle = metrics ? {
    fontSize: Math.round((isPage ? 27 : 22) * titleScale),
    lineHeight: Math.round((isPage ? 32 : 27) * titleScale),
  } : null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.titleBlock,
        isPage && styles.titleBlockPage,
        blockStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.74)', 'rgba(255,255,255,0.34)', 'rgba(232,247,255,0.2)']}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.titleBlockGloss}
      />
      <Text
        style={[
          styles.titleBlockText,
          isPage && styles.titleBlockTextPage,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function GameModeCardArt({
  mode,
  selected = false,
  compact = false,
  motion = false,
  setupPreview = false,
}) {
  const hover = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ANDROID_DISABLE_SETUP_IDLE_MOTION) {
      hover.stopAnimation();
      hover.setValue(0);
      return undefined;
    }

    if (
      mode.id !== 'klassiek'
      && mode.id !== 'claim'
      && mode.id !== 'collectief'
      && mode.id !== 'wegenkaart'
    ) {
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(hover, {
          toValue: 1,
          duration: 1650,
          useNativeDriver: true,
        }),
        Animated.timing(hover, {
          toValue: 0,
          duration: 1650,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [hover, mode.id]);

  if (mode.id === 'claim') {
    const boardLift = hover.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });
    const boardTilt = hover.interpolate({
      inputRange: [0, 1],
      outputRange: ['4deg', '6deg'],
    });

    return (
      <View
        style={[
          styles.claimGameModeCard,
          selected && styles.claimGameModeCardSelected,
        ]}
      >
        <Image source={CLAIM_GAME_MODE_BASE} resizeMode="contain" fadeDuration={0} style={styles.gameModeCardBaseImage} />
        <Text
          numberOfLines={1}
          style={styles.claimGameModeTitle}
        >
          Claim
        </Text>

        <Animated.Image
          source={CLAIM_BINGO_BOARD}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.claimBingoBoard,
            {
              transform: [
                { translateY: boardLift },
                { rotate: boardTilt },
              ],
            },
          ]}
        />
      </View>
    );
  }

  if (mode.id === 'collectief') {
    const boardLift = hover.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });
    const boardTilt = hover.interpolate({
      inputRange: [0, 1],
      outputRange: ['3deg', '5deg'],
    });

    return (
      <View
        style={[
          styles.collectiefGameModeCard,
          selected && styles.collectiefGameModeCardSelected,
        ]}
      >
        <Image source={COLLECTIEF_GAME_MODE_BASE} resizeMode="contain" fadeDuration={0} style={styles.gameModeCardBaseImage} />
        <Text numberOfLines={1} style={styles.collectiefGameModeTitle}>
          Collectief
        </Text>

        <Animated.Image
          source={COLLECTIEF_BINGO_BOARD}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.collectiefBingoBoard,
            {
              transform: [
                { translateY: boardLift },
                { rotate: boardTilt },
              ],
            },
          ]}
        />
      </View>
    );
  }

  if (mode.id === 'wegenkaart') {
    const cardLift = hover.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });
    const leftTilt = hover.interpolate({
      inputRange: [0, 1],
      outputRange: ['-6deg', '-9deg'],
    });
    const rightTilt = hover.interpolate({
      inputRange: [0, 1],
      outputRange: ['6deg', '9deg'],
    });
    const iconLift = hover.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -4],
    });

    return (
      <View
        style={[
          styles.kaartcodeGameModeCard,
          selected && styles.kaartcodeGameModeCardSelected,
          compact && styles.kaartcodeGameModeCardCompact,
          motion && styles.kaartcodeGameModeCardMotion,
        ]}
      >
        <Image
          source={KAARTCODE_GAME_MODE_BASE}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.kaartcodeGameModeBaseImage}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.kaartcodeGameModeTitle,
          ]}
        >
          Kaartcode
        </Text>
        <View
          style={[
            styles.kaartcodePlateWrap,
          ]}
        >
          <Image
            source={KAARTCODE_LICENSE_PLATE}
            resizeMode="contain"
            fadeDuration={0}
            style={styles.kaartcodePlateImage}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.kaartcodePlateText,
            ]}
          >
            ##-##-###
          </Text>
        </View>
        <Animated.Image
          source={KAARTCODE_CARD_YELLOW}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.kaartcodeBingoCard,
            styles.kaartcodeBingoCardYellow,
            {
              transform: [
                { translateY: cardLift },
                { rotate: leftTilt },
              ],
            },
          ]}
        />
        <Animated.Image
          source={KAARTCODE_CARD_BLUE}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.kaartcodeBingoCard,
            styles.kaartcodeBingoCardBlue,
            {
              transform: [
                { translateY: cardLift },
                { rotate: rightTilt },
              ],
            },
          ]}
        />
        <Animated.Image
          source={KAARTCODE_NO_WIFI}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.kaartcodeNoWifiIcon,
            {
              transform: [{ translateY: iconLift }],
            },
          ]}
        />
      </View>
    );
  }

  if (mode.id !== 'klassiek') {
    return (
      <View
        style={[
          styles.simpleGameModeCardArt,
          selected && styles.simpleGameModeCardArtSelected,
          compact && styles.simpleGameModeCardArtCompact,
          motion && styles.simpleGameModeCardArtMotion,
        ]}
      >
        <Text style={styles.gameModeChoiceText}>{mode.title}</Text>
      </View>
    );
  }

  const lift = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const centerLift = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const sideTilt = hover.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '-7deg'],
  });
  const rightTilt = hover.interpolate({
    inputRange: [0, 1],
    outputRange: ['5deg', '8deg'],
  });
  const centerTilt = hover.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1deg'],
  });

  return (
    <View
      style={[
        styles.klassiekGameModeCard,
        selected && styles.klassiekGameModeCardSelected,
        compact && styles.klassiekGameModeCardCompact,
        motion && styles.klassiekGameModeCardMotion,
      ]}
    >
      <Image source={KLASSIEK_GAME_MODE_BASE} resizeMode="contain" fadeDuration={0} style={styles.gameModeCardBaseImage} />
      <Text
        numberOfLines={1}
        style={[
          styles.klassiekGameModeTitle,
          compact && styles.klassiekGameModeTitleCompact,
        ]}
      >
        Klassiek
      </Text>
      <View
        style={[
          styles.klassiekCardsLayer,
          setupPreview && styles.klassiekCardsLayerSetupPreview,
        ]}
      >
        <Animated.Image
          source={KLASSIEK_CARD_RED}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.klassiekBingoCard,
            styles.klassiekBingoCardSide,
            setupPreview && styles.klassiekBingoCardSideSetupPreview,
            styles.klassiekBingoCardLeft,
            setupPreview && styles.klassiekBingoCardLeftSetupPreview,
            {
              transform: [
                { translateY: lift },
                { rotate: sideTilt },
              ],
            },
          ]}
        />
        <Animated.Image
          source={KLASSIEK_CARD_BLUE}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.klassiekBingoCard,
            styles.klassiekBingoCardCenter,
            setupPreview && styles.klassiekBingoCardCenterSetupPreview,
            {
              transform: [
                { translateY: centerLift },
                { rotate: centerTilt },
              ],
            },
          ]}
        />
        <Animated.Image
          source={KLASSIEK_CARD_GREEN}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.klassiekBingoCard,
            styles.klassiekBingoCardSide,
            setupPreview && styles.klassiekBingoCardSideSetupPreview,
            styles.klassiekBingoCardRight,
            setupPreview && styles.klassiekBingoCardRightSetupPreview,
            {
              transform: [
                { translateY: lift },
                { rotate: rightTilt },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

function GameModePickerSection({ icon, modes, selectedModeId, hiddenModeId, choiceRefs, itemProgress, onSelect, variant, metrics }) {
  const featuredMode = variant === 'wifi' ? modes[0] : null;
  const remainingModes = featuredMode ? modes.slice(1) : modes;
  const iconProgress = itemProgress[variant === 'wifi' ? 'wifiIcon' : 'offlineIcon'];
  const choiceGap = metrics?.pickerChoiceGap ?? 14;
  const isWifiSection = variant === 'wifi';
  const panelToChoiceGap = metrics?.pickerPanelToChoiceGap ?? 10;
  const offlinePanelMarginTop = metrics
    ? Math.round(panelToChoiceGap * 1.5 - metrics.pickerGap)
    : 0;

  return (
    <View style={styles.gameModePickerSection}>
      <Animated.View
        style={[
          styles.gameModeWifiPanel,
          metrics && {
            width: metrics.pickerStatusPanelWidth,
            height: metrics.pickerStatusPanelHeight,
            marginTop: isWifiSection ? Math.round(-38 * metrics.scale) : offlinePanelMarginTop,
            marginBottom: panelToChoiceGap,
          },
          getPickerIntroStyle(iconProgress),
        ]}
      >
        <Image
          source={WIFI_STATUS_PANEL_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.gameModeWifiPanelImage}
        />
        <View style={styles.gameModeWifiPanelTextBlock}>
          <Text style={styles.gameModeWifiPanelTitle}>
            {isWifiSection ? 'online' : 'offline'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={styles.gameModeWifiPanelSubtitle}
          >
            {isWifiSection ? 'vereist internet!' : 'vereist GEEN internet'}
          </Text>
        </View>
        <Image
          source={icon}
          resizeMode="contain"
          fadeDuration={0}
          style={[
            styles.gameModeWifiPanelIcon,
            metrics && {
              width: metrics.pickerStatusPanelIconSize,
              height: metrics.pickerStatusPanelIconSize,
            },
          ]}
        />
      </Animated.View>
      <View style={[
        styles.gameModeChoiceGrid,
        { gap: choiceGap },
        variant === 'offline' && styles.gameModeChoiceGridOffline,
      ]}>
        {featuredMode ? (
          <GameModeChoiceButton
            mode={featuredMode}
            selected={selectedModeId === featuredMode.id}
            hidden={hiddenModeId === featuredMode.id}
            choiceRefs={choiceRefs}
            progress={itemProgress[featuredMode.id]}
            onPress={() => onSelect(featuredMode.id)}
            featured
            metrics={metrics}
          />
        ) : null}
        <View style={[styles.gameModeChoiceRow, { gap: choiceGap }]}>
          {remainingModes.map((mode) => (
            <GameModeChoiceButton
              key={mode.id}
              mode={mode}
              selected={selectedModeId === mode.id}
              hidden={hiddenModeId === mode.id}
              choiceRefs={choiceRefs}
              progress={itemProgress[mode.id]}
              onPress={() => onSelect(mode.id)}
              metrics={metrics}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function GameModeChoiceButton({ mode, selected, hidden, choiceRefs, progress, onPress, featured, metrics }) {
  const isCompact = mode.id !== 'wegenkaart' && !featured && !selected;
  const frameStyle = metrics ? {
    height: featured ? metrics.pickerFeaturedChoiceHeight : metrics.pickerChoiceHeight,
  } : null;

  return (
    <Animated.View
      style={[
        styles.gameModeChoiceButtonFrame,
        featured && styles.gameModeChoiceButtonFrameFeatured,
        frameStyle,
        getPickerIntroStyle(progress),
        hidden && styles.gameModeChoiceButtonHidden,
      ]}
    >
      <Pressable
        ref={(node) => {
          if (node) {
            choiceRefs.current[mode.id] = node;
          }
        }}
        collapsable={false}
        onPress={onPress}
        style={[
          styles.gameModeChoiceButton,
          selected && styles.gameModeChoiceButtonSelected,
        ]}
      >
        <GameModeCardArt mode={mode} selected={selected} compact={isCompact} />
      </Pressable>
    </Animated.View>
  );
}

function getPickerIntroStyle(progress) {
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };
}

function MovingGameModeCard({ motion, progress }) {
  const left = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.from.x, motion.to.x],
  });
  const top = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.from.y, motion.to.y],
  });
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.from.width, motion.to.width],
  });
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.from.height, motion.to.height],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.movingGameModeCard,
        {
          left,
          top,
          width,
          height,
        },
      ]}
    >
      <GameModeCardArt mode={motion.mode} selected motion />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  background: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 138,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    elevation: 20,
  },
  topBlock: {
    marginTop: 4,
    marginHorizontal: -24,
  },
  titleBlock: {
    alignSelf: 'center',
    minWidth: 184,
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(20, 71, 102, 0.34)',
    backgroundColor: 'rgba(238, 249, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
    shadowColor: '#09283B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  titleBlockPage: {
    minWidth: 220,
    minHeight: 50,
    borderRadius: 999,
    borderColor: 'rgba(11, 48, 73, 0.56)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    marginTop: 0,
    marginBottom: 12,
  },
  titleBlockGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  titleBlockText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    lineHeight: 27,
    color: '#144766',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  titleBlockTextPage: {
    fontSize: 27,
    lineHeight: 32,
    color: '#103f5d',
  },
  selectedGameModeCard: {
    marginTop: 2,
    alignSelf: 'center',
    width: '58%',
    height: 138,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#32180a',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    gap: 6,
  },
  selectedGameModeCardHidden: {
    opacity: 0,
  },
  selectedGameModeEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.68)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectedGameModeTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedGameModeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'center',
  },
  simpleGameModeCardArt: {
    width: '100%',
    height: '100%',
    minHeight: 124,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#083B58',
    backgroundColor: '#197193',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  simpleGameModeCardArtSelected: {
    borderColor: '#FFFFFF',
  },
  simpleGameModeCardArtCompact: {
    minHeight: 124,
  },
  simpleGameModeCardArtMotion: {
    minHeight: 0,
  },
  gameModeCardBaseImage: {
    ...StyleSheet.absoluteFillObject,
    width: '112%',
    height: '112%',
    left: '-6%',
    top: '-6%',
    zIndex: 0,
  },
  klassiekGameModeCard: {
    width: '100%',
    height: '100%',
    minHeight: 132,
    borderRadius: 28,
    overflow: 'visible',
    alignItems: 'center',
    shadowColor: '#2b160b',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  klassiekGameModeCardSelected: {
    shadowOpacity: 0.28,
  },
  klassiekGameModeCardCompact: {
    minHeight: 124,
  },
  klassiekGameModeCardMotion: {
    minHeight: 0,
  },
  klassiekGameModeTitle: {
    position: 'absolute',
    top: 9,
    left: 18,
    right: 18,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 27,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(109, 39, 0, 0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 3,
  },
  klassiekGameModeTitleCompact: {
    fontSize: 23,
    lineHeight: 28,
    top: 8,
  },
  klassiekCardsLayer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 7,
    height: '65%',
  },
  klassiekCardsLayerSetupPreview: {
    left: '18%',
    right: '18%',
    bottom: '9%',
    height: '58%',
  },
  klassiekBingoCard: {
    position: 'absolute',
  },
  klassiekBingoCardSide: {
    width: '36%',
    height: '86%',
    bottom: 2,
    zIndex: 1,
  },
  klassiekBingoCardSideSetupPreview: {
    width: '34%',
    height: '82%',
    bottom: 4,
  },
  klassiekBingoCardCenter: {
    width: '40%',
    height: '98%',
    left: '30%',
    bottom: -1,
    zIndex: 4,
    elevation: 4,
  },
  klassiekBingoCardCenterSetupPreview: {
    width: '38%',
    height: '96%',
    left: '31%',
    bottom: 0,
  },
  klassiekBingoCardLeft: {
    left: '8%',
    zIndex: 1,
    elevation: 1,
  },
  klassiekBingoCardLeftSetupPreview: {
    left: '12%',
  },
  klassiekBingoCardRight: {
    right: '8%',
    zIndex: 1,
    elevation: 1,
  },
  klassiekBingoCardRightSetupPreview: {
    right: '12%',
  },
  kaartcodeGameModeCard: {
    width: '100%',
    height: '100%',
    minHeight: 132,
    borderRadius: 28,
    overflow: 'visible',
    alignItems: 'center',
    shadowColor: '#0b3f16',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  kaartcodeGameModeCardSelected: {
    shadowOpacity: 0.32,
  },
  kaartcodeGameModeCardCompact: {
    minHeight: 124,
  },
  kaartcodeGameModeCardMotion: {
    minHeight: 0,
  },
  kaartcodeGameModeBaseImage: {
    ...StyleSheet.absoluteFillObject,
    width: '108%',
    height: '108%',
    left: '-4%',
    top: '-4%',
    zIndex: 0,
  },
  kaartcodeGameModeTitle: {
    position: 'absolute',
    top: '9%',
    left: '9%',
    right: '9%',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    lineHeight: 31,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(20, 91, 20, 0.74)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 5,
  },
  kaartcodeGameModeTitleCompact: {
    fontSize: 23,
    lineHeight: 28,
    top: '8%',
  },
  kaartcodePlateWrap: {
    position: 'absolute',
    top: '30%',
    width: '49%',
    height: '18%',
    zIndex: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaartcodePlateImage: {
    width: '100%',
    height: '100%',
  },
  kaartcodePlateText: {
    position: 'absolute',
    left: '21%',
    right: '14%',
    top: '24%',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 8,
    lineHeight: 10,
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  kaartcodeBingoCard: {
    position: 'absolute',
    width: '31%',
    height: '40%',
    bottom: '9%',
    zIndex: 3,
  },
  kaartcodeBingoCardYellow: {
    left: '9%',
  },
  kaartcodeBingoCardBlue: {
    right: '9%',
  },
  kaartcodeNoWifiIcon: {
    position: 'absolute',
    width: '25%',
    height: '30%',
    bottom: '12%',
    zIndex: 4,
  },
  claimGameModeCard: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'visible',
    alignItems: 'center',
    shadowColor: '#24102d',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  claimGameModeCardSelected: {
    shadowOpacity: 0.3,
  },
  claimGameModeTitle: {
    position: 'absolute',
    top: 9,
    left: 18,
    right: 18,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 27,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(71, 13, 86, 0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 8,
  },
  claimBingoBoard: {
    position: 'absolute',
    left: '21%',
    bottom: '2%',
    width: '58%',
    height: '68%',
    zIndex: 3,
    elevation: 3,
  },
  collectiefGameModeCard: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'visible',
    alignItems: 'center',
    shadowColor: '#10254f',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  collectiefGameModeCardSelected: {
    shadowOpacity: 0.3,
  },
  collectiefGameModeTitle: {
    position: 'absolute',
    top: 9,
    left: 12,
    right: 12,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    lineHeight: 31,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(4, 44, 112, 0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 8,
  },
  collectiefBingoBoard: {
    position: 'absolute',
    left: '23.2%',
    bottom: '5.5%',
    width: '54%',
    height: '62%',
    zIndex: 3,
    elevation: 3,
  },
  actionRail: {
    flex: 1,
    justifyContent: 'center',
  },
  actionStack: {
    gap: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.32)',
  },
  bottomDock: {
    position: 'absolute',
    left: -8,
    right: -8,
    bottom: 0,
    zIndex: 24,
    elevation: 24,
  },
  collapsedPanelPressTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  gameModePickerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
    backgroundColor: 'rgba(5, 16, 24, 0.66)',
    justifyContent: 'center',
  },
  gameModePickerContent: {
    paddingHorizontal: 20,
    paddingTop: 78,
    paddingBottom: 92,
    alignItems: 'center',
    gap: 16,
  },
  gameModePickerSection: {
    width: '100%',
    alignItems: 'center',
  },
  gameModeWifiPanel: {
    width: 302,
    aspectRatio: 1672 / 941,
    marginTop: -6,
    marginBottom: 8,
    zIndex: 3,
    elevation: 3,
  },
  gameModeWifiPanelImage: {
    width: '100%',
    height: '100%',
  },
  gameModeWifiPanelTextBlock: {
    position: 'absolute',
    left: '13%',
    top: '34%',
    width: '45%',
    justifyContent: 'center',
  },
  gameModeWifiPanelTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    lineHeight: 31,
    color: '#1F2A37',
    letterSpacing: 0,
    textTransform: 'lowercase',
    textShadowColor: 'rgba(255,255,255,0.56)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameModeWifiPanelSubtitle: {
    marginTop: -1,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#4B5563',
    letterSpacing: 0,
  },
  gameModeWifiPanelIcon: {
    position: 'absolute',
    right: '9%',
    top: '19%',
    width: 102,
    height: 102,
  },
  gameModeWifiIcon: {
    width: 118,
    height: 128,
    marginBottom: -20,
    zIndex: 2,
  },
  gameModeChoiceGrid: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  gameModeChoiceGridOffline: {
    marginTop: 0,
  },
  gameModeChoiceRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  gameModeChoiceButton: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1f130d',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gameModeChoiceButtonFrame: {
    width: '47%',
    height: 124,
  },
  gameModeChoiceButtonFrameFeatured: {
    width: '52%',
    height: 134,
  },
  gameModeChoiceButtonSelected: {
    shadowOpacity: 0.36,
  },
  gameModeChoiceButtonHidden: {
    opacity: 0,
  },
  gameModeChoiceText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 25,
    lineHeight: 31,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  movingGameModeCard: {
    position: 'absolute',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1f130d',
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    zIndex: 5,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(244, 241, 232, 0.96)',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#0B3550',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 18,
    shadowColor: '#0B3550',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 28,
    fontFamily: 'FredokaOne_400Regular',
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confirmText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1F2A37',
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 14,
  },
  confirmGlossyButton: {
    flex: 1,
  },
  connectionErrorActions: {
    marginTop: 10,
    transform: [{ translateY: -14 }],
  },
  panelShell: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 24,
    elevation: 24,
  },
  rulesPanelImage: {
    ...StyleSheet.absoluteFillObject,
  },
  rulesPanelImageTablet: {
    left: 18,
    right: 18,
    top: 0,
    bottom: 0,
  },
  rulesPanelImageAsset: {
    width: '100%',
    height: '100%',
  },
  panelShellClosed: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  panelShellOpen: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeader: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    paddingHorizontal: 68,
    paddingTop: 4,
    paddingBottom: 10,
  },
  panelHeaderClosed: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeaderOpen: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeaderGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  panelHeaderInner: {
    width: '100%',
    maxWidth: 340,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#082E43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
  },
  panelHeaderShine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 7,
    height: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  panelHeaderText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 34,
    lineHeight: 39,
    color: '#FFFFFF',
    textShadowColor: 'rgba(116, 7, 5, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    zIndex: 2,
    marginTop: 24,
    marginBottom: 0,
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  panelContentGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsMenuScroll: {
    flex: 1,
    marginTop: 18,
    marginBottom: 52,
  },
  settingsMenuBody: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 36,
    paddingBottom: 28,
  },
  settingsScrollbarTrack: {
    position: 'absolute',
    top: 28,
    right: 34,
    bottom: 82,
    width: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(151, 80, 29, 0.12)',
    overflow: 'hidden',
  },
  settingsScrollbarThumb: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(151, 80, 29, 0.34)',
  },
  settingsRuleSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  settingsTextSection: {
    width: '86%',
    maxWidth: 382,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 2,
    borderColor: 'rgba(45, 127, 178, 0.3)',
  },
  settingsTextTitle: {
    fontFamily: 'FredokaOne_400Regular',
    color: '#17415a',
    textAlign: 'center',
    marginBottom: 10,
  },
  settingsTextOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsTextOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#E8F5FF',
    borderWidth: 2,
    borderColor: '#B7D8EF',
  },
  settingsTextOptionSelected: {
    backgroundColor: '#159B3B',
    borderColor: '#0B6B27',
  },
  settingsTextOptionLabel: {
    fontFamily: 'FredokaOne_400Regular',
    color: '#17415a',
    fontSize: 15,
    lineHeight: 20,
  },
  settingsTextOptionLabelSelected: {
    color: '#FFFFFF',
  },
  settingsRuleFrame: {
    alignItems: 'center',
  },
  settingsRuleFrameImage: {
    width: '100%',
    height: '100%',
  },
  settingsRuleTitleOverlay: {
    position: 'absolute',
    top: '2.3%',
    left: '13.5%',
    right: '13.5%',
    height: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    zIndex: 4,
  },
  settingsRuleTitleRow: {
    width: '92%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    paddingTop: 3,
    paddingLeft: 19,
    paddingRight: 19,
    paddingBottom: 3,
    borderRadius: 15,
    backgroundColor: '#6b0e0e',
    overflow: 'hidden',
    shadowColor: '#6b0e0e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  settingsRuleTitleGloss: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 12,
  },
  settingsRuleTitleShine: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    height: '46%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  settingsRuleTitleShade: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 7,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  settingsRuleTitle: {
    flexShrink: 1,
    fontFamily: 'FredokaOne_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: '#8e1212',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  settingsRuleTitleIcon: {
    marginTop: 1,
    zIndex: 2,
  },
  settingsRuleSlider: {
    position: 'absolute',
    left: '7.4%',
    right: '7.4%',
    top: '37%',
    bottom: '9.2%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 20,
  },
  settingsRuleSliderDiagonal: {
    backgroundColor: 'transparent',
  },
  settingsRuleSliderGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsRuleSelector: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  settingsRuleSelectorGradient: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 0,
    borderColor: '#FF140E',
    shadowColor: '#9F0F08',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  settingsRuleOptionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  settingsRuleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 5,
    overflow: 'hidden',
  },
  settingsRuleOptionContent: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 4,
  },
  settingsRuleOptionImage: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  settingsRuleOptionLabel: {
    width: '100%',
    fontFamily: 'FredokaOne_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(129, 44, 22, 0.48)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  settingsRuleOptionLabelSelected: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(2, 31, 52, 0.72)',
    textShadowRadius: 5,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(20, 71, 102, 0.22)',
    marginBottom: 18,
  },
  sheetSection: {
    gap: 10,
    marginBottom: 18,
  },
  sheetSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#486172',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#eef4f8',
    borderWidth: 1,
    borderColor: '#cad7e0',
  },
  choiceChipSelected: {
    backgroundColor: '#d8eefc',
    borderColor: '#2d7fb2',
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#355366',
  },
  choiceChipTextSelected: {
    color: '#13567f',
  },
  carouselCardShell: {
    borderRadius: 26,
  },
  carouselCardOutline: {
    borderWidth: 4,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  carouselCardOutlineEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  carouselCardBody: {
    width: 214,
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
  },
  carouselCardBodyEmbedded: {
    borderRadius: 0,
    overflow: 'visible',
  },
  carouselCardImage: {
    borderRadius: 22,
  },
  carouselCardImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  carouselCardImageEmbedded: {
    borderRadius: 0,
  },
  carouselCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 38, 0.18)',
  },
  carouselCardLockedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    zIndex: 1,
  },
  carouselCardLockPressable: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  carouselCardLockOverlay: {
    width: '100%',
    height: '100%',
  },
  carouselCardTitleWrap: {
    position: 'absolute',
    top: 26,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  carouselCardTitleWrapEmbedded: {
    top: '1.5%',
    left: '10%',
    right: '10%',
    minHeight: 46,
    justifyContent: 'center',
  },
  carouselCardTitleWrapEmbeddedWide: {
    left: '-5%',
    right: '-5%',
  },
  carouselCardTitleWrapEmbeddedTablet: {
    top: '4.6%',
  },
  carouselCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.38)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  carouselCardTitleNoWrap: {
    width: '100%',
    flexShrink: 1,
    includeFontPadding: false,
  },
});
