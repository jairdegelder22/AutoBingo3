import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import * as Haptics from '../src/settings/haptics';
import ThemeCarousel from '../src/components/ThemeCarousel';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import AnimatedRouteBackButton from '../src/components/AnimatedRouteBackButton';
import WarmupImages from '../src/components/WarmupImages';
import { TutorialCoachContent } from '../src/components/TutorialOverlay';
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
import { getGameModePickerMetrics, getResponsiveMetrics, getRulesPanelMetrics } from '../src/utils/responsive';
import { ensureLobby } from '../src/services/liveLobbyService';
import { useAppSettings } from '../src/settings/AppSettingsContext';
import { playSoundEffect, preloadSoundEffect } from '../src/audio/soundEffects';
import { HOST_ASSETS } from '../src/assets/preloadManifest';
import { isSkinAvailableForPlayer } from '../src/skins/skinCatalog';
import { useTranslation } from '../src/i18n/useTranslation';
import {
  getCardLayoutOptionLabel,
  getGameModeInfoBody,
  getGameModeSubtitle,
  getGameModeTitle,
  getThemeLabel,
  getWinOptionLabel,
} from '../src/i18n/languages';

const GAME_SETUP_BACKGROUND = require('../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const LOBBY_ROAD_BACKGROUND_IMAGE = require('../assets/images/backgrounds/lobby-road-background.png');
const LOBBY_PARKING_GRID_IMAGE = require('../assets/images/lobby/lobby-parking-grid.png');
const WIFI_REQUIRED_IMAGE = require('../assets/images/game-mode-cards/wifi-required.png');
const WIFI_NOT_REQUIRED_IMAGE = require('../assets/images/game-mode-cards/wifi-not-required.png');
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
const INFO_BUTTON_IMAGE = require('../assets/images/ui/info-button.png');
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
const GAME_MODE_INFO = {
  klassiek: {
    title: 'Klassiek',
    body: 'Iedere speler krijgt een eigen of dezelfde bingokaart. Wie als eerste bingo heeft wint!',
  },
  claim: {
    title: 'Claim',
    body: 'Iedereen speelt live op hetzelfde bingobord. Zie je een item? Klik deze dan als eerste aan om te claimen. Wie de meeste vakjes claimt wint.',
  },
  collectief: {
    title: 'Collectief',
    body: 'Iedereen speelt samen op hetzelfde bingobord. Samen met de andere spelers probeer je bingo te halen, perfect voor als je als team wilt spelen.',
  },
  wegenkaart: {
    title: 'Kaartcode',
    body: 'Deel de kaartcode met andere spelers om zonder internet toch hetzelfde bingobord te gebruiken.',
  },
};
const RULE_INFO = {
  wincondition: {
    title: 'Winconditie',
    body: 'Kies wanneer iemand bingo heeft: na 1 rij, 2 rijen of pas bij een hele kaart.',
  },
  diagonal: {
    title: 'Diagonaal',
    body: 'Bepaal of een diagonale rij ook meetelt voor bingo. Zet dit uit als je alleen horizontaal en verticaal wilt spelen.',
  },
  dutch: {
    title: 'Nederlands',
    body: 'Voegt items toe die je alleen in Nederland vindt. Speel je niet in Nederland? Dan kun je deze beter uitzetten.',
  },
  cardLayout: {
    title: 'Kaarten',
    body: 'Spelers kunnen precies hetzelfde bingobord krijgen of een bord met een andere indeling en items.',
  },
};
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
const HOST_CONFIRM_YES_HIGHLIGHT_TUNING = {
  // Positief = naar rechts / naar beneden. Handig om deze ene tutorial-highlight in VS Code te finetunen.
  offsetX: 14,
  offsetY: 9,
  paddingLeft: 18,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 10,
  radius: 24,
};

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

export default function HostSetupScreen({
  navigation,
  route,
  tutorialActive = false,
  tutorialStep = null,
  onTutorialTargetLayout = null,
  onTutorialAction = null,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(screenWidth, screenHeight);
  const { isPremium, ownedPaidSkins } = usePremium();
  const { settings } = useAppSettings();
  const { language, t } = useTranslation();
  const tutorialMode = Boolean(route?.params?.tutorialMode);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [selectedGameModeIndex, setSelectedGameModeIndex] = useState(0);
  const [gameModePickerOpen, setGameModePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [wincondition, setWincondition] = useState('1rij');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');
  const [nederlands, setNederlands] = useState(true);
  const [gameRulePreferencesLoaded, setGameRulePreferencesLoaded] = useState(tutorialMode);
  const [createLobbyConfirmVisible, setCreateLobbyConfirmVisible] = useState(false);
  const [connectionErrorVisible, setConnectionErrorVisible] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');
  const [createLobbyReveal, setCreateLobbyReveal] = useState(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [hostLayoutReady, setHostLayoutReady] = useState(false);
  const [hostAssetsReady, setHostAssetsReady] = useState(false);
  const [settingsScrollMetrics, setSettingsScrollMetrics] = useState({ contentHeight: 0, viewportHeight: 0 });
  const [confirmYesRect, setConfirmYesRect] = useState(null);
  const [activeInfoPopover, setActiveInfoPopover] = useState(null);

  const responsiveMetrics = getResponsiveMetrics(screenWidth, screenHeight);
  const rulesPanelMetrics = getRulesPanelMetrics(screenWidth, screenHeight);
  const gameModePickerMetrics = getGameModePickerMetrics(screenWidth, screenHeight);
  const scale = responsiveMetrics.scale;
  const collapsedPanelHeight = rulesPanelMetrics.collapsedPanelHeight;
  const expandedPanelHeight = rulesPanelMetrics.expandedPanelHeight;
  const setupMetrics = useMemo(() => {
    const horizontalPadding = Math.round(clamp(screenWidth * 0.058, 20, 64));

    const themeCardWidth = Math.round(clamp(screenWidth * (isTablet ? 0.39 : 0.45), 194, isTablet ? 350 : 250));

    return {
      scale,
      horizontalPadding,
      contentTop: Platform.OS === 'android'
        ? Math.round(clamp(screenHeight * (isTablet ? 0.042 : 0.047), 34, isTablet ? 72 : 54))
        : Math.round(clamp(screenHeight * 0.018, 12, 28)),
      contentBottom: rulesPanelMetrics.contentBottom,
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
      ...gameModePickerMetrics,
      backButtonSize: Math.round(clamp(screenWidth * (isTablet ? 0.105 : 0.13), 54, isTablet ? 88 : 66)),
      backButtonInset: Math.round(clamp(screenWidth * 0.037, 14, isTablet ? 34 : 24)),
      settingsPillIconSize: Math.round(clamp(screenWidth * 0.052, 20, 30)),
      settingsTileSize: Math.round(clamp(screenWidth * 0.22, 78, 118)),
      settingsTileImageSize: Math.round(clamp(screenWidth * 0.16, 58, 86)),
      settingsDiagonalTileSize: Math.round(clamp(screenWidth * 0.23, 84, 124)),
      settingsDiagonalImageSize: Math.round(clamp(screenWidth * 0.17, 64, 92)),
      settingsLabelFontSize: Math.round(clamp(screenWidth * 0.045, 17, 24)),
      settingsTitleIconSize: rulesPanelMetrics.settingsTitleIconSize,
      settingsSliderHeight: rulesPanelMetrics.settingsSliderHeight,
      settingsSliderImageSize: rulesPanelMetrics.settingsSliderImageSize,
      settingsSliderDiagonalImageSize: rulesPanelMetrics.settingsSliderDiagonalImageSize,
      settingsPillFontSize: Math.round(clamp(screenWidth * 0.035, 14, isTablet ? 25 : 19)),
      settingsSectionGap: rulesPanelMetrics.settingsSectionGap,
      settingsOptionGap: Math.round(clamp(screenWidth * 0.05, 18, 34)),
      isTablet,
      tabletScale,
    };
  }, [gameModePickerMetrics, isTablet, rulesPanelMetrics, scale, screenHeight, screenWidth, tabletScale]);
  const modalBubbleWidth = Math.min(screenWidth * 0.9, 430);
  const modalBubbleHeight = modalBubbleWidth * 0.74;
  const modalCarSize = Math.min(screenWidth * 0.38, 190);
  const modalBubbleTop = Math.max(38, Math.min(screenHeight * 0.16, screenHeight - modalBubbleHeight - 20));
  const modalBubbleLeft = Math.min(screenWidth - modalBubbleWidth - 10, Math.max(10, screenWidth * 0.5 - modalBubbleWidth * 0.54));
  const modalCarLeft = Math.min(screenWidth - modalCarSize * 0.72, modalBubbleLeft + modalBubbleWidth * 0.68);
  const modalCarTop = modalBubbleTop + modalBubbleHeight * 0.72;
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const settingsProgress = useRef(new Animated.Value(0)).current;
  const settingsScrollY = useRef(new Animated.Value(0)).current;
  const infoPopoverProgress = useRef(new Animated.Value(0)).current;
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
  const setupThemeCarouselRef = useRef(null);
  const setupRulesHandleRef = useRef(null);
  const setupRulesDiagonalOffRef = useRef(null);
  const createLobbyButtonRef = useRef(null);
  const confirmCreateLobbyButtonRef = useRef(null);
  const createLobbyRevealRef = useRef(null);
  const gameModeChoiceRefs = useRef({});
  const [gameModeMotion, setGameModeMotion] = useState(null);
  const [gameModePickerExiting, setGameModePickerExiting] = useState(false);
  const [hiddenGameModeChoiceId, setHiddenGameModeChoiceId] = useState(null);
  const [setupGameModeDetached, setSetupGameModeDetached] = useState(false);
  const localizedThemeCards = useMemo(() => THEME_CARDS.map((theme) => ({
    ...theme,
    title: getThemeLabel(language, theme.id, theme.title),
  })), [language]);
  const localizedGameModeCards = useMemo(() => GAME_MODE_CARDS.map((mode) => ({
    ...mode,
    title: getGameModeTitle(language, mode.id, mode.title),
    subtitle: getGameModeSubtitle(language, mode.id, mode.subtitle),
    infoBody: getGameModeInfoBody(language, mode.id, mode.subtitle),
  })), [language]);
  const localizedWifiGameModeCards = useMemo(
    () => localizedGameModeCards.filter((mode) => mode.requiresWifi),
    [localizedGameModeCards]
  );
  const localizedOfflineGameModeCards = useMemo(
    () => localizedGameModeCards.filter((mode) => !mode.requiresWifi),
    [localizedGameModeCards]
  );
  const localizedWinOptions = useMemo(() => SETTINGS_WIN_OPTIONS.map((option) => ({
    ...option,
    label: getWinOptionLabel(language, option.id, option.label),
  })), [language]);
  const localizedDiagonalOptions = useMemo(() => SETTINGS_DIAGONAL_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.yes') : t('game.options.no'),
  })), [t]);
  const localizedDutchOptions = useMemo(() => SETTINGS_DUTCH_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.withDutchItems') : t('game.options.noDutchItems'),
  })), [t]);
  const localizedCardLayoutOptions = useMemo(() => SETTINGS_CARD_LAYOUT_OPTIONS.map((option) => ({
    ...option,
    label: getCardLayoutOptionLabel(language, option.id, option.label),
  })), [language]);
  const localizedRuleInfo = useMemo(() => ({
    wincondition: {
      title: t('game.rules.winCondition'),
      body: t('game.rules.winConditionInfo'),
    },
    diagonal: {
      title: t('game.rules.diagonal'),
      body: t('game.rules.diagonalInfo'),
    },
    dutch: {
      title: t('game.rules.dutchItems'),
      body: t('game.rules.dutchItemsInfo'),
    },
    cardLayout: {
      title: t('game.rules.cards'),
      body: t('game.rules.cardsInfo'),
    },
  }), [t]);
  const selectedTheme = localizedThemeCards[selectedThemeIndex] ?? localizedThemeCards[0];
  const selectedGameMode = localizedGameModeCards[selectedGameModeIndex] ?? localizedGameModeCards[0];
  const liveSyncEnabled = selectedGameMode?.requiresWifi ?? true;
  const isCardCodeMode = selectedGameMode?.id === 'wegenkaart';
  const showWinAndDiagonalRuleSettings = (
    selectedGameMode?.id === 'klassiek'
    || selectedGameMode?.id === 'wegenkaart'
    || selectedGameMode?.id === 'collectief'
  );
  const showCardLayoutRuleSettings = selectedGameMode?.id === 'klassiek';
  const selectedThemeLocked = Boolean(selectedTheme?.id && PREMIUM_THEME_IDS.has(selectedTheme.id) && !isPremium);
  const selectedThemeAvailable = !selectedThemeLocked;

  const reportTutorialTarget = useCallback((key, targetRef) => {
    if (!tutorialActive || !onTutorialTargetLayout || !targetRef?.current?.measureInWindow) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetRef.current?.measureInWindow?.((x, y, width, height) => {
          onTutorialTargetLayout(key, { x, y, width, height });
        });
      });
    });
  }, [onTutorialTargetLayout, tutorialActive]);

  const canGenerate = useMemo(
    () => Boolean(selectedTheme?.id && (tutorialMode || selectedThemeAvailable) && selectedGameMode?.id),
    [selectedGameMode?.id, selectedTheme?.id, selectedThemeAvailable, tutorialMode]
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

  const closeInfoPopover = useCallback(() => {
    if (!activeInfoPopover) {
      return;
    }

    Animated.timing(infoPopoverProgress, {
      toValue: 0,
      duration: 130,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveInfoPopover(null);
      }
    });
  }, [activeInfoPopover, infoPopoverProgress]);

  const showInfoPopover = useCallback((info, targetRef) => {
    if (!info || !targetRef?.current?.measureInWindow) {
      return;
    }

    targetRef.current.measureInWindow((x, y, width, height) => {
      if (activeInfoPopover?.id === info.id) {
        closeInfoPopover();
        return;
      }

      infoPopoverProgress.stopAnimation();
      infoPopoverProgress.setValue(0);
      setActiveInfoPopover({
        ...info,
        anchor: { x, y, width, height },
      });
      Animated.spring(infoPopoverProgress, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }).start();
    });
  }, [activeInfoPopover?.id, closeInfoPopover, infoPopoverProgress]);

  useEffect(() => {
    if (tutorialMode) {
      setWincondition('1rij');
      setDiagonaal(true);
      setKaartOpzet('zelfde');
      setNederlands(true);
      setGameRulePreferencesLoaded(true);
      return undefined;
    }

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
  }, [tutorialMode]);

  useEffect(() => {
    if (!gameRulePreferencesLoaded || tutorialMode) {
      return;
    }

    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences({ wincondition, diagonaal, kaartOpzet, nederlands })
    );
  }, [diagonaal, gameRulePreferencesLoaded, kaartOpzet, nederlands, tutorialMode, wincondition]);

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
    if (tutorialStep?.target === 'host.theme') {
      reportTutorialTarget('host.theme', setupThemeCarouselRef);
    } else if (tutorialStep?.target === 'host.spelmodus') {
      reportTutorialTarget('host.spelmodus', setupGameModeCardRef);
    } else if (tutorialStep?.target === 'host.spelmodus.collectief') {
      reportTutorialTarget('host.spelmodus.collectief', { current: gameModeChoiceRefs.current.collectief });
    } else if (tutorialStep?.target === 'host.rules') {
      reportTutorialTarget('host.rules', setupRulesHandleRef);
    } else if (tutorialStep?.target === 'host.rulesDiagonal') {
      reportTutorialTarget('host.rulesDiagonal', setupRulesDiagonalOffRef);
    } else if (tutorialStep?.target === 'host.createLobby') {
      reportTutorialTarget('host.createLobby', createLobbyButtonRef);
    } else if (tutorialStep?.target === 'host.confirmYes') {
      reportTutorialTarget('host.confirmYes', confirmCreateLobbyButtonRef);
    }
  }, [
    createLobbyConfirmVisible,
    gameModePickerOpen,
    reportTutorialTarget,
    screenHeight,
    screenWidth,
    settingsOpen,
    tutorialStep?.target,
  ]);

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
    if (!createLobbyConfirmVisible || tutorialStep?.target !== 'host.confirmYes') {
      setConfirmYesRect(null);
      return;
    }

    const measureConfirmYes = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          confirmCreateLobbyButtonRef.current?.measureInWindow?.((x, y, width, height) => {
            setConfirmYesRect({ x, y, width, height });
          });
        });
      });
    };

    measureConfirmYes();
    const timeoutId = setTimeout(measureConfirmYes, 360);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    createLobbyConfirmVisible,
    screenHeight,
    screenWidth,
    tutorialStep?.target,
  ]);

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
    closeInfoPopover();
    void Haptics.selectionAsync();
    void playSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND, settings);
    onTutorialAction?.('host.rulesOpened');
    animateSettings(true);
  }

  function closeSettings() {
    closeInfoPopover();
    void playSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND, settings);
    onTutorialAction?.('host.rulesClosed');
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

    closeInfoPopover();
    void Haptics.selectionAsync();
    onTutorialAction?.('host.spelmodusOpened');
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

    closeInfoPopover();
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

    closeInfoPopover();

    if (modeId === 'collectief') {
      onTutorialAction?.('host.spelmodusSelected');
    }

    if (nextIndex === selectedGameModeIndex) {
      closeGameModePickerWithReturn();
      return;
    }

    void Haptics.selectionAsync();
    setGameModePickerExiting(true);

    requestAnimationFrame(async () => {
      const nextMode = localizedGameModeCards[nextIndex] ?? GAME_MODE_CARDS[nextIndex];
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
    if (!tutorialMode && (!isPremium || !selectedThemeAvailable)) {
      setPremiumModalVisible(true);
      return;
    }

    if (!canGenerate || createLobbyConfirmVisible || createLobbyReveal) {
      return;
    }

    onTutorialAction?.('host.createLobbyPressed');
    setCreateLobbyConfirmVisible(true);
  }

  function buildTutorialHostLobbyConfig() {
    const hostPlayer = createPlayer({ naam: 'Jij', skin: 'rood', playerId: 'tutorial-host' });
    const goodGuest = createPlayer({ naam: 'Sam', skin: 'blauw', playerId: 'tutorial-guest-good' });
    const weakGuest = createPlayer({ naam: 'Noor', skin: 'geel', playerId: 'tutorial-guest-weak', isOffline: true });

    return createGameConfig({
      thema: selectedTheme.id,
      wincondition,
      diagonaal,
      kaartOpzet,
      nederlands,
      modus: 'collectief',
      syncType: 'live',
      lobbyCode: 'HOST1234',
      seed: 24680,
      salt: 13579,
      aantalSpelersOpDitApparaat: 1,
      zichtbaarheid: { ...DEFAULT_ZICHTBAARHEID },
      spelers: [hostPlayer],
      liveLobbyPlayers: [
        { ...hostPlayer, role: 'host' },
        { ...goodGuest, role: 'guest' },
        { ...weakGuest, role: 'guest' },
      ],
    });
  }

  async function handleConfirmCreateLobbyPress(event) {
    setConnectionErrorMessage('');
    if (!tutorialMode && (!isPremium || !selectedThemeAvailable)) {
      setCreateLobbyConfirmVisible(false);
      setPremiumModalVisible(true);
      return;
    }
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
    const preferredSkin = (
      SKIN_OPTIONS.includes(storedEquippedSkin)
      && isSkinAvailableForPlayer(storedEquippedSkin, { isPremium, ownedPaidSkins })
    ) ? storedEquippedSkin : 'rood';
    const hostPlayer = createPlayer({
      naam: normalizeCustomPlayerName(storedPreferredName),
      skin: preferredSkin,
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
        }).catch((error) => {
          setConnectionErrorMessage(error?.message ?? '');
          return null;
        })
      : Promise.resolve(null);

    setCreateLobbyReveal({
      config: tutorialMode ? buildTutorialHostLobbyConfig() : config,
      liveLobbySetupPromise: tutorialMode ? Promise.resolve(null) : liveLobbySetupPromise,
      originX: origin.x,
      originY: origin.y,
      transitionKey: `host-lobby-${Date.now()}`,
      tutorialMode,
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
            <TitleBlock label={t('game.bingoTheme')} metrics={setupMetrics} />
            <View
              ref={setupThemeCarouselRef}
              collapsable={false}
              style={[
                styles.topBlock,
                {
                  marginHorizontal: -setupMetrics.horizontalPadding,
                  marginTop: setupMetrics.topBlockMarginTop,
                },
              ]}
            >
              <ThemeCarousel
                items={localizedThemeCards}
                itemSpacing={setupMetrics.carouselSpacing}
                itemWidth={setupMetrics.themeCardWidth}
                keyExtractor={(item) => item.id}
                loop
                focusedIndex={selectedThemeIndex}
                onSnapToItem={(index) => {
                  setSelectedThemeIndex(index);
                  onTutorialAction?.('host.themeChanged');
                }}
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

            <TitleBlock label={t('game.gameMode')} metrics={setupMetrics} />
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
              <GameModeCardArt
                mode={selectedGameMode}
                selected
                setupPreview={setupMetrics.isTablet}
                info={{
                  id: `setup-mode-${selectedGameMode.id}`,
                  title: selectedGameMode.title,
                  body: selectedGameMode.infoBody ?? selectedGameMode.subtitle,
                }}
                onInfoPress={showInfoPopover}
              />
            </Pressable>

            <View style={styles.actionRail}>
              <View
                ref={createLobbyButtonRef}
                collapsable={false}
                style={styles.actionStack}
              >
                <GlossyButton
                  label={isCardCodeMode ? t('game.createCardCode') : t('game.createLobby')}
                  variant="blue"
                  size="large"
                  heightOverride={setupMetrics.actionButtonHeight}
                  horizontalPadding={setupMetrics.actionButtonPadding}
                  onPress={handleGenerateCode}
                  disabled={!canGenerate || (!tutorialMode && !selectedThemeAvailable) || createLobbyConfirmVisible || Boolean(createLobbyReveal)}
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
              ref={setupRulesHandleRef}
              collapsable={false}
              onPress={settingsOpen ? closeSettings : openSettings}
              style={[
                styles.panelHeader,
                { minHeight: collapsedPanelHeight },
                settingsPanelVisible ? styles.panelHeaderOpen : styles.panelHeaderClosed,
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={styles.panelHeaderText}
              >
                {t('game.gameRules')}
              </Text>
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
                  scrollEnabled={!tutorialActive}
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
                      title={t('game.rules.winCondition')}
                      titleIcon={SETTINGS_WIN_CONDITION_TITLE_ICON}
                      value={wincondition}
                      options={localizedWinOptions}
                      onChange={setWincondition}
                      metrics={setupMetrics}
                      info={{ id: 'rule-wincondition', ...localizedRuleInfo.wincondition }}
                      onInfoPress={showInfoPopover}
                    />

                    <SettingsRuleSlider
                      title={t('game.rules.diagonal')}
                      titleIcon={SETTINGS_DIAGONAL_TITLE_ICON}
                      value={diagonaal}
                      options={localizedDiagonalOptions}
                      optionRefs={{ false: setupRulesDiagonalOffRef }}
                      onChange={(value) => {
                        setDiagonaal(value);
                        onTutorialAction?.('host.diagonalChanged');
                      }}
                      metrics={setupMetrics}
                      variant="diagonal"
                      info={{ id: 'rule-diagonal', ...localizedRuleInfo.diagonal }}
                      onInfoPress={showInfoPopover}
                    />
                  </>
                ) : null}

                <SettingsRuleSlider
                  title={t('game.rules.dutchItems')}
                  titleIcon={SETTINGS_DUTCH_ITEMS_TITLE}
                  value={nederlands}
                  options={localizedDutchOptions}
                  onChange={setNederlands}
                  metrics={setupMetrics}
                  variant="dutch"
                  info={{ id: 'rule-dutch', ...localizedRuleInfo.dutch }}
                  onInfoPress={showInfoPopover}
                />

                {showCardLayoutRuleSettings ? (
                  <SettingsRuleSlider
                    title={t('game.rules.cards')}
                    titleIcon={SETTINGS_CARD_LAYOUT_TITLE_ICON}
                    value={kaartOpzet}
                    options={localizedCardLayoutOptions}
                    onChange={setKaartOpzet}
                    metrics={setupMetrics}
                    variant="cardLayout"
                    info={{ id: 'rule-card-layout', ...localizedRuleInfo.cardLayout }}
                    onInfoPress={showInfoPopover}
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
                modes={localizedWifiGameModeCards}
                selectedModeId={selectedGameMode.id}
                hiddenModeId={hiddenGameModeChoiceId}
                choiceRefs={gameModeChoiceRefs}
                itemProgress={gameModePickerItemProgress}
                onSelect={selectGameMode}
                onInfoPress={showInfoPopover}
                variant="wifi"
                metrics={setupMetrics}
              />
              <GameModePickerSection
                icon={WIFI_NOT_REQUIRED_IMAGE}
                modes={localizedOfflineGameModeCards}
                selectedModeId={selectedGameMode.id}
                hiddenModeId={hiddenGameModeChoiceId}
                choiceRefs={gameModeChoiceRefs}
                itemProgress={gameModePickerItemProgress}
                onSelect={selectGameMode}
                onInfoPress={showInfoPopover}
                variant="offline"
                metrics={setupMetrics}
              />
            </View>
            {gameModeMotion ? (
              <MovingGameModeCard motion={gameModeMotion} progress={gameModeMotionProgress} />
            ) : null}
          </Animated.View>
        ) : null}
        <InfoPopoverOverlay
          popover={activeInfoPopover}
          progress={infoPopoverProgress}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          onClose={closeInfoPopover}
        />
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
        <View style={[
          styles.confirmBackdrop,
          tutorialStep?.target === 'host.confirmYes' && styles.confirmBackdropTutorial,
        ]}>
          {tutorialStep?.target === 'host.confirmYes' && confirmYesRect ? (
            <View pointerEvents="none" style={styles.modalTutorialHighlightLayer}>
              <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                  <Mask id="host-confirm-yes-hole">
                    <Rect x="0" y="0" width={screenWidth} height={screenHeight} fill="#ffffff" />
                    <Rect
                      x={Math.max(0, confirmYesRect.x + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.offsetX - HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingLeft)}
                      y={Math.max(0, confirmYesRect.y + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.offsetY - HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingTop)}
                      width={confirmYesRect.width + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingLeft + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingRight}
                      height={confirmYesRect.height + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingTop + HOST_CONFIRM_YES_HIGHLIGHT_TUNING.paddingBottom}
                      rx={HOST_CONFIRM_YES_HIGHLIGHT_TUNING.radius}
                      ry={HOST_CONFIRM_YES_HIGHLIGHT_TUNING.radius}
                      fill="#000000"
                    />
                  </Mask>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width={screenWidth}
                  height={screenHeight}
                  fill="rgba(0, 0, 0, 0.46)"
                  mask="url(#host-confirm-yes-hole)"
                />
              </Svg>
            </View>
          ) : null}
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
              title={isCardCodeMode ? t('game.createCardCode') : t('game.createLobby')}
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label={t('game.options.no')}
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
                      label={t('game.options.yes')}
                      variant="green"
                      onPress={(event) => {
                        void handleConfirmCreateLobbyPress(event);
                      }}
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
          {tutorialStep?.modalCoach ? (
            <View pointerEvents="none" style={styles.modalTutorialCoachLayer}>
              <TutorialCoachContent
                step={tutorialStep}
                fontFamily="FredokaOne_400Regular"
                bubbleWidth={modalBubbleWidth}
                bubbleHeight={modalBubbleHeight}
                bubbleLeft={modalBubbleLeft}
                bubbleTop={modalBubbleTop}
                carSize={modalCarSize}
                carLeft={modalCarLeft}
                carTop={modalCarTop}
              />
            </View>
          ) : null}
          {createLobbyReveal ? (
            <CircularReveal
              key={createLobbyReveal.transitionKey}
              ref={createLobbyRevealRef}
              color={CONFIRM_CREATE_LOBBY_REVEAL_GREEN}
              originX={createLobbyReveal.originX}
              originY={createLobbyReveal.originY}
              onComplete={async () => {
                const setupSnapshot = await createLobbyReveal.liveLobbySetupPromise;
                if (!createLobbyReveal.tutorialMode && liveSyncEnabled && !setupSnapshot) {
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
                  tutorialMode: createLobbyReveal.tutorialMode,
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
                if (createLobbyReveal.tutorialMode) {
                  onTutorialAction?.('host.confirmCreateLobbyPressed');
                }
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
        title={t('game.premiumTheme')}
        message={t('home.premiumMessage')}
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
            {connectionErrorMessage || 'De online lobby kon niet worden aangemaakt. Probeer het nog een keer.'}
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
  const scale = metrics?.scale ?? 1;
  const metricsIsTablet = Boolean(metrics?.isTablet);
  const themeCardWidth = metrics?.themeCardWidth ?? 224;
  const themeCardHeight = metrics?.themeCardHeight ?? 270;
  const cardBodyStyle = {
    width: themeCardWidth,
    height: usesEmbeddedFrame ? Math.round(themeCardWidth * 1.5) : themeCardHeight,
  };
  const titleStyle = usesEmbeddedFrame
    ? [
        styles.carouselCardTitleWrapEmbedded,
        metricsIsTablet && styles.carouselCardTitleWrapEmbeddedTablet,
        item.id === 'verkeersborden' && styles.carouselCardTitleWrapEmbeddedWide,
      ]
    : {
        top: Math.round((metricsIsTablet ? 34 : 26) * scale),
        left: Math.round(12 * scale),
        right: Math.round(12 * scale),
      };
  const titleScale = getEmbeddedThemeTitleScale(item.id);
  const isTrafficSignsTitle = item.id === 'verkeersborden';
  const shouldAutoFitTitle = !usesEmbeddedFrame || isTrafficSignsTitle;
  const minimumTitleScale = isTrafficSignsTitle ? 0.58 : usesEmbeddedFrame ? 0.88 : 0.58;
  const titleTextStyle = {
    fontSize: Math.round((usesEmbeddedFrame ? 32 : 28) * scale * titleScale),
    lineHeight: Math.round((isTrafficSignsTitle ? 34 : usesEmbeddedFrame ? 42 : 34) * scale * titleScale),
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
                adjustsFontSizeToFit={shouldAutoFitTitle}
                minimumFontScale={minimumTitleScale}
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
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit={shouldAutoFitTitle}
                minimumFontScale={minimumTitleScale}
                style={[styles.carouselCardTitle, titleTextStyle]}
              >
                {item.title}
              </Text>
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

function SettingsRuleSlider({
  title,
  titleIcon,
  value,
  options,
  onChange,
  metrics,
  variant = 'win',
  optionRefs = null,
  info = null,
  onInfoPress = null,
}) {
  const scale = metrics?.scale ?? 1;
  const metricsIsTablet = Boolean(metrics?.isTablet);
  const settingsTitleIconSize = metrics?.settingsTitleIconSize ?? 54;
  const settingsSliderImageSize = metrics?.settingsSliderImageSize ?? 58;
  const settingsSliderDiagonalImageSize = metrics?.settingsSliderDiagonalImageSize ?? 58;
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
  const frameWidth = Math.round(clamp(scale * 346, 314, metricsIsTablet ? 520 : 382));
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
        <View style={[
          styles.settingsRuleTitleOverlay,
          isCardLayout && styles.settingsRuleTitleOverlayCardLayout,
        ]}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
            style={[
              styles.settingsRuleTitle,
              {
                fontSize: Math.round((isDutch ? (metricsIsTablet ? 30 : 27) : isCardLayout ? (metricsIsTablet ? 30 : 27) : (metricsIsTablet ? 32 : 29)) * scale),
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
	                  ? Math.round(settingsTitleIconSize * 1.14)
	                  : isDutch
	                    ? Math.round(settingsTitleIconSize * 1.18)
	                    : isCardLayout
	                      ? Math.round(settingsTitleIconSize * 0.96)
	                    : Math.round(settingsTitleIconSize * 0.92),
	                height: isDiagonal
	                  ? Math.round(settingsTitleIconSize * 0.92)
	                  : isDutch
	                    ? Math.round(settingsTitleIconSize * 0.98)
	                    : isCardLayout
	                      ? Math.round(settingsTitleIconSize * 0.96)
	                    : Math.round(settingsTitleIconSize * 0.92),
              },
            ]}
          />
        </View>
        <InfoButton
          info={info}
          onInfoPress={onInfoPress}
          style={[
            styles.settingsRuleInfoButton,
            isDiagonal && styles.settingsRuleInfoButtonDiagonal,
            isDutch && styles.settingsRuleInfoButtonDutch,
            isCardLayout && styles.settingsRuleInfoButtonCardLayout,
          ]}
        />

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
              const isFullCardLabel = option.id === 'heel-blok';
              const hasImage = Boolean(option.image);
              const baseLabelSize = isDiagonal ? 25 : isDutch ? 18 : isCardLayout ? 18 : (metricsIsTablet ? 22 : 20);
              const labelSize = isLongLabel && !isFullCardLabel
                ? (isDutch || isCardLayout ? 15 : 17)
                : baseLabelSize;
	              const optionImageSize = isDiagonal
	                ? Math.round(settingsSliderDiagonalImageSize * 0.84)
	                : isDutch
	                  ? Math.round(settingsSliderImageSize * 1.02)
	                  : isCardLayout
	                    ? Math.round(settingsSliderImageSize * 1.04)
	                  : Math.round(settingsSliderImageSize * (isLongLabel ? 0.82 : 0.88));

              return (
                <Pressable
                  key={String(option.id)}
                  ref={optionRefs?.[String(option.id)]}
                  collapsable={false}
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
                      numberOfLines={isDutch || isCardLayout || isFullCardLabel ? 2 : 1}
                      adjustsFontSizeToFit
                      minimumFontScale={isFullCardLabel ? 0.82 : 0.7}
                      style={[
	                        styles.settingsRuleOptionLabel,
	                        {
	                          fontSize: Math.round(labelSize * scale),
	                          lineHeight: Math.round((labelSize + (isDutch || isCardLayout || isFullCardLabel ? 5 : 9)) * scale),
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
  const scale = metrics?.scale ?? 1;
  const isTablet = Boolean(metrics?.isTablet);

  return (
    <View style={styles.settingsTextSection}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.76}
	        style={[
	          styles.settingsTextTitle,
	          { fontSize: Math.round((isTablet ? 24 : 21) * scale) },
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
    minWidth: Math.round((isPage ? 220 : 222) * titleScale),
    minHeight: Math.round((isPage ? 50 : 46) * titleScale),
    paddingHorizontal: Math.round((isPage ? 28 : 20) * titleScale),
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
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
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
  info = null,
  onInfoPress = null,
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
          adjustsFontSizeToFit
          minimumFontScale={0.62}
          style={styles.claimGameModeTitle}
        >
          {mode.title}
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
        <InfoButton
          info={info}
          onInfoPress={onInfoPress}
          style={styles.gameModeInfoButton}
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
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.56}
          style={styles.collectiefGameModeTitle}
        >
          {mode.title}
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
        <InfoButton
          info={info}
          onInfoPress={onInfoPress}
          style={styles.gameModeInfoButton}
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
          adjustsFontSizeToFit
          minimumFontScale={0.58}
          style={[
            styles.kaartcodeGameModeTitle,
          ]}
        >
          {mode.title}
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
        <InfoButton
          info={info}
          onInfoPress={onInfoPress}
          style={[styles.gameModeInfoButton, styles.kaartcodeGameModeInfoButton]}
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
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.58}
          style={styles.gameModeChoiceText}
        >
          {mode.title}
        </Text>
        <InfoButton
          info={info}
          onInfoPress={onInfoPress}
          style={styles.gameModeInfoButton}
        />
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
        adjustsFontSizeToFit
        minimumFontScale={0.58}
        style={[
          styles.klassiekGameModeTitle,
          compact && styles.klassiekGameModeTitleCompact,
        ]}
      >
        {mode.title}
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
      <InfoButton
        info={info}
        onInfoPress={onInfoPress}
        style={styles.gameModeInfoButton}
      />
    </View>
  );
}

function GameModePickerSection({ icon, modes, selectedModeId, hiddenModeId, choiceRefs, itemProgress, onSelect, onInfoPress, variant, metrics }) {
  const featuredMode = variant === 'wifi' ? modes[0] : null;
  const remainingModes = featuredMode ? modes.slice(1) : modes;
  const iconProgress = itemProgress[variant === 'wifi' ? 'wifiIcon' : 'offlineIcon'];
  const choiceGap = metrics?.pickerChoiceGap ?? 14;
  const isWifiSection = variant === 'wifi';
  const scale = metrics?.scale ?? 1;
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
	            marginTop: isWifiSection ? Math.round(-38 * scale) : offlinePanelMarginTop,
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
            onInfoPress={onInfoPress}
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
              onInfoPress={onInfoPress}
              metrics={metrics}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function GameModeChoiceButton({ mode, selected, hidden, choiceRefs, progress, onPress, onInfoPress, featured, metrics }) {
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
        <GameModeCardArt
          mode={mode}
          selected={selected}
          compact={isCompact}
          info={{
            id: `picker-mode-${mode.id}`,
            title: mode.title,
            body: mode.infoBody ?? mode.subtitle,
          }}
          onInfoPress={onInfoPress}
        />
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

function InfoButton({ info, onInfoPress, style }) {
  const buttonRef = useRef(null);

  if (!info || !onInfoPress) {
    return null;
  }

  return (
    <Pressable
      ref={buttonRef}
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={`Uitleg: ${info.title}`}
      hitSlop={10}
      onPress={(event) => {
        event?.stopPropagation?.();
        void Haptics.selectionAsync();
        onInfoPress(info, buttonRef);
      }}
      onStartShouldSetResponder={() => true}
      style={[styles.infoButton, style]}
    >
      <Image
        source={INFO_BUTTON_IMAGE}
        resizeMode="contain"
        fadeDuration={0}
        style={styles.infoButtonImage}
      />
    </Pressable>
  );
}

function InfoPopoverOverlay({ popover, progress, screenWidth, screenHeight, onClose }) {
  if (!popover?.anchor) {
    return null;
  }

  const bubbleWidth = Math.round(clamp(screenWidth * 0.78, 248, 330));
  const bubbleEstimatedHeight = popover.body.length > 110 ? 144 : popover.body.length > 85 ? 132 : 116;
  const anchorCenterX = popover.anchor.x + popover.anchor.width / 2;
  const anchorCenterY = popover.anchor.y + popover.anchor.height / 2;
  const showAbove = anchorCenterY > screenHeight * 0.52;
  const gap = showAbove ? 22 : 16;
  const bubbleLeft = Math.round(clamp(anchorCenterX - bubbleWidth * 0.5, 14, screenWidth - bubbleWidth - 14));
  const bubbleTop = showAbove
    ? Math.round(Math.max(72, popover.anchor.y - bubbleEstimatedHeight - gap))
    : Math.round(Math.min(screenHeight - bubbleEstimatedHeight - 32, popover.anchor.y + popover.anchor.height + gap));
  const arrowLeft = Math.round(clamp(anchorCenterX - bubbleLeft - 14, 22, bubbleWidth - 38));
  const anchorSize = Math.max(popover.anchor.width, popover.anchor.height) + 10;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.infoOverlay,
        {
          opacity: progress,
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.infoAnchorGlow,
          {
            left: anchorCenterX - anchorSize / 2,
            top: anchorCenterY - anchorSize / 2,
            width: anchorSize,
            height: anchorSize,
            borderRadius: anchorSize / 2,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sluit uitleg: ${popover.title}`}
        onPress={onClose}
        style={[
          styles.infoAnchorButtonClone,
          {
            left: popover.anchor.x,
            top: popover.anchor.y,
            width: popover.anchor.width,
            height: popover.anchor.height,
          },
        ]}
      >
        <Image
          source={INFO_BUTTON_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.infoButtonImage}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.infoBubble,
          {
            width: bubbleWidth,
            left: bubbleLeft,
            top: bubbleTop,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [showAbove ? 8 : -8, 0],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.infoBubbleArrow,
            showAbove ? styles.infoBubbleArrowBottom : styles.infoBubbleArrowTop,
            { left: arrowLeft },
          ]}
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={styles.infoBubbleTitle}
        >
          {popover.title}
        </Text>
        <Text style={styles.infoBubbleBody}>{popover.body}</Text>
      </Animated.View>
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
  infoButton: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
  },
  infoButtonImage: {
    width: '100%',
    height: '100%',
  },
  gameModeInfoButton: {
    right: '7.5%',
    bottom: '4.5%',
    width: 27,
    height: 27,
  },
  kaartcodeGameModeInfoButton: {
    right: '5%',
  },
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
    backgroundColor: 'rgba(6, 14, 25, 0.48)',
  },
  infoAnchorGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 214, 54, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255, 223, 79, 0.72)',
  },
  infoAnchorButtonClone: {
    position: 'absolute',
    zIndex: 64,
    elevation: 64,
  },
  infoBubble: {
    position: 'absolute',
    minHeight: 106,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#D7E8F5',
    backgroundColor: '#F8FDFF',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 14,
    shadowColor: '#05182A',
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 65,
    zIndex: 65,
  },
  infoBubbleArrow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#D7E8F5',
    backgroundColor: '#F8FDFF',
    transform: [{ rotate: '45deg' }],
  },
  infoBubbleArrowTop: {
    top: -12,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  infoBubbleArrowBottom: {
    bottom: -12,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  infoBubbleTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    lineHeight: 25,
    color: '#183D56',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  infoBubbleBody: {
    marginTop: 5,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#34536A',
    letterSpacing: 0,
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
    width: '25%',
    height: '33%',
    bottom: '11%',
    zIndex: 3,
  },
  kaartcodeBingoCardYellow: {
    left: '22%',
  },
  kaartcodeBingoCardBlue: {
    right: '22%',
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
  confirmBackdropTutorial: {
    backgroundColor: 'rgba(12, 12, 12, 0.18)',
  },
  modalTutorialCoachLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  modalTutorialHighlightLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
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
  settingsRuleInfoButton: {
    top: '15%',
    right: '2.4%',
    width: 28,
    height: 28,
  },
  settingsRuleInfoButtonDiagonal: {
    top: '16%',
    right: '2.8%',
  },
  settingsRuleInfoButtonDutch: {
    top: '16%',
    right: '2.8%',
  },
  settingsRuleInfoButtonCardLayout: {
    top: '14.6%',
    right: '3%',
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
  settingsRuleTitleOverlayCardLayout: {
    top: '1.15%',
    height: '23%',
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
    left: '6%',
    right: '6%',
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
