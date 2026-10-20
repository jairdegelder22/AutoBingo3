import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from '../settings/haptics';
import ThemeCarousel from '../components/ThemeCarousel';
import GlossyButton from '../components/GlossyButton';
import RemovePlayerIcon from '../components/RemovePlayerIcon';
import AnimatedRouteBackButton from '../components/AnimatedRouteBackButton';
import WarmupImages from '../components/WarmupImages';
import { TutorialCoachContent, TUTORIAL_HAND_IMAGE } from '../components/TutorialOverlay';
import CircularReveal from '../../components/CircularReveal';
import PremiumPaywallModal from '../premium/PremiumPaywallModal';
import { usePremium } from '../premium/PremiumContext';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../../assets/images/players/playerImages';
import { getThemeCardImage, THEME_CARD_IMAGES, THEME_LOCK_OVERLAY_IMAGE } from '../../assets/images/theme-cards/themeCardImages';
import {
  EQUIPPED_SKIN_STORAGE_KEY,
  GAME_RULE_PREFERENCES_STORAGE_KEY,
  createGameConfig,
  createPlayer,
  parseStoredGameRulePreferences,
  serializeGameRulePreferences,
  SKIN_OPTIONS,
} from '../../screens/gameFlowConfig';
import { THEMES } from '../../screens/themeCatalog';
import { getResponsiveMetrics, getRulesPanelMetrics } from '../utils/responsive';
import { useAppSettings } from '../settings/AppSettingsContext';
import { playSoundEffect, preloadSoundEffect } from '../audio/soundEffects';
import {
  SKIN_CHALLENGES,
  getChallengeProgressValue,
  isChallengeSkin,
  isSkinUnlocked,
  loadSkinChallengeProgress,
} from '../challenges/skinChallenges';
import { SETUP_ASSETS } from '../assets/preloadManifest';
import { isPremiumChallengeSkin, isSkinAvailableForPlayer } from '../skins/skinCatalog';
import { useTranslation } from '../i18n/useTranslation';
import {
  getCardLayoutOptionLabel,
  getDefaultPlayerNameForLanguage,
  getSkinChallengeDescription,
  getSkinLabel,
  getThemeLabel,
  getWinOptionLabel,
  translate,
} from '../i18n/languages';

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  outline: theme.cardOutline,
  premium: theme.premium,
}));
const ANDROID_DISABLE_SETUP_IDLE_MOTION = Platform.OS === 'android';
const PREMIUM_THEME_IDS = new Set(THEMES.filter((theme) => theme.premium).map((theme) => theme.id));
const MAX_LOCAL_PLAYERS = 2;
const MAX_PLAYER_NAME_LENGTH = 12;
const PLAYER_SILHOUETTE_IMAGE = PLAYER_ADD_SILHOUETTE_IMAGE;
const GAME_SETUP_BACKGROUND = require('../../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const CHALLENGE_SKIN_LOCK_IMAGE = require('../../assets/images/players/challenge-skin-lock.png');
const PREMIUM_SKIN_LOCK_IMAGE = require('../../assets/images/host-lock-padlock.png');
const INFO_BUTTON_IMAGE = require('../../assets/images/ui/info-button.png');
const SETTINGS_CROWN_ICON = require('../../assets/images/settings/crown-logo.png');
const SETTINGS_DIAGONAL_ICON = require('../../assets/images/settings/diagonal-logo.png');
const SETTINGS_RULES_PANEL_IMAGE = require('../../assets/images/settings/rules-menu-panel-v2.png');
const SETTINGS_RULE_SLIDER_FRAME_WINCONDITION = require('../../assets/images/settings/rules-slider-frame-wincondition.png');
const SETTINGS_RULE_SLIDER_FRAME_DIAGONAL = require('../../assets/images/settings/rules-slider-frame-diagonal.png');
const SETTINGS_RULE_SLIDER_FRAME_DUTCH_ITEMS = require('../../assets/images/settings/rules-slider-frame-dutch-items.png');
const SETTINGS_RULE_SLIDER_FRAME_CARD_LAYOUT = require('../../assets/images/settings/rules-slider-frame-card-layout.png');
const SETTINGS_WIN_CONDITION_TITLE_ICON = require('../../assets/images/settings/win-condition-title.png');
const SETTINGS_DIAGONAL_TITLE_ICON = require('../../assets/images/settings/diagonal-rule-title.png');
const SETTINGS_CARD_LAYOUT_TITLE_ICON = require('../../assets/images/settings/card-layout-title.png');
const SETTINGS_WIN_ONE_LINE = require('../../assets/images/settings/win-1-line.png');
const SETTINGS_WIN_TWO_LINES = require('../../assets/images/settings/win-2-lines.png');
const SETTINGS_WIN_FULL_CARD = require('../../assets/images/settings/win-full-card.png');
const SETTINGS_DIAGONAL_ON = require('../../assets/images/settings/diagonal-on.png');
const SETTINGS_DIAGONAL_OFF = require('../../assets/images/settings/diagonal-off.png');
const SETTINGS_DUTCH_ITEMS_ON = require('../../assets/images/settings/dutch-items-on.png');
const SETTINGS_DUTCH_ITEMS_OFF = require('../../assets/images/settings/dutch-items-off.png');
const SETTINGS_DUTCH_ITEMS_TITLE = require('../../assets/images/settings/dutch-items-title.png');
const SETTINGS_CARD_LAYOUT_SAME = require('../../assets/images/settings/card-layout-same.png');
const SETTINGS_CARD_LAYOUT_DIFFERENT = require('../../assets/images/settings/card-layout-different.png');
const SCREEN_HORIZONTAL_PADDING = 24;
const THEME_CARD_WIDTH = 194;
const THEME_CARD_HEIGHT = Math.round(THEME_CARD_WIDTH * 1.5);
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 176;
const CAROUSEL_CAR_SIZE = 224;
const PLAY_TRANSITION_BLUE = '#1A7BD4';
const BACKGROUND_PLAYER_OPACITY = 0.28;
const CAR_ATTENTION_DELAY_MS = 2600;
const CAR_ATTENTION_STAGGER_MS = 900;
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
const SETUP_CRITICAL_IMAGE_COUNT = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function withAlpha(hexColor, alpha) {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return hexColor;
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function isTranslatedDefaultPlayerName(value = '') {
  return /^(Speler|Player|Spieler|Joueur)\s+\d+$/i.test(String(value).trim());
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

export default function SingleDeviceSetupTestScreen({
  navigation,
  route,
  tutorialActive = false,
  tutorialStep = null,
  onTutorialTargetLayout = null,
  onTutorialAction = null,
}) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { isPremium, ownedPaidSkins } = usePremium();
  const { settings } = useAppSettings();
  const { language, t } = useTranslation();
  const initialConfig = route?.params?.initialConfig ?? null;
  const preserveInitialRuleSettings = route?.params?.preserveInitialRuleSettings === true;
  const tutorialMode = route?.params?.tutorialMode === true;
  const localizedThemeCards = useMemo(() => THEME_CARDS.map((theme) => ({
    ...theme,
    title: getThemeLabel(language, theme.id, theme.title),
  })), [language]);
  const initialThemeIndex = Math.max(0, localizedThemeCards.findIndex((theme) => theme.id === initialConfig?.thema));
  const initialPlayers = initialConfig?.spelers?.length
    ? initialConfig.spelers.map((player, index) => ({
        ...createPlayer({ skin: player.skin ?? (index === 0 ? 'rood' : 'blauw') }),
        ...player,
        naam: player.naam ?? getDefaultPlayerNameForLanguage(language, index),
      })).slice(0, MAX_LOCAL_PLAYERS)
    : [{ ...createPlayer({ skin: 'rood' }), naam: getDefaultPlayerNameForLanguage(language, 0) }];
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(initialThemeIndex);
  const [spelers, setSpelers] = useState(initialPlayers);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [focusedNameIndex, setFocusedNameIndex] = useState(null);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('rood');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [wincondition, setWincondition] = useState(initialConfig?.wincondition ?? '1rij');
  const [diagonaal, setDiagonaal] = useState(initialConfig?.diagonaal ?? true);
  const [kaartOpzet, setKaartOpzet] = useState(initialConfig?.kaartOpzet ?? 'zelfde');
  const [nederlands, setNederlands] = useState(initialConfig?.nederlands !== false);
  const [gameRulePreferencesLoaded, setGameRulePreferencesLoaded] = useState(preserveInitialRuleSettings);
  const [pendingGameStart, setPendingGameStart] = useState(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [setupLayoutReady, setSetupLayoutReady] = useState(false);
  const [setupImagesReady, setSetupImagesReady] = useState(false);
  const [settingsScrollMetrics, setSettingsScrollMetrics] = useState({ contentHeight: 0, viewportHeight: 0 });
  const [activeInfoPopover, setActiveInfoPopover] = useState(null);

  const responsiveMetrics = getResponsiveMetrics(screenWidth, screenHeight);
  const rulesPanelMetrics = getRulesPanelMetrics(screenWidth, screenHeight);
  const scale = responsiveMetrics.scale;
  const compactSetupLift = screenHeight > screenWidth
    ? Math.round(clamp((932 - screenHeight) * 0.46, 0, 42)) + Math.round(clamp(screenHeight * 0.018, 14, 22))
    : 0;
  const collapsedPanelHeight = rulesPanelMetrics.collapsedPanelHeight;
  const expandedPanelHeight = rulesPanelMetrics.expandedPanelHeight;
  const setupMetrics = useMemo(() => ({
    scale,
    titleMarginTop: Math.round(clamp(screenHeight * 0.011, 8, 14)),
    titleMarginBottom: Math.round(clamp(screenHeight * 0.006, 5, 8)),
    panelContentPaddingHorizontal: Math.round(clamp(screenWidth * 0.052, 20, 48)),
    panelContentPaddingTop: Math.round(clamp(screenHeight * 0.013, 10, 18)),
    panelContentPaddingBottom: Math.round(clamp(screenHeight * 0.024, 20, 34)),
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
    settingsPillFontSize: Math.round(clamp(screenWidth * 0.035, 14, 19)),
    settingsSectionGap: rulesPanelMetrics.settingsSectionGap,
    settingsOptionGap: Math.round(clamp(screenWidth * 0.05, 18, 34)),
  }), [rulesPanelMetrics, scale, screenHeight, screenWidth]);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const settingsProgress = useRef(new Animated.Value(0)).current;
  const settingsScrollY = useRef(new Animated.Value(0)).current;
  const infoPopoverProgress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const nameFocusDimOpacity = useRef(new Animated.Value(0)).current;
  const addPlayerFocusOpacity = useRef(new Animated.Value(1)).current;
  const themeTargetRef = useRef(null);
  const addPlayerTargetRef = useRef(null);
  const rulesTargetRef = useRef(null);
  const rulesPanelTargetRef = useRef(null);
  const rulesDiagonalTargetRef = useRef(null);
  const startTargetRef = useRef(null);
  const skinSelectTargetRef = useRef(null);
  const firstPlayerFocusProgress = useRef(new Animated.Value(focusedNameIndex === 0 ? 1 : 0)).current;
  const secondPlayerFocusProgress = useRef(new Animated.Value(focusedNameIndex === 1 ? 1 : 0)).current;
  const playRevealRef = useRef(null);
  const playStartLockedRef = useRef(false);
  const playRevealStartedKeyRef = useRef(null);
  const latestPlayPressPointRef = useRef(null);
  const loadedSetupCriticalImagesRef = useRef(new Set());
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const carRefs = useRef([]);
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
  const selectedThemeLocked = Boolean(selectedTheme?.id && PREMIUM_THEME_IDS.has(selectedTheme.id) && !isPremium);
  const selectedThemeAvailable = !selectedThemeLocked;
  const playerCount = spelers.length;
  const showCardLayoutRuleSettings = playerCount >= 2;
  const secondPlayerRemovalLockedByTutorial = tutorialActive && (
    tutorialStep?.target === 'setup.secondPlayerCar'
    || tutorialStep?.target === 'setup.secondPlayerName'
  );
  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const stageCarSize = playerCount >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
  const takenSkins = useMemo(
    () => spelers.filter((_, index) => index !== selectedPlayerIndex).map((player) => player.skin),
    [selectedPlayerIndex, spelers]
  );

  const canStart = useMemo(
    () => Boolean(selectedTheme?.id && selectedThemeAvailable && playerCount),
    [playerCount, selectedTheme?.id, selectedThemeAvailable]
  );

  const reportTutorialTarget = useCallback((key, targetRef) => {
    if (!tutorialActive || !onTutorialTargetLayout || !targetRef?.current?.measureInWindow) {
      return;
    }

    requestAnimationFrame(() => {
      targetRef.current?.measureInWindow?.((x, y, width, height) => {
        onTutorialTargetLayout(key, { x, y, width, height });
      });
    });
  }, [onTutorialTargetLayout, tutorialActive]);
  const markSetupCriticalImageLoaded = useCallback((key) => {
    loadedSetupCriticalImagesRef.current.add(key);

    if (loadedSetupCriticalImagesRef.current.size >= SETUP_CRITICAL_IMAGE_COUNT) {
      setSetupImagesReady(true);
    }
  }, []);
  const markThemeCardImageLoaded = useCallback(() => {
    markSetupCriticalImageLoaded('theme');
  }, [markSetupCriticalImageLoaded]);
  const handleSetupWarmupReady = useCallback(() => {
    setSetupImagesReady(true);
  }, []);
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
        bounciness: 7,
      }).start();
    });
  }, [activeInfoPopover?.id, closeInfoPopover, infoPopoverProgress]);

  useEffect(() => {
    setSpelers((current) => current.map((player, index) => (
      isTranslatedDefaultPlayerName(player.naam)
        ? { ...player, naam: getDefaultPlayerNameForLanguage(language, index) }
        : player
    )));
  }, [language]);

  useEffect(() => {
    if (preserveInitialRuleSettings) {
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
  }, [preserveInitialRuleSettings]);

  useEffect(() => {
    if (!gameRulePreferencesLoaded) {
      return;
    }

    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences({ wincondition, diagonaal, kaartOpzet, nederlands })
    );
  }, [diagonaal, gameRulePreferencesLoaded, kaartOpzet, nederlands, wincondition]);

  const playerStageWidth = Math.max(0, screenWidth - SCREEN_HORIZONTAL_PADDING * 2);
  const laneOffset = playerStageWidth / 4;
  const hasTwoLocalPlayers = spelers.length >= 2;
  const addButtonTranslateX = playerStageWidth * 0.11;
  const firstPlayerTranslateX = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -laneOffset],
  });
  const addButtonOpacity = playerLayoutProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.2, 0],
  });
  const secondPlayerOpacity = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const secondPlayerScale = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const secondPlayerTranslateY = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const isEditingPlayerName = focusedNameIndex !== null;
  const estimatedKeyboardTop = screenHeight - Math.round(clamp(screenHeight * 0.38, 300, 430));
  const focusedNamePlateRefs = useRef([]);
  const keyboardTopRef = useRef(estimatedKeyboardTop);
  const reportNameTutorialTarget = useCallback((index) => {
    const targetKey = index === 0 ? 'setup.playerName' : 'setup.secondPlayerName';
    reportTutorialTarget(targetKey, { current: focusedNamePlateRefs.current[index] });
  }, [reportTutorialTarget]);
  const firstPlayerStageTranslateX = Animated.add(
    firstPlayerTranslateX,
    firstPlayerFocusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, hasTwoLocalPlayers ? laneOffset : 0],
    })
  );
  const firstPlayerStageTranslateY = Animated.multiply(firstPlayerFocusProgress, keyboardLift);
  const firstPlayerStageOpacity = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, BACKGROUND_PLAYER_OPACITY],
  });
  const secondPlayerStageTranslateX = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [laneOffset, 0],
  });
  const secondPlayerStageTranslateY = Animated.multiply(secondPlayerFocusProgress, keyboardLift);
  const secondPlayerStageOpacity = Animated.add(
    secondPlayerOpacity,
    firstPlayerFocusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BACKGROUND_PLAYER_OPACITY - 1],
    })
  );
  const secondPlayerRemoveOpacity = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0, 0],
  });
  const secondPlayerRemoveScale = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });

  const animateKeyboardLiftToFocusedName = useCallback((index, keyboardTop = keyboardTopRef.current, duration = 320) => {
    const node = focusedNamePlateRefs.current[index];

    if (!node?.measureInWindow) {
      const fallbackLift = -Math.round(clamp(screenHeight * 0.2, 150, 250));
      Animated.timing(keyboardLift, {
        toValue: fallbackLift,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    node.measureInWindow((_x, y, _width, height) => {
      const currentCenterY = y + height / 2;
      const targetCenterY = screenHeight / 2;

      const lift = Math.round(clamp(targetCenterY - currentCenterY, -screenHeight * 0.38, 0));

      Animated.timing(keyboardLift, {
        toValue: lift,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [keyboardLift, screenHeight]);

  const handlePlayerNameFocus = useCallback((index) => {
    setFocusedNameIndex(index);
    if (index === 0 && tutorialStep?.target === 'setup.playerName') {
      onTutorialAction?.('setup.playerNameFocused');
      requestAnimationFrame(() => reportNameTutorialTarget(0));
      setTimeout(() => reportNameTutorialTarget(0), 120);
      setTimeout(() => reportNameTutorialTarget(0), 260);
    } else if (index === 1 && tutorialStep?.target === 'setup.secondPlayerName') {
      onTutorialAction?.('setup.secondPlayerNameFocused');
      requestAnimationFrame(() => reportNameTutorialTarget(1));
      setTimeout(() => reportNameTutorialTarget(1), 120);
      setTimeout(() => reportNameTutorialTarget(1), 260);
    }
    requestAnimationFrame(() => {
      animateKeyboardLiftToFocusedName(index, keyboardTopRef.current, 340);
    });
  }, [animateKeyboardLiftToFocusedName, onTutorialAction, reportNameTutorialTarget, tutorialStep?.target]);

  const handlePlayerNameBlur = useCallback((index) => {
    setFocusedNameIndex(null);
    const actionName = index === 0 && tutorialStep?.target === 'setup.playerName'
      ? 'setup.playerNameDone'
      : index === 1 && tutorialStep?.target === 'setup.secondPlayerName'
        ? 'setup.secondPlayerNameDone'
        : null;

    if (actionName) {
      setTimeout(() => {
        onTutorialAction?.(actionName);
      }, 360);
    }
  }, [onTutorialAction, tutorialStep?.target]);

  useEffect(() => {
    if (!route?.params?.openSettings) {
      return;
    }

    requestAnimationFrame(() => {
      animateSettings(true);
    });
  }, []);

  useEffect(() => {
    if (!setupLayoutReady || !setupImagesReady) {
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
  }, [navigation, setupImagesReady, setupLayoutReady]);

  useEffect(() => {
    if (!tutorialActive) {
      return;
    }

    if (tutorialStep?.target === 'setup.theme') {
      reportTutorialTarget('setup.theme', themeTargetRef);
    } else if (tutorialStep?.target === 'setup.playerCar') {
      reportTutorialTarget('setup.playerCar', { current: carRefs.current[0] });
    } else if (tutorialStep?.target === 'setup.playerName') {
      reportTutorialTarget('setup.playerName', { current: focusedNamePlateRefs.current[0] });
    } else if (tutorialStep?.target === 'setup.secondPlayerCar') {
      const firstCarNode = carRefs.current[0];
      const secondCarNode = carRefs.current[1];
      if (firstCarNode?.measureInWindow && secondCarNode?.measureInWindow) {
        requestAnimationFrame(() => {
          firstCarNode.measureInWindow((_firstX, _firstY, firstWidth, firstHeight) => {
            secondCarNode.measureInWindow((secondX, secondY, secondWidth, secondHeight) => {
              const normalizedWidth = firstWidth || secondWidth;
              const normalizedHeight = firstHeight || secondHeight;

              onTutorialTargetLayout?.('setup.secondPlayerCar', {
                x: secondX + (secondWidth - normalizedWidth) / 2,
                y: secondY + (secondHeight - normalizedHeight) / 2,
                width: normalizedWidth,
                height: normalizedHeight,
              });
            });
          });
        });
      } else {
        reportTutorialTarget('setup.secondPlayerCar', { current: secondCarNode });
      }
    } else if (tutorialStep?.target === 'setup.secondPlayerName') {
      reportTutorialTarget('setup.secondPlayerName', { current: focusedNamePlateRefs.current[1] });
    } else if (tutorialStep?.target === 'setup.addPlayer') {
      reportTutorialTarget('setup.addPlayer', addPlayerTargetRef);
    } else if (tutorialStep?.target === 'setup.skinSelect') {
      reportTutorialTarget('setup.skinSelect', skinSelectTargetRef);
    } else if (tutorialStep?.target === 'setup.rules') {
      reportTutorialTarget('setup.rules', rulesTargetRef);
    } else if (tutorialStep?.target === 'setup.rulesPanel') {
      reportTutorialTarget('setup.rulesPanel', rulesPanelTargetRef);
    } else if (tutorialStep?.target === 'setup.rulesDiagonal') {
      reportTutorialTarget('setup.rulesDiagonal', rulesDiagonalTargetRef);
    } else if (tutorialStep?.target === 'setup.start') {
      reportTutorialTarget('setup.start', startTargetRef);
    }

    if (
      (tutorialStep?.target === 'setup.playerName' && focusedNameIndex === 0)
      || (tutorialStep?.target === 'setup.secondPlayerName' && focusedNameIndex === 1)
    ) {
      const timers = [60, 160, 300, 460].map((delay) => (
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), delay)
      ));

      return () => timers.forEach(clearTimeout);
    }
  }, [
    focusedNameIndex,
    onTutorialTargetLayout,
    playerCount,
    reportNameTutorialTarget,
    reportTutorialTarget,
    screenHeight,
    screenWidth,
    skinPickerMounted,
    settingsPanelVisible,
    tutorialActive,
    tutorialStep?.target,
  ]);

  useEffect(() => {
    Animated.timing(playerLayoutProgress, {
      toValue: spelers.length >= 2 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playerLayoutProgress, spelers.length]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(firstPlayerFocusProgress, {
        toValue: focusedNameIndex === 0 ? 1 : 0,
        duration: focusedNameIndex === 0 ? 360 : 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(secondPlayerFocusProgress, {
        toValue: focusedNameIndex === 1 ? 1 : 0,
        duration: focusedNameIndex === 1 ? 360 : 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [firstPlayerFocusProgress, focusedNameIndex, secondPlayerFocusProgress]);

  useLayoutEffect(() => {
    if (!pendingGameStart) {
      return;
    }

    if (playRevealStartedKeyRef.current === pendingGameStart.transitionKey) {
      return;
    }

    playRevealStartedKeyRef.current = pendingGameStart.transitionKey;
    playRevealRef.current?.reveal();
  }, [pendingGameStart]);

  useEffect(() => {
    panelHeight.setValue(expandedPanelHeight);
    settingsProgress.setValue(settingsOpen ? 1 : 0);
  }, [collapsedPanelHeight, expandedPanelHeight, panelHeight]);

  useEffect(() => {
    preloadSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND);
    preloadSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND);
  }, []);

  useEffect(() => {
    if (initialConfig?.spelers?.length) {
      return undefined;
    }

    let cancelled = false;

    AsyncStorage.getItem(EQUIPPED_SKIN_STORAGE_KEY).then((storedSkin) => {
      if (
        cancelled
        || !SKIN_OPTIONS.includes(storedSkin)
        || !isSkinAvailableForPlayer(storedSkin, { isPremium, ownedPaidSkins })
      ) {
        return;
      }

      setSpelers((current) => current.map((player, index) => (
        index === 0 ? { ...player, skin: storedSkin } : player
      )));
    }).catch(() => {
      // Rood blijft de standaard als de opgeslagen keuze niet leesbaar is.
    });

    return () => {
      cancelled = true;
    };
  }, [initialConfig?.spelers?.length, isPremium, ownedPaidSkins]);

  useEffect(() => {
    Animated.timing(addPlayerFocusOpacity, {
      toValue: isEditingPlayerName ? 0 : 1,
      duration: isEditingPlayerName ? 160 : 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [addPlayerFocusOpacity, isEditingPlayerName]);

  useEffect(() => {
    if (!isEditingPlayerName) {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    animateKeyboardLiftToFocusedName(focusedNameIndex, keyboardTopRef.current, 360);
  }, [animateKeyboardLiftToFocusedName, focusedNameIndex, isEditingPlayerName, keyboardLift]);

  useEffect(() => {
    Animated.timing(nameFocusDimOpacity, {
      toValue: isEditingPlayerName ? 1 : 0,
      duration: isEditingPlayerName ? 220 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isEditingPlayerName, nameFocusDimOpacity]);

  useEffect(() => {
    const handleKeyboardShow = (event) => {
      const keyboardTop = event.endCoordinates?.screenY ?? (screenHeight - (event.endCoordinates?.height ?? 0));
      keyboardTopRef.current = keyboardTop;

      if (focusedNameIndex !== null) {
        requestAnimationFrame(() => {
          animateKeyboardLiftToFocusedName(focusedNameIndex, keyboardTop, event.duration ?? 250);
          reportNameTutorialTarget(focusedNameIndex);
        });
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), 120);
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), 260);
      }
    };
    const handleKeyboardHide = (event) => {
      keyboardTopRef.current = estimatedKeyboardTop;
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: Math.max(event.duration ?? 380, 380),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (focusedNameIndex !== null) {
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), 120);
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), 300);
        setTimeout(() => reportNameTutorialTarget(focusedNameIndex), 460);
      }
    };

    const willShowSubscription = Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
    const didShowSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const willHideSubscription = Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    const didHideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      willShowSubscription.remove();
      didShowSubscription.remove();
      willHideSubscription.remove();
      didHideSubscription.remove();
    };
  }, [animateKeyboardLiftToFocusedName, estimatedKeyboardTop, focusedNameIndex, keyboardLift, reportNameTutorialTarget, screenHeight]);

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
    onTutorialAction?.('setup.rulesOpened');
  }

  function closeSettings() {
    void playSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND, settings);
    animateSettings(false);
    onTutorialAction?.('setup.rulesClosed');
  }

  function dismissNameEditing() {
    Keyboard.dismiss();
    setFocusedNameIndex(null);
  }

  function handleAddPlayer() {
    if (spelers.length >= MAX_LOCAL_PLAYERS) {
      return;
    }

    void Haptics.selectionAsync();
    const preferredSkin = SKIN_OPTIONS.find((skin) => !spelers.some((player) => player.skin === skin)) ?? 'blauw';
    setSpelers((current) => [
      ...current,
      { ...createPlayer({ skin: preferredSkin }), naam: getDefaultPlayerNameForLanguage(language, current.length) },
    ]);
    onTutorialAction?.('setup.playerAdded');
  }

  function handleRemovePlayer(index) {
    if (index === 0) {
      return;
    }

    if (secondPlayerRemovalLockedByTutorial) {
      return;
    }

    void Haptics.selectionAsync();
    dismissNameEditing();
    setSpelers((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setKaartOpzet('zelfde');
  }

  function updatePlayerName(index, naam) {
    setSpelers((current) => current.map((player, currentIndex) => (
      currentIndex === index ? { ...player, naam: naam.slice(0, MAX_PLAYER_NAME_LENGTH) } : player
    )));
  }

  function animatePickerOpen(index) {
    onTutorialAction?.('setup.skinPickerOpened');
    const targetRef = carRefs.current[index];
    targetRef?.measureInWindow?.((x, y, width) => {
      const sourceSize = spelers.length >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
      const measuredWidth = width || sourceSize;
      const sourceLeft = x + (measuredWidth - sourceSize) / 2;
      const destinationLeft = (screenWidth - sourceSize) / 2;

      setHeroTop(y);
      setTransitionSourceLeft(sourceLeft);
      setTransitionSkin(spelers[index]?.skin ?? 'rood');
      setTransitionCarSize(sourceSize);
      setSelectedPlayerIndex(index);
      setSkinPickerMounted(true);
      overlayOpacity.setValue(0);
      carouselOpacity.setValue(0);
      transitionOpacity.setValue(1);
      transitionTranslateX.setValue(0);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(carouselOpacity, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(transitionOpacity, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(transitionTranslateX, {
            toValue: destinationLeft - sourceLeft,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }

  function animatePickerClose(nextSkin) {
    const closingPlayerIndex = selectedPlayerIndex;
    if (closingPlayerIndex === null) {
      return;
    }

    transitionOpacity.setValue(1);
    transitionTranslateX.stopAnimation();

    if (nextSkin) {
      setTransitionSkin(nextSkin);
      setSpelers((current) => current.map((player, index) => (
        index === closingPlayerIndex ? { ...player, skin: nextSkin } : player
      )));
    }

    Animated.parallel([
      Animated.timing(carouselOpacity, {
        toValue: 0,
        duration: 90,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionTranslateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedPlayerIndex(null);
      setSkinPickerMounted(false);
    });
  }

  function handlePlayPressIn(event) {
    if (selectedThemeLocked || !canStart) {
      latestPlayPressPointRef.current = null;
      return;
    }

    latestPlayPressPointRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
  }

  function handleStart() {
    if (playStartLockedRef.current || pendingGameStart) {
      return;
    }

    if (selectedThemeLocked) {
      setPremiumModalVisible(true);
      return;
    }

    if (!canStart) {
      return;
    }

    playStartLockedRef.current = true;
    dismissNameEditing();

    const config = createGameConfig({
      thema: selectedTheme.id,
      wincondition,
      diagonaal,
      kaartOpzet: playerCount === 2 ? kaartOpzet : 'zelfde',
      nederlands,
      modus: 'solo',
      syncType: 'geen',
      aantalSpelersOpDitApparaat: playerCount,
      spelers,
    });
    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences({
        wincondition,
        diagonaal,
        kaartOpzet,
        nederlands,
      })
    );

    const origin = latestPlayPressPointRef.current ?? {
      x: screenWidth / 2,
      y: screenHeight - 120,
    };

    setPendingGameStart({
      config,
      originX: origin.x,
      originY: origin.y,
      transitionKey: `singleplayer-spel-${Date.now()}`,
    });
  }

  function handleThemeSnap(index) {
    if (index !== selectedThemeIndex) {
      onTutorialAction?.('setup.themeChanged');
    }

    setSelectedThemeIndex(index);
  }

  return (
    <View
      style={styles.safeArea}
      onLayout={() => setSetupLayoutReady(true)}
    >
      <WarmupImages
        assets={SETUP_ASSETS}
        timeoutMs={null}
        imageSize={128}
        batchSize={16}
        onReady={handleSetupWarmupReady}
      />
      <ImageBackground
        source={GAME_SETUP_BACKGROUND}
        resizeMode="cover"
        style={styles.background}
        fadeDuration={0}
        onLoadEnd={() => markSetupCriticalImageLoaded('background')}
      >
        <SafeAreaView style={styles.safeAreaContent}>
          <View
            pointerEvents={isEditingPlayerName ? 'none' : 'auto'}
            style={[
              styles.backButton,
              isEditingPlayerName && styles.backButtonDimmed,
            ]}
          >
            <AnimatedRouteBackButton
              navigation={navigation}
              size={66}
            />
          </View>
          <View
            style={[
              styles.content,
              compactSetupLift > 0 && {
                transform: [{ translateY: -compactSetupLift }],
              },
            ]}
          >
            <SetupTitleBlock label={t('game.bingoTheme')} metrics={setupMetrics} />
            <View ref={themeTargetRef} collapsable={false} style={styles.topBlock}>
              <ThemeCarousel
                items={localizedThemeCards}
                itemSpacing={10}
                itemWidth={THEME_CARD_WIDTH}
                keyExtractor={(item) => item.id}
                loop={Platform.OS !== 'android'}
                focusedIndex={selectedThemeIndex}
                onSnapToItem={handleThemeSnap}
                flatListProps={{ scrollEnabled: !isEditingPlayerName }}
                renderCard={({ item }) => (
                  <ThemeCard
                    item={item}
                    isPremium={isPremium}
                    onLockedPress={() => setPremiumModalVisible(true)}
                    onImageLoadEnd={markThemeCardImageLoaded}
                  />
                )}
              />
            </View>

            <SetupTitleBlock label={t('home.players')} metrics={setupMetrics} style={styles.playerTitleBlock} />
            <Animated.View
              pointerEvents={isEditingPlayerName ? 'auto' : 'none'}
              style={[
                styles.nameFocusShield,
                { opacity: nameFocusDimOpacity },
              ]}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={dismissNameEditing} />
            </Animated.View>

            <Animated.View pointerEvents="box-none" style={styles.playerStageSection}>
              <Animated.View
                pointerEvents={focusedNameIndex === 1 ? 'none' : 'auto'}
                style={[
                  styles.playerStageSlot,
                  {
                    opacity: firstPlayerStageOpacity,
                    transform: [
                      { translateX: firstPlayerStageTranslateX },
                      { translateY: firstPlayerStageTranslateY },
                    ],
                    zIndex: focusedNameIndex === 0 ? 5 : 1,
                  },
                ]}
              >
                <View ref={(node) => { carRefs.current[0] = node; }} collapsable={false}>
                  <AttentionCarButton
                    skin={spelers[0]?.skin}
                    size={stageCarSize}
                    style={skinPickerMounted && selectedPlayerIndex === 0 ? styles.heroCarButtonHidden : null}
                    onPress={() => animatePickerOpen(0)}
                    active={!skinPickerMounted && !isEditingPlayerName}
                    attentionDelay={0}
                    onImageLoadEnd={() => markSetupCriticalImageLoaded('player')}
                  />
                </View>
                <PlayerNameInput
                  outerRef={(node) => { focusedNamePlateRefs.current[0] = node; }}
                  value={spelers[0]?.naam ?? ''}
                  skin={spelers[0]?.skin ?? 'rood'}
                  defaultName={getDefaultPlayerNameForLanguage(language, 0)}
                  onChangeText={(naam) => updatePlayerName(0, naam)}
                  onFocus={() => handlePlayerNameFocus(0)}
                  onBlur={() => handlePlayerNameBlur(0)}
                  hidden={skinPickerMounted && selectedPlayerIndex === 0}
                />
              </Animated.View>

              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.playerStageSlot,
                  {
                    transform: [
                      { translateX: secondPlayerStageTranslateX },
                      { translateY: secondPlayerStageTranslateY },
                    ],
                    zIndex: focusedNameIndex === 1 ? 5 : 1,
                  },
                ]}
              >
                <Animated.View
                  pointerEvents={spelers.length >= 2 || skinPickerMounted || isEditingPlayerName ? 'none' : 'auto'}
                  style={[
                    styles.stageOverlay,
                    {
                      opacity: skinPickerMounted ? 0 : Animated.multiply(addButtonOpacity, addPlayerFocusOpacity),
                      transform: [{ translateX: addButtonTranslateX }],
                    },
                  ]}
                >
                  <AddPlayerButton visible={spelers.length < 2} onPress={handleAddPlayer} outerRef={addPlayerTargetRef} />
                </Animated.View>

                {spelers[1] ? (
                  <Animated.View
                    pointerEvents={focusedNameIndex === 0 ? 'none' : 'auto'}
                    style={[
                      styles.stageOverlay,
                      {
                        opacity: secondPlayerStageOpacity,
                        transform: [
                          { translateY: secondPlayerTranslateY },
                          { scale: secondPlayerScale },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.secondaryPlayerWrap}>
                      <View ref={(node) => { carRefs.current[1] = node; }} collapsable={false}>
                        <AttentionCarButton
                          skin={spelers[1]?.skin}
                          size={stageCarSize}
                          style={skinPickerMounted && selectedPlayerIndex === 1 ? styles.heroCarButtonHidden : null}
                          onPress={() => animatePickerOpen(1)}
                          active={!skinPickerMounted && !isEditingPlayerName}
                          attentionDelay={CAR_ATTENTION_STAGGER_MS}
                        />
                      </View>
                      <PlayerNameInput
                        outerRef={(node) => { focusedNamePlateRefs.current[1] = node; }}
                        value={spelers[1]?.naam ?? ''}
                        skin={spelers[1]?.skin ?? 'blauw'}
                        defaultName={getDefaultPlayerNameForLanguage(language, 1)}
                        onChangeText={(naam) => updatePlayerName(1, naam)}
                        onFocus={() => handlePlayerNameFocus(1)}
                        onBlur={() => handlePlayerNameBlur(1)}
                        hidden={skinPickerMounted && selectedPlayerIndex === 1}
                      />
                      {skinPickerMounted && selectedPlayerIndex === 1 ? null : (
                        <Animated.View
                          pointerEvents={focusedNameIndex === 1 || secondPlayerRemovalLockedByTutorial ? 'none' : 'auto'}
                          style={[
                            styles.removeButton,
                            {
                              opacity: secondPlayerRemoveOpacity,
                              transform: [{ scale: secondPlayerRemoveScale }],
                            },
                          ]}
                        >
                          <Pressable
                            disabled={secondPlayerRemovalLockedByTutorial}
                            style={styles.removeButtonPressable}
                            onPress={() => handleRemovePlayer(1)}
                          >
                            <RemovePlayerIcon size={34} />
                          </Pressable>
                        </Animated.View>
                      )}
                    </View>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </Animated.View>

            <View ref={startTargetRef} collapsable={false} style={styles.actionStack}>
              <GlossyButton
                label={t('home.play')}
                variant="blue"
                size="large"
                onPressIn={handlePlayPressIn}
                onPress={handleStart}
                disabled={!canStart || Boolean(pendingGameStart)}
              />
            </View>
          </View>

          {settingsPanelVisible ? (
            <View
              pointerEvents={settingsOpen ? 'auto' : 'none'}
              style={styles.settingsBackdropLayer}
            >
              <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
              </Animated.View>
            </View>
          ) : null}
        </SafeAreaView>

        <SkinCarouselModal
          visible={skinPickerMounted && selectedPlayer !== null}
          selectedSkin={selectedPlayer?.skin ?? 'rood'}
          takenSkins={takenSkins}
          heroTop={heroTop}
          overlayOpacity={overlayOpacity}
          carouselOpacity={carouselOpacity}
          onClose={() => animatePickerClose()}
          onSelectSkin={(skin) => {
            onTutorialAction?.('setup.skinSelected');
            animatePickerClose(skin);
          }}
          selectTargetRef={skinSelectTargetRef}
          tutorialStep={tutorialStep?.id === 'setup-skin-picker' || tutorialStep?.id === 'setup-second-skin-picker' ? tutorialStep : null}
        />

        {skinPickerMounted && selectedPlayer !== null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.transitionCar,
              {
                top: heroTop,
                left: transitionSourceLeft,
                opacity: transitionOpacity,
                transform: [{ translateX: transitionTranslateX }],
              },
            ]}
          >
            <PlayerAvatar skin={transitionSkin} size={transitionCarSize} />
          </Animated.View>
        ) : null}

        <View
          pointerEvents={isEditingPlayerName ? 'none' : 'box-none'}
          style={styles.bottomDock}
        >
          <Animated.View
            ref={rulesPanelTargetRef}
            collapsable={false}
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
              resizeMode="stretch"
              style={styles.rulesPanelImage}
              imageStyle={styles.rulesPanelImageAsset}
            />
            <Pressable
              ref={rulesTargetRef}
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
                <SettingsRuleSlider
                  title={t('game.rules.winCondition')}
                  titleIcon={SETTINGS_WIN_CONDITION_TITLE_ICON}
                  value={wincondition}
                  options={localizedWinOptions}
                  onChange={setWincondition}
                  metrics={setupMetrics}
                  info={{ id: 'single-rule-wincondition', ...localizedRuleInfo.wincondition }}
                  onInfoPress={showInfoPopover}
                />

                <SettingsRuleSlider
                  title={t('game.rules.diagonal')}
                  titleIcon={SETTINGS_DIAGONAL_TITLE_ICON}
                  value={diagonaal}
                  options={localizedDiagonalOptions}
                  onChange={setDiagonaal}
                  metrics={setupMetrics}
                  variant="diagonal"
                  targetRef={rulesDiagonalTargetRef}
                  tutorialActionName={tutorialStep?.target === 'setup.rulesDiagonal' ? 'setup.diagonalChanged' : null}
                  onTutorialAction={onTutorialAction}
                  info={{ id: 'single-rule-diagonal', ...localizedRuleInfo.diagonal }}
                  onInfoPress={showInfoPopover}
                />

                <SettingsRuleSlider
                  title={t('game.rules.dutchItems')}
                  titleIcon={SETTINGS_DUTCH_ITEMS_TITLE}
                  value={nederlands}
                  options={localizedDutchOptions}
                  onChange={setNederlands}
                  metrics={setupMetrics}
                  variant="dutch"
                  info={{ id: 'single-rule-dutch', ...localizedRuleInfo.dutch }}
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
                    info={{ id: 'single-rule-card-layout', ...localizedRuleInfo.cardLayout }}
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
              accessibilityLabel={t('game.gameRules')}
              onPress={openSettings}
              style={[
                styles.collapsedPanelPressTarget,
                { height: collapsedPanelHeight + Math.round(24 * scale) },
              ]}
            />
          ) : null}
        </View>
        <InfoPopoverOverlay
          popover={activeInfoPopover}
          progress={infoPopoverProgress}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          onClose={closeInfoPopover}
        />
      </ImageBackground>
      {pendingGameStart ? (
        <CircularReveal
          key={pendingGameStart.transitionKey}
          ref={playRevealRef}
          color={PLAY_TRANSITION_BLUE}
          originX={pendingGameStart.originX}
          originY={pendingGameStart.originY}
          onComplete={() => {
            navigation.navigate('Spel', {
              config: pendingGameStart.config,
              tutorialMode,
              transition: {
                color: PLAY_TRANSITION_BLUE,
                originX: screenWidth / 2,
                originY: screenHeight / 2,
                routeName: 'Spel',
                pauseMs: 80,
                minSolidMs: 560,
                settleMs: 220,
                routeReadySettleMs: 520,
                transitionKey: pendingGameStart.transitionKey,
              },
            });
          }}
        />
      ) : null}
      <PremiumPaywallModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUnlocked={() => setPremiumModalVisible(false)}
        title={t('game.premiumTheme')}
        message={t('game.premiumThemeMessage')}
      />
    </View>
  );
}

function PlayerAvatar({ skin = 'rood', size = 96, style, onImageLoadEnd }) {
  const source = PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.rood;
  const shadowWidth = size * 0.76;
  const shadowHeight = size * 0.18;

  return (
    <View style={[styles.playerAvatarWrap, { width: size, height: size }, style]}>
      <Svg
        width={shadowWidth}
        height={shadowHeight}
        viewBox={`0 0 ${shadowWidth} ${shadowHeight}`}
        style={[styles.carGroundShadow, { bottom: size * 0.18 }]}
      >
        <Defs>
          <RadialGradient id="setupCarShadowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#111820" stopOpacity="0.2" />
            <Stop offset="52%" stopColor="#111820" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#111820" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={shadowWidth / 2} cy={shadowHeight / 2} rx={shadowWidth / 2} ry={shadowHeight / 2} fill="url(#setupCarShadowGradient)" />
      </Svg>
      <ExpoImage
        source={source}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={0}
        onLoad={onImageLoadEnd}
        onError={onImageLoadEnd}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

function AttentionCarButton({ skin, size, onPress, active = true, style, attentionDelay = 0, onImageLoadEnd }) {
  const attention = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || ANDROID_DISABLE_SETUP_IDLE_MOTION) {
      attention.stopAnimation();
      attention.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(CAR_ATTENTION_DELAY_MS + attentionDelay),
        Animated.timing(attention, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0.45,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, attention, attentionDelay]);

  const translateY = attention.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const rotate = attention.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-1.8deg', '1.8deg'],
  });

  return (
    <Pressable style={[styles.heroCarButton, style]} onPress={onPress} disabled={!active}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <PlayerAvatar skin={skin} size={size} onImageLoadEnd={onImageLoadEnd} />
      </Animated.View>
    </Pressable>
  );
}

function PlayerNameInput({
  outerRef,
  value,
  skin = 'rood',
  defaultName = 'Speler',
  onChangeText,
  onFocus,
  onBlur,
  hidden = false,
}) {
  const carColor = PLAYER_HEX[skin] ?? PLAYER_HEX.rood ?? '#E03030';
  const handleFocus = () => {
    onFocus?.();
    if (value === defaultName) {
      onChangeText('');
    }
  };
  const handleBlur = () => {
    if (!value.trim()) {
      onChangeText(defaultName);
    }
    onBlur?.();
  };

  return (
    <Pressable
      ref={outerRef}
      collapsable={false}
      onPress={(event) => event.stopPropagation()}
      style={[
        styles.playerNamePlate,
        {
          backgroundColor: carColor,
          shadowColor: carColor,
        },
        hidden && styles.playerNameInputHidden,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 253, 245, 0.98)', 'rgba(255, 246, 225, 0.9)', 'rgba(245, 232, 204, 0.88)']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.playerNamePlateInner}
      >
        <View pointerEvents="none" style={styles.playerNamePlateGloss} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={defaultName}
          placeholderTextColor="rgba(20, 71, 102, 0.55)"
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
          style={styles.playerNameInput}
        />
      </LinearGradient>
    </Pressable>
  );
}

function AddPlayerButton({ visible, onPress, outerRef }) {
  if (!visible) {
    return null;
  }

  return (
    <Pressable ref={outerRef} collapsable={false} style={styles.addPlayerButton} onPress={onPress}>
      <Image source={PLAYER_SILHOUETTE_IMAGE} style={styles.addPlayerButtonImage} resizeMode="contain" />
    </Pressable>
  );
}

function SkinCarouselModal({
  visible,
  selectedSkin,
  takenSkins,
  heroTop,
  overlayOpacity,
  carouselOpacity,
  onClose,
  onSelectSkin,
  selectTargetRef,
  tutorialStep,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { language, t } = useTranslation();
  const { isPremium, ownedPaidSkins } = usePremium();
  const [challengeProgress, setChallengeProgress] = useState(null);
  const [challengeProgressReady, setChallengeProgressReady] = useState(false);
  const [selectRect, setSelectRect] = useState(null);
  const tutorialHandProgress = useRef(new Animated.Value(0)).current;
  const selectedSkinIndex = Math.max(0, SKIN_OPTIONS.indexOf(selectedSkin));
  const [activeIndex, setActiveIndex] = useState(selectedSkinIndex);

  useEffect(() => {
    if (visible) {
      setActiveIndex(selectedSkinIndex);
      setChallengeProgressReady(false);
      void loadSkinChallengeProgress().then((progress) => {
        setChallengeProgress(progress);
      }).finally(() => {
        setChallengeProgressReady(true);
      });
    }
  }, [selectedSkinIndex, visible]);

  useEffect(() => {
    if (!visible || !tutorialStep) {
      setSelectRect(null);
      return;
    }

    const measureTimer = setTimeout(() => {
      selectTargetRef?.current?.measureInWindow?.((x, y, width, height) => {
        setSelectRect({ x, y, width, height });
      });
    }, 80);

    return () => clearTimeout(measureTimer);
  }, [selectTargetRef, tutorialStep, visible]);

  useEffect(() => {
    tutorialHandProgress.stopAnimation();
    tutorialHandProgress.setValue(0);

    if (!visible || !tutorialStep) {
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(tutorialHandProgress, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tutorialHandProgress, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(260),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [tutorialHandProgress, tutorialStep, visible]);

  const activeSkin = SKIN_OPTIONS[activeIndex] ?? selectedSkin;
  const activeSkinTaken = takenSkins.includes(activeSkin) && activeSkin !== selectedSkin;
  const activeSkinLocked = (
    (isChallengeSkin(activeSkin) && (!challengeProgressReady || !isSkinUnlocked(challengeProgress, activeSkin)))
    || !isSkinAvailableForPlayer(activeSkin, { isPremium, ownedPaidSkins })
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalBackdrop, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              paddingTop: heroTop,
              opacity: carouselOpacity,
              transform: [
                {
                  scale: carouselOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <ThemeCarousel
            items={SKIN_OPTIONS}
            itemWidth={224}
            itemSpacing={0}
            loop={Platform.OS !== 'android'}
            decelerationRate={Platform.OS === 'ios' ? 0.94 : 0.88}
            focusSwitchThreshold={0.2}
            scrollSoundStepIntervalMs={34}
            onSnapToItem={setActiveIndex}
            keyExtractor={(item) => item}
            containerStyle={styles.carouselWrap}
            flatListProps={{ initialScrollIndex: selectedSkinIndex }}
            renderCard={({ item }) => (
              (() => {
                const itemChallengeLocked = isChallengeSkin(item)
                  && challengeProgressReady
                  && !isSkinUnlocked(challengeProgress, item);
                const itemLocked = itemChallengeLocked || !isSkinAvailableForPlayer(item, { isPremium, ownedPaidSkins });
                const itemLockImage = isPremiumChallengeSkin(item) && !isPremium
                  ? PREMIUM_SKIN_LOCK_IMAGE
                  : itemChallengeLocked
                  ? CHALLENGE_SKIN_LOCK_IMAGE
                  : PREMIUM_SKIN_LOCK_IMAGE;

                return (
              <View
                style={[
                  styles.carouselCardShellPicker,
                  { shadowColor: PLAYER_HEX[item] ?? PLAYER_HEX.geel },
                ]}
              >
                <View
                  style={[
                    styles.carouselCardPicker,
                    takenSkins.includes(item) && item !== selectedSkin ? styles.carouselCardTaken : null,
                  ]}
                >
                  <View style={itemLocked ? styles.challengeSkinLockedCar : null}>
                    <PlayerAvatar skin={item} size={CAROUSEL_CAR_SIZE} />
                  </View>
                  {itemLocked ? (
                    <Image
                      source={itemLockImage}
                      style={styles.challengeSkinLock}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
                );
              })()
            )}
          />

          <View ref={selectTargetRef} collapsable={false} style={styles.selectButtonWrap}>
            <GlossyButton
              label={t('common.select')}
              variant="green"
              size="normal"
              heightOverride={62}
              horizontalPadding={44}
              onPress={() => onSelectSkin(activeSkin)}
              disabled={activeSkinTaken || activeSkinLocked}
            />
          </View>

          <SkinChallengeProgressPanel
            skin={activeSkin}
            progress={challengeProgress}
            language={language}
            isPremium={isPremium}
          />
        </Animated.View>
        {tutorialStep ? (
          (() => {
            const tutorialBubbleWidth = Math.min(screenWidth * 0.9, 430);
            const tutorialBubbleHeight = tutorialBubbleWidth * 0.74;
            const tutorialBubbleLeft = Math.max(10, (screenWidth - tutorialBubbleWidth) / 2);
            const tutorialBubbleTop = Math.max(42, screenHeight * 0.07);
            const tutorialCarSize = Math.min(screenWidth * 0.34, 172);
            const tutorialCarLeft = Math.min(
              screenWidth - tutorialCarSize * 0.72,
              tutorialBubbleLeft + tutorialBubbleWidth * 0.68
            );
            const tutorialCarTop = tutorialBubbleTop + tutorialBubbleHeight * 0.72;

            return (
              <View pointerEvents="none" style={styles.skinTutorialCoachLayer}>
                <TutorialCoachContent
                  step={tutorialStep}
                  fontFamily="FredokaOne_400Regular"
                  bubbleWidth={tutorialBubbleWidth}
                  bubbleHeight={tutorialBubbleHeight}
                  bubbleLeft={tutorialBubbleLeft}
                  bubbleTop={tutorialBubbleTop}
                  carSize={tutorialCarSize}
                  carLeft={tutorialCarLeft}
                  carTop={tutorialCarTop}
                />
                {selectRect ? (
                  <Animated.Image
                    source={TUTORIAL_HAND_IMAGE}
                    resizeMode="contain"
                    style={[
                      styles.skinTutorialHand,
                      {
                        left: selectRect.x + selectRect.width * 0.66,
                        top: selectRect.y + 18,
                        transform: [
                          {
                            translateY: tutorialHandProgress.interpolate({
                              inputRange: [0, 0.55, 1],
                              outputRange: [-12, 14, -12],
                            }),
                          },
                          {
                            scale: tutorialHandProgress.interpolate({
                              inputRange: [0, 0.55, 1],
                              outputRange: [1, 0.84, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ) : null}
              </View>
            );
          })()
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function SkinChallengeProgressPanel({ skin, progress, language, isPremium }) {
  const challenge = SKIN_CHALLENGES[skin];

  if (!challenge) {
    return <View style={styles.challengePanelPlaceholder} />;
  }

  const premiumChallengeLocked = isPremiumChallengeSkin(skin) && !isPremium;
  const progressValue = getChallengeProgressValue(progress, skin);
  const ratio = progressValue.target > 0 ? progressValue.current / progressValue.target : 1;

  return (
    <View style={styles.challengePanel}>
      <Text style={styles.challengeTitle}>{getSkinLabel(language, skin, challenge.title)}</Text>
      <Text style={styles.challengeDescription}>
        {premiumChallengeLocked
          ? translate(language, 'home.premiumChallengeLocked')
          : getSkinChallengeDescription(language, skin, challenge.description)}
      </Text>
      {premiumChallengeLocked ? null : (
        <View style={styles.challengeProgressRow}>
          <View style={styles.challengeProgressTrack}>
            <View
              style={[
                styles.challengeProgressFill,
                { width: `${Math.max(0, Math.min(1, ratio)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.challengeProgressText}>
            {progressValue.current} / {progressValue.target}
          </Text>
        </View>
      )}
    </View>
  );
}

function SetupTitleBlock({ label, metrics, style }) {
  const titleScale = metrics?.scale ?? 1;
  const blockStyle = metrics ? {
    minWidth: Math.round(222 * titleScale),
    minHeight: Math.round(46 * titleScale),
    paddingHorizontal: Math.round(20 * titleScale),
    marginTop: metrics.titleMarginTop,
    marginBottom: metrics.titleMarginBottom,
  } : null;
  const textStyle = metrics ? {
    fontSize: Math.round(22 * titleScale),
    lineHeight: Math.round(27 * titleScale),
  } : null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.titleBlock,
        blockStyle,
        style,
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
        style={[styles.titleBlockText, textStyle]}
      >
        {label}
      </Text>
    </View>
  );
}

function ThemeCard({ item, isPremium = false, onLockedPress, onImageLoadEnd }) {
  const themeImage = getThemeCardImage(item.id);
  const isLocked = item.premium && !isPremium;
  const usesEmbeddedFrame = isEmbeddedThemeCard(item.id);
  const cardBorderColor = item.outline ?? item.border;
  const titleStyle = usesEmbeddedFrame
    ? [
        styles.carouselCardTitleWrapEmbedded,
        item.id === 'verkeersborden' && styles.carouselCardTitleWrapEmbeddedWide,
      ]
    : {
        top: 26,
        left: 12,
        right: 12,
      };
  const titleScale = getEmbeddedThemeTitleScale(item.id);
  const isTrafficSignsTitle = item.id === 'verkeersborden';
  const shouldAutoFitTitle = !usesEmbeddedFrame || isTrafficSignsTitle;
  const minimumTitleScale = isTrafficSignsTitle ? 0.58 : usesEmbeddedFrame ? 0.88 : 0.58;
  const titleTextStyle = {
    fontSize: Math.round((usesEmbeddedFrame ? 32 : 28) * titleScale),
    lineHeight: Math.round((isTrafficSignsTitle ? 34 : usesEmbeddedFrame ? 42 : 34) * titleScale),
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
            ]}
          >
            <ExpoImage
              source={themeImage}
              contentFit={usesEmbeddedFrame ? 'contain' : 'cover'}
              cachePolicy="memory-disk"
              transition={0}
              onLoad={onImageLoadEnd}
              onError={onImageLoadEnd}
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
                  item.id === 'verkeersborden' && styles.carouselCardTitleNoWrap,
                ]}
              >
                {item.title}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.carouselCardBody, { backgroundColor: item.surface }]}>
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
      accessibilityLabel={`Info: ${info.title}`}
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

function SettingsRuleSlider({
  title,
  titleIcon,
  value,
  options,
  onChange,
  metrics,
  variant = 'win',
  targetRef = null,
  tutorialActionName = null,
  onTutorialAction = null,
  info = null,
  onInfoPress = null,
}) {
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
  const frameWidth = Math.round(clamp(metrics.scale * 346, 314, 382));
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
      if (tutorialActionName) {
        onTutorialAction?.(tutorialActionName);
      }
      return;
    }

    void Haptics.selectionAsync();
    onChange(option.id);
    animateSelectorToIndex(index);
    popSelector(1.055);
    if (tutorialActionName) {
      onTutorialAction?.(tutorialActionName);
    }
  }

  useEffect(() => {
    animateSelectorToIndex(selectedIndex);
  }, [selectedIndex, selectorWidth]);

  return (
    <View ref={targetRef} collapsable={false} style={styles.settingsRuleSection}>
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
                fontSize: Math.round((isDutch || isCardLayout ? 27 : 29) * metrics.scale),
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
              const baseLabelSize = isDiagonal ? 25 : isDutch ? 18 : isCardLayout ? 18 : 20;
              const labelSize = isLongLabel && !isFullCardLabel
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
                      numberOfLines={isDutch || isCardLayout || isFullCardLabel ? 2 : 1}
                      adjustsFontSizeToFit
                      minimumFontScale={isFullCardLabel ? 0.82 : 0.7}
                      style={[
                        styles.settingsRuleOptionLabel,
                        {
                          fontSize: Math.round(labelSize * metrics.scale),
                          lineHeight: Math.round((labelSize + (isDutch || isCardLayout || isFullCardLabel ? 5 : 9)) * metrics.scale),
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
          { fontSize: Math.round(21 * metrics.scale) },
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
    paddingTop: 12,
    paddingBottom: 152,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    elevation: 20,
  },
  backButtonDimmed: {
    zIndex: 2,
    elevation: 2,
  },
  topBlock: {
    marginTop: 4,
    marginHorizontal: -24,
    zIndex: 1,
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
    zIndex: 2,
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
  actionStack: {
    gap: 20,
    marginTop: -8,
    zIndex: 1,
  },
  nameFocusShield: {
    position: 'absolute',
    top: -220,
    left: -24,
    right: -24,
    bottom: -260,
    zIndex: 3,
    backgroundColor: 'rgba(5, 12, 22, 0.42)',
  },
  playerStageSection: {
    height: 252,
    position: 'relative',
    marginTop: 8,
    marginBottom: 0,
    zIndex: 4,
  },
  playerTitleBlock: {
    marginTop: 18,
  },
  playerStageSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  stageOverlay: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: -8,
  },
  heroCarButtonHidden: {
    opacity: 0,
  },
  secondaryPlayerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  secondaryCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlayerButton: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 49,
  },
  addPlayerButtonImage: {
    width: 62,
    height: 62,
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    bottom: 28,
    width: 34,
    height: 34,
  },
  removeButtonPressable: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.54)',
  },
  settingsBackdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  bottomDock: {
    position: 'absolute',
    left: -8,
    right: -8,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
  },
  collapsedPanelPressTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelShell: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  rulesPanelImage: {
    ...StyleSheet.absoluteFillObject,
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
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
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
    zIndex: 4,
    elevation: 0,
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
    zIndex: 1,
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
  settingsRuleInfoButton: {
    position: 'absolute',
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
  infoButton: {
    width: 34,
    height: 34,
    zIndex: 12,
  },
  infoButtonImage: {
    width: '100%',
    height: '100%',
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
    width: THEME_CARD_WIDTH,
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
  },
  carouselCardBodyEmbedded: {
    height: THEME_CARD_HEIGHT,
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
  carouselCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    lineHeight: 40,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.78)',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  skinTutorialCoachLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  skinTutorialHand: {
    position: 'absolute',
    width: 96,
    height: 96,
  },
  carouselWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardShellPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  carouselCardShellMuted: {
    opacity: 0.55,
  },
  carouselCardPicker: {
    width: CAROUSEL_CAR_SIZE,
    height: CAROUSEL_CAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeSkinLock: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 96,
    height: 96,
    marginLeft: -48,
    marginTop: -48,
    zIndex: 4,
  },
  challengeSkinLockedCar: {
    opacity: 0.34,
  },
  carouselCardTaken: {
    opacity: 0.32,
  },
  playerAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carGroundShadow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  playerNamePlate: {
    width: 148,
    minHeight: 42,
    marginTop: -8,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 5,
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  playerNamePlateInner: {
    minHeight: 34,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  playerNamePlateGloss: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 5,
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  playerNameInput: {
    padding: 0,
    margin: 0,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 17,
    lineHeight: 22,
    color: '#144766',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  playerNameInputHidden: {
    opacity: 0,
  },
  selectButtonWrap: {
    minWidth: 220,
  },
  challengePanelPlaceholder: {
    minHeight: 86,
  },
  challengePanel: {
    width: '86%',
    maxWidth: 430,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  challengeTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    lineHeight: 25,
    color: '#FFF7DD',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  challengeDescription: {
    marginTop: 5,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    lineHeight: 17,
    color: '#F4E8CD',
    textAlign: 'center',
    letterSpacing: 0,
  },
  challengeProgressRow: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeProgressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F5C400',
  },
  challengeProgressText: {
    minWidth: 46,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#FFF7DD',
    textAlign: 'right',
    letterSpacing: 0,
  },
  transitionCar: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
