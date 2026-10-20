import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton, InlineNote, ScreenLayout } from './flowComponents';
import {
  BASIC_SKIN_OPTIONS,
  EQUIPPED_SKIN_STORAGE_KEY,
  GAME_RULE_PREFERENCES_STORAGE_KEY,
  PLAYER_SETUP_STORAGE_KEY,
  SKIN_OPTIONS,
  createGameConfig,
  createRandomSalt,
  createRandomSeed,
  createPlayer,
  getDefaultPlayerName,
  normalizeCustomPlayerName,
  serializeGameRulePreferences,
  withDefaultPlayerNames,
} from './gameFlowConfig';
import { checkOnlineConnection, deleteLobby, ensureLobby, removePlayers, startLobby, subscribeToLobby, touchPlayerPresence, updateLobbySettings, upsertPlayers } from '../src/services/liveLobbyService';
import LobbyCodePlate from './LobbyCodePlate';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ThemeCarousel from '../src/components/ThemeCarousel';
import RemovePlayerIcon from '../src/components/RemovePlayerIcon';
import { getPlayerSurfaceColors } from '../src/utils/playerColorStyles';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import CircularReveal from '../components/CircularReveal';
import WarmupImages from '../src/components/WarmupImages';
import { getThemeCardImage, THEME_LOCK_OVERLAY_IMAGE } from '../assets/images/theme-cards/themeCardImages';
import { THEMES } from './themeCatalog';
import { getGameModePickerMetrics, getResponsiveMetrics, getRulesPanelMetrics } from '../src/utils/responsive';
import useOnlineConnectionStatus from '../src/hooks/useOnlineConnectionStatus';
import ConnectionWarningOverlay from '../src/components/ConnectionWarningOverlay';
import { WAITING_ROOM_ASSETS } from '../src/assets/preloadManifest';
import {
  SKIN_CHALLENGES,
  getChallengeProgressValue,
  isChallengeSkin,
  isSkinUnlocked,
  loadSkinChallengeProgress,
} from '../src/challenges/skinChallenges';
import { usePremium } from '../src/premium/PremiumContext';
import { isPremiumChallengeSkin, isSkinAvailableForPlayer } from '../src/skins/skinCatalog';
import { useTranslation } from '../src/i18n/useTranslation';
import {
  getCardLayoutOptionLabel,
  getDefaultPlayerNameForLanguage,
  getGameModeInfoBody,
  getSkinChallengeDescription,
  getSkinLabel,
  getGameModeSubtitle,
  getGameModeTitle,
  getThemeLabel,
  getWinOptionLabel,
  translate,
} from '../src/i18n/languages';

const MAX_PLAYER_NAME_LENGTH = 12;
const MAX_LOCAL_PLAYERS = 2;
const MAX_LOBBY_PLAYERS = 6;
const START_GAME_REVEAL_BLUE = '#1677D2';
const LEAVE_LOBBY_REVEAL_GREEN = '#159B3B';
const PLAYER_SILHOUETTE_IMAGE = PLAYER_ADD_SILHOUETTE_IMAGE;
const CHALLENGE_SKIN_LOCK_IMAGE = require('../assets/images/players/challenge-skin-lock.png');
const PREMIUM_SKIN_LOCK_IMAGE = require('../assets/images/host-lock-padlock.png');
const GAME_SETUP_BACKGROUND = require('../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const SETTINGS_RULES_PANEL_IMAGE = require('../assets/images/settings/rules-menu-panel-v2.png');
const SETTINGS_RULE_SLIDER_FRAME_WINCONDITION = require('../assets/images/settings/rules-slider-frame-wincondition.png');
const SETTINGS_RULE_SLIDER_FRAME_DIAGONAL = require('../assets/images/settings/rules-slider-frame-diagonal.png');
const SETTINGS_RULE_SLIDER_FRAME_DUTCH_ITEMS = require('../assets/images/settings/rules-slider-frame-dutch-items.png');
const SETTINGS_RULE_SLIDER_FRAME_CARD_LAYOUT = require('../assets/images/settings/rules-slider-frame-card-layout.png');
const SETTINGS_WIN_CONDITION_TITLE_ICON = require('../assets/images/settings/win-condition-title.png');
const SETTINGS_DIAGONAL_TITLE_ICON = require('../assets/images/settings/diagonal-rule-title.png');
const SETTINGS_DUTCH_ITEMS_TITLE = require('../assets/images/settings/dutch-items-title.png');
const SETTINGS_CARD_LAYOUT_TITLE_ICON = require('../assets/images/settings/card-layout-title.png');
const SETTINGS_WIN_ONE_LINE = require('../assets/images/settings/win-1-line.png');
const SETTINGS_WIN_TWO_LINES = require('../assets/images/settings/win-2-lines.png');
const SETTINGS_WIN_FULL_CARD = require('../assets/images/settings/win-full-card.png');
const SETTINGS_DIAGONAL_ON = require('../assets/images/settings/diagonal-on.png');
const SETTINGS_DIAGONAL_OFF = require('../assets/images/settings/diagonal-off.png');
const SETTINGS_DUTCH_ITEMS_ON = require('../assets/images/settings/dutch-items-on.png');
const SETTINGS_DUTCH_ITEMS_OFF = require('../assets/images/settings/dutch-items-off.png');
const SETTINGS_CARD_LAYOUT_SAME = require('../assets/images/settings/card-layout-same.png');
const SETTINGS_CARD_LAYOUT_DIFFERENT = require('../assets/images/settings/card-layout-different.png');
const LOBBY_ROAD_BACKGROUND_IMAGE = require('../assets/images/backgrounds/lobby-road-background.png');
const LOBBY_PARKING_GRID_IMAGE = require('../assets/images/lobby/lobby-parking-grid.png');
const NO_WIFI_BADGE_IMAGE = require('../assets/images/game-mode-cards/kaartcode-no-wifi.png');
const CAR_ATTENTION_DELAY_MS = 2600;
const CAR_ATTENTION_STAGGER_MS = 900;
const KLASSIEK_CARD_RED = require('../assets/images/game-mode-cards/klassiek-card-red.png');
const KLASSIEK_CARD_GREEN = require('../assets/images/game-mode-cards/klassiek-card-green.png');
const KLASSIEK_CARD_BLUE = require('../assets/images/game-mode-cards/klassiek-card-blue.png');
const KLASSIEK_GAME_MODE_BASE = require('../assets/images/game-mode-cards/klassiek-game-mode-base.png');
const CLAIM_GAME_MODE_BASE = require('../assets/images/game-mode-cards/claim-game-mode-base.png');
const COLLECTIEF_GAME_MODE_BASE = require('../assets/images/game-mode-cards/collectief-game-mode-base.png');
const COLLECTIEF_BINGO_BOARD = require('../assets/images/game-mode-cards/collectief-bingo-board.png');
const CLAIM_BINGO_BOARD = require('../assets/images/game-mode-cards/claim-direct-bingo-board.png');
const INFO_BUTTON_IMAGE = require('../assets/images/ui/info-button.png');
const SCREEN_HORIZONTAL_PADDING = 20;
const ANDROID_DISABLE_LOBBY_IDLE_MOTION = Platform.OS === 'android';
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 188;
const CAROUSEL_CAR_SIZE = 224;
const COMPACT_INPUT_BASE_WIDTH = 108;
const COMPACT_INPUT_MAX_WIDTH = 148;
const HERO_CAR_Y_OFFSET = -2;
const LOBBY_SETTINGS_BLUE = '#1A7BD4';
const PARKING_GRID_DRIVE_OFFSET_X = 24;
const PARKING_GRID_DRIVE_OFFSET_Y = 18;
const PARKING_GRID_SLOT_STYLES = [
  { left: '9.4%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '51.1%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '9.4%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '9.4%', top: '63.8%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '63.8%', width: '39.5%', height: '21.8%' },
];
const LOBBY_THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  outline: theme.cardOutline,
  premium: theme.premium,
}));
const LOBBY_GAME_MODES = [
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
];
const LOBBY_WIN_OPTIONS = [
  { id: '1rij', label: '1 Lijn' },
  { id: '2rijen', label: '2 Lijnen' },
  { id: 'heel-blok', label: 'Hele kaart' },
];
const LOBBY_DIAGONAL_OPTIONS = [
  { id: true, label: 'Wel diagonaal' },
  { id: false, label: 'Niet diagonaal' },
];
const LOBBY_DUTCH_OPTIONS = [
  { id: true, label: 'Nederlands aan' },
  { id: false, label: 'Nederlands uit' },
];
const LOBBY_CARD_LAYOUT_OPTIONS = [
  { id: 'zelfde', label: 'Zelfde kaart' },
  { id: 'anders', label: 'Andere kaarten' },
];
const LOBBY_WIN_SLIDER_OPTIONS = [
  { id: '1rij', label: '1 rij', image: SETTINGS_WIN_ONE_LINE },
  { id: '2rijen', label: '2 rijen', image: SETTINGS_WIN_TWO_LINES },
  { id: 'heel-blok', label: 'Hele kaart', image: SETTINGS_WIN_FULL_CARD },
];
const LOBBY_DIAGONAL_SLIDER_OPTIONS = [
  { id: true, label: 'Wel', image: SETTINGS_DIAGONAL_ON },
  { id: false, label: 'Niet', image: SETTINGS_DIAGONAL_OFF },
];
const LOBBY_DUTCH_SLIDER_OPTIONS = [
  { id: true, label: 'Wel Nederlandse items', image: SETTINGS_DUTCH_ITEMS_ON },
  { id: false, label: 'Geen Nederlandse items', image: SETTINGS_DUTCH_ITEMS_OFF },
];
const LOBBY_CARD_LAYOUT_SLIDER_OPTIONS = [
  { id: 'zelfde', label: 'Zelfde kaart', image: SETTINGS_CARD_LAYOUT_SAME },
  { id: 'anders', label: 'Andere kaarten', image: SETTINGS_CARD_LAYOUT_DIFFERENT },
];

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
    return 0.6;
  }

  if (themeId === 'voertuigen') {
    return 0.8;
  }

  return themeId === 'platteland' ? 0.93 : 1;
}

function normalizeName(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function getNumberedName(prefix, players = []) {
  const usedNames = new Set(players.map((player) => normalizeName(player?.naam).toLowerCase()));

  for (let index = 1; index <= MAX_LOBBY_PLAYERS; index += 1) {
    const candidate = `${prefix} ${index}`;
    if (!usedNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${prefix} ${players.length + 1}`;
}

function formatPlayerGridName(value = '', fallbackName = 'Speler') {
  const normalized = normalizeName(value);
  if (!normalized) {
    return fallbackName;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function PlayerAvatar({ skin = 'rood', size = 72, style }) {
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
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

function AttentionCarButton({ skin, size, onPress, disabled = false, attentionDelay = 0 }) {
  const attention = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
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
  }, [attention, attentionDelay, disabled]);

  const translateY = attention.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const rotate = attention.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-1.8deg', '1.8deg'],
  });

  return (
    <Pressable style={styles.heroCarButton} onPress={onPress} disabled={disabled}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <PlayerAvatar skin={skin} size={size} />
      </Animated.View>
    </Pressable>
  );
}

function normalizeLocalPlayer(player = {}, fallbackSkin = 'rood') {
  return {
    ...createPlayer({ skin: fallbackSkin }),
    ...player,
    naam: normalizeCustomPlayerName(player?.naam),
    skin: player?.skin || fallbackSkin,
  };
}

function getCompactNameInputWidth(name = '') {
  const visibleCharacters = Math.max(4, normalizeName(name).length || 0);
  return Math.min(COMPACT_INPUT_MAX_WIDTH, COMPACT_INPUT_BASE_WIDTH + Math.max(0, visibleCharacters - 4) * 10);
}

function resolveUniqueLocalPlayers(players = [], remotePlayers = []) {
  const reservedSkins = new Set(remotePlayers.map((player) => player.skin));
  let changed = false;

  const nextPlayers = players.map((player) => {
    if (!reservedSkins.has(player.skin)) {
      reservedSkins.add(player.skin);
      return player;
    }

    const fallbackSkin = BASIC_SKIN_OPTIONS.find((skin) => !reservedSkins.has(skin)) ?? player.skin;
    reservedSkins.add(fallbackSkin);
    if (fallbackSkin !== player.skin) {
      changed = true;
      return { ...player, skin: fallbackSkin };
    }
    return player;
  });

  return changed ? nextPlayers : players;
}

function LobbyThemeCard({ item, metrics, preview = false, isPremium = true }) {
  const themeImage = getThemeCardImage(item.id);
  const isLocked = item.premium && !isPremium;
  const usesEmbeddedFrame = isEmbeddedThemeCard(item.id);
  const cardBorderColor = item.outline ?? item.border;
  const cardWidth = metrics?.themeCardWidth ?? (preview ? 146 : 224);
  const cardHeight = metrics?.themeCardHeight ?? (preview ? 220 : 270);
  const scale = metrics?.scale ?? 1;
  const cardBodyStyle = {
    width: cardWidth,
    height: usesEmbeddedFrame ? Math.round(cardWidth * 1.5) : cardHeight,
  };
  const titleStyle = usesEmbeddedFrame
    ? [
        styles.lobbyThemeCardTitleWrapEmbedded,
        preview ? styles.lobbyThemeCardTitleWrapEmbeddedPreview : styles.lobbyThemeCardTitleWrapEmbeddedPicker,
        item.id === 'verkeersborden' && styles.lobbyThemeCardTitleWrapEmbeddedWide,
      ]
    : {
        top: Math.round((preview ? 15 : 30) * scale),
        left: Math.round(12 * scale),
        right: Math.round(12 * scale),
      };
  const titleScale = getEmbeddedThemeTitleScale(item.id);
  const isTrafficSignsTitle = item.id === 'verkeersborden';
  const shouldAutoFitTitle = !usesEmbeddedFrame || isTrafficSignsTitle;
  const minimumTitleScale = isTrafficSignsTitle ? 0.58 : usesEmbeddedFrame ? 0.88 : 0.58;
  const titleTextStyle = {
    fontSize: Math.round((usesEmbeddedFrame ? 32 : 28) * scale * titleScale),
    lineHeight: Math.round((usesEmbeddedFrame ? 42 : 34) * scale * titleScale),
    ...(usesEmbeddedFrame ? { width: '100%' } : null),
    ...(usesEmbeddedFrame ? getEmbeddedThemeTitleStyle(item.id) : { color: '#ffffff' }),
  };

  return (
    <View style={styles.lobbyThemeCardShell}>
      <View
        style={[
          styles.lobbyThemeCardOutline,
          usesEmbeddedFrame
            ? styles.lobbyThemeCardOutlineEmbedded
            : { borderColor: isLocked ? withAlpha(cardBorderColor, 0.42) : cardBorderColor },
        ]}
      >
        {themeImage ? (
          <View
            style={[
              styles.lobbyThemeCardBody,
              usesEmbeddedFrame && styles.lobbyThemeCardBodyEmbedded,
              cardBodyStyle,
            ]}
          >
            <Image
              source={themeImage}
              resizeMode={usesEmbeddedFrame ? 'contain' : 'cover'}
              fadeDuration={0}
              style={[
                styles.lobbyThemeCardImageFill,
                styles.lobbyThemeCardImage,
                usesEmbeddedFrame && styles.lobbyThemeCardImageEmbedded,
              ]}
            />
            {usesEmbeddedFrame ? null : <View style={styles.lobbyThemeCardOverlay} />}
            {isLocked ? <View style={styles.lobbyThemeCardLockedDim} /> : null}
            {isLocked ? (
              <View pointerEvents="none" style={styles.lobbyThemeCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.lobbyThemeCardLockOverlay} />
              </View>
            ) : null}
            <View style={[styles.lobbyThemeCardTitleWrap, titleStyle]}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit={shouldAutoFitTitle}
                minimumFontScale={minimumTitleScale}
                maxFontSizeMultiplier={1}
                style={[
                  styles.lobbyThemeCardTitle,
                  titleTextStyle,
                  isTrafficSignsTitle && styles.lobbyThemeCardTitleNoWrap,
                ]}
              >
                {item.title}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.lobbyThemeCardBody, cardBodyStyle, { backgroundColor: item.surface }]}>
            {isLocked ? <View style={styles.lobbyThemeCardLockedDim} /> : null}
            {isLocked ? (
              <View pointerEvents="none" style={styles.lobbyThemeCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.lobbyThemeCardLockOverlay} />
              </View>
            ) : null}
            <View style={[styles.lobbyThemeCardTitleWrap, titleStyle]}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit={shouldAutoFitTitle}
                minimumFontScale={minimumTitleScale}
                style={[styles.lobbyThemeCardTitle, titleTextStyle]}
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

function LobbySettingsChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsChip, selected && styles.settingsChipSelected]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
        style={[styles.settingsChipText, selected && styles.settingsChipTextSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LobbyGameModeCard({ mode, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsModeCard, selected && styles.settingsModeCardSelected]}
    >
      <GameModeCardArt mode={mode} selected={selected} compact={mode.id !== 'klassiek'} />
    </Pressable>
  );
}

function GameModeCardArt({
  mode,
  selected = false,
  compact = false,
  setupPreview = false,
}) {
  const hover = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ANDROID_DISABLE_LOBBY_IDLE_MOTION) {
      hover.stopAnimation();
      hover.setValue(0);
      return undefined;
    }

    if (
      mode.id !== 'klassiek'
      && mode.id !== 'claim'
      && mode.id !== 'collectief'
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
      <View style={[styles.claimGameModeCard, selected && styles.claimGameModeCardSelected]}>
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
      <View style={[styles.collectiefGameModeCard, selected && styles.collectiefGameModeCardSelected]}>
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
        setupPreview && styles.klassiekGameModeCardSetupPreview,
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
      <View style={[styles.klassiekCardsLayer, setupPreview && styles.klassiekCardsLayerSetupPreview]}>
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

function LobbyRulesTitleBlock({ label, metrics }) {
  const scale = metrics?.scale ?? 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.lobbyRulesTitleBlock,
        {
          minWidth: Math.round(132 * scale),
          minHeight: Math.round(40 * scale),
          paddingHorizontal: Math.round(15 * scale),
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.74)', 'rgba(255,255,255,0.34)', 'rgba(232,247,255,0.2)']}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.lobbyRulesTitleBlockGloss}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.64}
        style={[
          styles.lobbyRulesTitleBlockText,
          {
            fontSize: Math.round(19 * scale),
            lineHeight: Math.round(24 * scale),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function LobbyRulesOverviewTiles({
  settings,
  onOpenSpelmodus,
  onOpenTheme,
  gameModeInfo = null,
  onInfoPress = null,
  metrics,
  spelmodusRef,
  themeRef,
  modeOpacity = 1,
  themeOpacity = 1,
}) {
  const { language, t } = useTranslation();
  const baseScale = metrics?.scale ?? 1;
  const selectedModeBase = LOBBY_GAME_MODES.find((mode) => mode.id === settings.modus) ?? LOBBY_GAME_MODES[0];
  const selectedThemeBase = LOBBY_THEME_CARDS.find((theme) => theme.id === settings.thema) ?? LOBBY_THEME_CARDS[0];
  const selectedMode = {
    ...selectedModeBase,
    title: getGameModeTitle(language, selectedModeBase.id, selectedModeBase.title),
    subtitle: getGameModeSubtitle(language, selectedModeBase.id, selectedModeBase.subtitle),
  };
  const selectedTheme = {
    ...selectedThemeBase,
    title: getThemeLabel(language, selectedThemeBase.id, selectedThemeBase.title),
  };
  const tileWidth = Math.round(clamp(baseScale * 154, 138, 176));
  const modeTileHeight = Math.round(tileWidth * 0.72);
  const themeTileWidth = Math.round(tileWidth * 0.82);
  const themeTileHeight = Math.round(themeTileWidth * 1.5);
  const titleToModeGap = Math.round(Math.max(10, ((themeTileHeight - modeTileHeight) / 2) + 10));
  const themeMetrics = {
    scale: baseScale * (themeTileWidth / 214),
    themeCardWidth: themeTileWidth,
    themeCardHeight: Math.round(themeTileWidth * 1.17),
  };

  return (
    <View style={styles.lobbyRulesOverview}>
      <Pressable
        ref={spelmodusRef}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={t('game.gameMode')}
        onPress={onOpenSpelmodus}
        style={styles.lobbyRulesOverviewColumn}
      >
        <LobbyRulesTitleBlock label={t('game.gameMode')} metrics={metrics} />
        <Animated.View
          style={[
            styles.lobbyRulesModePreview,
            {
              width: tileWidth,
              height: modeTileHeight,
              marginTop: titleToModeGap,
              opacity: modeOpacity,
            },
          ]}
        >
          <GameModeCardArt mode={selectedMode} selected setupPreview />
          <InfoButton
            info={gameModeInfo}
            onInfoPress={onInfoPress}
            style={styles.lobbyRulesModeInfoButton}
          />
        </Animated.View>
      </Pressable>

      <Pressable
        ref={themeRef}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={t('game.bingoTheme')}
        onPress={onOpenTheme}
        style={styles.lobbyRulesOverviewColumn}
      >
        <LobbyRulesTitleBlock label={t('game.bingoTheme')} metrics={metrics} />
        <Animated.View
          style={[
            styles.lobbyRulesThemePreviewShell,
            {
              marginTop: 10,
              opacity: themeOpacity,
            },
          ]}
        >
          <LobbyThemeCard item={selectedTheme} metrics={themeMetrics} preview />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function LobbyThemePickerModal({
  visible,
  settings,
  sourceRect: _sourceRect,
  onSelect,
  onClose,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(screenWidth, screenHeight);
  const { language, t } = useTranslation();
  const carouselCardWidth = Math.round(clamp(screenWidth * (isTablet ? 0.39 : 0.52), 214, isTablet ? 350 : 250));
  const themeMetrics = {
    scale: carouselCardWidth / 214,
    themeCardWidth: carouselCardWidth,
    themeCardHeight: Math.round(clamp(carouselCardWidth * 1.17, 230, isTablet ? 430 : 320)),
  };
  const localizedThemeCards = useMemo(() => LOBBY_THEME_CARDS.map((theme) => ({
    ...theme,
    title: getThemeLabel(language, theme.id, theme.title),
  })), [language]);
  const selectedThemeIndex = Math.max(0, localizedThemeCards.findIndex((theme) => theme.id === settings.thema));
  const [activeIndex, setActiveIndex] = useState(selectedThemeIndex);
  const pickerProgress = useRef(new Animated.Value(0)).current;
  const orderedThemeCards = useMemo(() => {
    if (selectedThemeIndex <= 0) {
      return localizedThemeCards;
    }

    return [
      ...localizedThemeCards.slice(selectedThemeIndex),
      ...localizedThemeCards.slice(0, selectedThemeIndex),
    ];
  }, [localizedThemeCards, selectedThemeIndex]);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      pickerProgress.setValue(0);
      Animated.timing(pickerProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [pickerProgress, selectedThemeIndex, visible]);

  const activeTheme = orderedThemeCards[activeIndex] ?? orderedThemeCards[0] ?? localizedThemeCards[0];

  function closeWithMotion(afterClose) {
    const onClosed = typeof afterClose === 'function' ? afterClose : null;

    Animated.timing(pickerProgress, {
      toValue: 0,
      duration: 240,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClosed?.();
      onClose();
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => closeWithMotion()}
    >
      <Animated.View style={[styles.lobbyPickerLayer, { opacity: pickerProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeWithMotion()} />
        <Animated.View style={styles.lobbyThemePickerContent}>
          <ThemeCarousel
            items={orderedThemeCards}
            itemWidth={themeMetrics.themeCardWidth}
            itemSpacing={isTablet ? 16 : 0}
            focusedIndex={0}
            onSnapToItem={setActiveIndex}
            keyExtractor={(item) => item.id}
            containerStyle={styles.lobbyThemePickerCarousel}
            renderCard={({ item, index }) => (
              <View style={index !== activeIndex ? styles.lobbyThemePickerCardMuted : null}>
                <LobbyThemeCard item={item} metrics={themeMetrics} />
              </View>
            )}
          />
          <View style={styles.lobbyPickerSelectWrap}>
            <GlossyButton
              label={t('common.select')}
              variant="green"
              heightOverride={isTablet ? 82 : 62}
              horizontalPadding={isTablet ? 62 : 44}
              onPress={() => {
                closeWithMotion(() => onSelect(activeTheme.id));
              }}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function LobbySpelmodusPickerModal({
  visible,
  settings,
  sourceRect: _sourceRect,
  onSelect,
  onClose,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(screenWidth, screenHeight);
  const { language } = useTranslation();
  const pickerMetrics = useMemo(
    () => getGameModePickerMetrics(screenWidth, screenHeight),
    [screenHeight, screenWidth]
  );
  const itemProgress = useRef({
    klassiek: new Animated.Value(0),
    claim: new Animated.Value(0),
    collectief: new Animated.Value(0),
  }).current;
  const pickerProgress = useRef(new Animated.Value(0)).current;
  const choiceRefs = useRef({});
  const localizedGameModes = useMemo(() => LOBBY_GAME_MODES.map((mode) => ({
    ...mode,
    title: getGameModeTitle(language, mode.id, mode.title),
    subtitle: getGameModeSubtitle(language, mode.id, mode.subtitle),
  })), [language]);

  useEffect(() => {
    if (!visible) {
      Object.values(itemProgress).forEach((value) => value.setValue(0));
      return;
    }

    Object.values(itemProgress).forEach((value) => value.setValue(0));
    pickerProgress.setValue(0);
    Animated.timing(pickerProgress, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.stagger(
      70,
      ['klassiek', 'claim', 'collectief'].map((key) => Animated.timing(itemProgress[key], {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }))
    ).start();
  }, [itemProgress, pickerProgress, visible]);

  function closeWithMotion(afterClose) {
    const onClosed = typeof afterClose === 'function' ? afterClose : null;

    Animated.timing(pickerProgress, {
      toValue: 0,
      duration: 230,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClosed?.();
      onClose();
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => closeWithMotion()}
    >
      <Animated.View style={[styles.gameModePickerLayer, { opacity: pickerProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeWithMotion()} />
        <Animated.View
          style={[
            styles.gameModePickerContent,
            {
              paddingHorizontal: pickerMetrics.pickerPaddingHorizontal,
              paddingTop: pickerMetrics.pickerPaddingTop,
              paddingBottom: pickerMetrics.pickerPaddingBottom,
              gap: pickerMetrics.pickerGap,
            },
          ]}
        >
          <GameModePickerSection
            modes={localizedGameModes}
            selectedModeId={settings.modus}
            choiceRefs={choiceRefs}
            itemProgress={itemProgress}
            onSelect={(modeId) => {
              closeWithMotion(() => onSelect(modeId));
            }}
            metrics={pickerMetrics}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function GameModePickerSection({ modes, selectedModeId, choiceRefs, itemProgress, onSelect, metrics }) {
  const featuredMode = modes[0];
  const remainingModes = modes.slice(1);
  const choiceGap = metrics?.pickerChoiceGap ?? 14;

  return (
    <View style={styles.gameModePickerSection}>
      <View style={[styles.gameModeChoiceGrid, { gap: choiceGap }]}>
        {featuredMode ? (
          <GameModeChoiceButton
            mode={featuredMode}
            selected={selectedModeId === featuredMode.id}
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

function GameModeChoiceButton({ mode, selected, choiceRefs, progress, onPress, featured, metrics }) {
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

function LobbyGameSettingsPage({
  visible,
  settings,
  onChange,
  onClose,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const { language, t } = useTranslation();
  const localizedThemeCards = useMemo(() => LOBBY_THEME_CARDS.map((theme) => ({
    ...theme,
    title: getThemeLabel(language, theme.id, theme.title),
  })), [language]);
  const localizedGameModes = useMemo(() => LOBBY_GAME_MODES.map((mode) => ({
    ...mode,
    title: getGameModeTitle(language, mode.id, mode.title),
    subtitle: getGameModeSubtitle(language, mode.id, mode.subtitle),
  })), [language]);
  const localizedWinOptions = useMemo(() => LOBBY_WIN_OPTIONS.map((option) => ({
    ...option,
    label: getWinOptionLabel(language, option.id, option.label),
  })), [language]);
  const localizedDiagonalOptions = useMemo(() => LOBBY_DIAGONAL_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.withDiagonal') : t('game.options.noDiagonal'),
  })), [t]);
  const localizedDutchOptions = useMemo(() => LOBBY_DUTCH_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.dutchOn') : t('game.options.dutchOff'),
  })), [t]);
  const localizedCardLayoutOptions = useMemo(() => LOBBY_CARD_LAYOUT_OPTIONS.map((option) => ({
    ...option,
    label: getCardLayoutOptionLabel(language, option.id, option.label),
  })), [language]);
  const selectedThemeIndex = Math.max(0, localizedThemeCards.findIndex((theme) => theme.id === settings.thema));
  const showWinAndDiagonalRuleSettings = (
    settings.modus === 'klassiek'
    || settings.modus === 'wegenkaart'
    || settings.modus === 'collectief'
  );
  const showCardLayoutRuleSettings = settings.modus === 'klassiek';
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => {
      dragY.setValue(Math.max(0, gesture.dy));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 96 || gesture.vy > 0.85) {
        Animated.timing(slideY, {
          toValue: screenHeight,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          dragY.setValue(0);
          onClose();
        });
        return;
      }

      Animated.spring(dragY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 4,
      }).start();
    },
  }), [dragY, onClose, screenHeight, slideY]);

  useEffect(() => {
    if (!visible) {
      slideY.setValue(screenHeight);
      dragY.setValue(0);
      return;
    }

    slideY.setValue(screenHeight);
    dragY.setValue(0);
    Animated.timing(slideY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dragY, slideY, visible]);

  function closeWithSlide() {
    Animated.timing(slideY, {
      toValue: screenHeight,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(onClose);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithSlide}
    >
      <Animated.View
        style={[
          styles.settingsPage,
          {
            transform: [
              { translateY: slideY },
              { translateY: dragY },
            ],
          },
        ]}
      >
        <ImageBackground
          source={GAME_SETUP_BACKGROUND}
          resizeMode="cover"
          style={styles.settingsPageBackground}
        >
          <View
            style={styles.settingsPageGrabberWrap}
            {...panResponder.panHandlers}
          >
            <View style={styles.settingsPageGrabber} />
          </View>

          <BackButton onPress={closeWithSlide} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.settingsPageScroll}
            contentContainerStyle={styles.settingsPageContent}
          >
            <Text style={styles.settingsPageTitle}>{t('game.gameRules')}</Text>

            <Text style={styles.settingsPageSectionTitle}>{t('game.bingoTheme')}</Text>
            <ThemeCarousel
              items={localizedThemeCards}
              itemWidth={210}
              itemSpacing={12}
              focusedIndex={selectedThemeIndex}
              keyExtractor={(item) => item.id}
              onSnapToItem={(index) => {
                const nextTheme = localizedThemeCards[index];
                if (nextTheme) {
                  onChange({ thema: nextTheme.id });
                }
              }}
              renderCard={({ item }) => (
                <LobbyThemeCard item={item} selected={item.id === settings.thema} />
              )}
            />

            <Text style={styles.settingsPageSectionTitle}>{t('game.gameMode')}</Text>
            <View style={styles.settingsModeGrid}>
              {localizedGameModes.map((mode) => (
                <LobbyGameModeCard
                  key={mode.id}
                  mode={mode}
                  selected={settings.modus === mode.id}
                  onPress={() => onChange({ modus: mode.id })}
                />
              ))}
            </View>

            <View style={styles.settingsBottomPanel}>
              <Text style={styles.settingsBottomPanelTitle}>{t('game.gameRules')}</Text>
              {showWinAndDiagonalRuleSettings ? (
                <>
                  <Text style={styles.settingsSectionLabel}>{t('game.rules.winCondition')}</Text>
                  <View style={styles.settingsChipRow}>
                    {localizedWinOptions.map((option) => (
                      <LobbySettingsChip
                        key={option.id}
                        label={option.label}
                        selected={settings.wincondition === option.id}
                        onPress={() => onChange({ wincondition: option.id })}
                      />
                    ))}
                  </View>

                  <Text style={styles.settingsSectionLabel}>{t('game.rules.diagonal')}</Text>
                  <View style={styles.settingsChipRow}>
                    {localizedDiagonalOptions.map((option) => (
                      <LobbySettingsChip
                        key={String(option.id)}
                        label={option.label}
                        selected={settings.diagonaal === option.id}
                        onPress={() => onChange({ diagonaal: option.id })}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.settingsSectionLabel}>{t('game.rules.dutchItems')}</Text>
              <View style={styles.settingsChipRow}>
                {localizedDutchOptions.map((option) => (
                  <LobbySettingsChip
                    key={String(option.id)}
                    label={option.label}
                    selected={settings.nederlands === option.id}
                    onPress={() => onChange({ nederlands: option.id })}
                  />
                ))}
              </View>

              {showCardLayoutRuleSettings ? (
                <>
                  <Text style={styles.settingsSectionLabel}>{t('game.rules.cards')}</Text>
                  <View style={styles.settingsChipRow}>
                    {localizedCardLayoutOptions.map((option) => (
                      <LobbySettingsChip
                        key={option.id}
                        label={option.label}
                        selected={settings.kaartOpzet === option.id}
                        onPress={() => onChange({ kaartOpzet: option.id })}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </ImageBackground>
      </Animated.View>
    </Modal>
  );
}

function LobbySettingsRuleSlider({
  title,
  titleIcon,
  value,
  options,
  onChange,
  metrics,
  variant = 'win',
}) {
  const scale = metrics?.uiScale ?? metrics?.scale ?? 1;
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
  const frameWidth = Math.round(clamp(scale * 346, 314, 382));
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
    onChange(option.id);
    animateSelectorToIndex(index);
    popSelector(option.id === value ? 1.035 : 1.055);
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
	                fontSize: Math.round((isDutch || isCardLayout ? 27 : 29) * scale),
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
              const baseLabelSize = isDiagonal ? 25 : isDutch ? 18 : isCardLayout ? 18 : 20;
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
                  onPress={() => handleOptionPress(option, index)}
                  style={styles.settingsRuleOption}
                >
                  <View style={styles.settingsRuleOptionContent}>
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

function LobbyGameSettingsDock({
  visible,
  open,
  settings,
  onChange,
  onOpen,
  onClose,
  headerRef = null,
  overviewRef = null,
  tutorialActive = false,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { language, t } = useTranslation();
  const rulesPanelMetrics = getRulesPanelMetrics(screenWidth, screenHeight);
  const scale = rulesPanelMetrics.scale ?? 1;
  const collapsedPanelHeight = rulesPanelMetrics.collapsedPanelHeight;
  const expandedPanelHeight = rulesPanelMetrics.expandedPanelHeight;
  const ruleMetrics = useMemo(() => ({
    uiScale: rulesPanelMetrics.scale,
    settingsTitleIconSize: rulesPanelMetrics.settingsTitleIconSize,
    settingsSliderImageSize: rulesPanelMetrics.settingsSliderImageSize,
    settingsSliderDiagonalImageSize: rulesPanelMetrics.settingsSliderDiagonalImageSize,
    settingsSectionGap: rulesPanelMetrics.settingsSectionGap,
  }), [rulesPanelMetrics]);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const infoPopoverProgress = useRef(new Animated.Value(0)).current;
  const settingsScrollRef = useRef(null);
  const settingsScrollY = useRef(new Animated.Value(0)).current;
  const themePreviewOpacity = useRef(new Animated.Value(1)).current;
  const modeRulesOpacity = useRef(new Animated.Value(1)).current;
  const [panelVisible, setPanelVisible] = useState(open);
  const [displayedSettings, setDisplayedSettings] = useState(settings);
  const [activeInfoPopover, setActiveInfoPopover] = useState(null);
  const [settingsScrollMetrics, setSettingsScrollMetrics] = useState({ contentHeight: 0, viewportHeight: 0 });
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [spelmodusPickerVisible, setSpelmodusPickerVisible] = useState(false);
  const [themePickerSourceRect, setThemePickerSourceRect] = useState(null);
  const [spelmodusPickerSourceRect, setSpelmodusPickerSourceRect] = useState(null);
  const themePreviewRef = useRef(null);
  const spelmodusPreviewRef = useRef(null);
  const activeSettings = displayedSettings ?? settings;
  const showWinAndDiagonalRuleSettings = (
    activeSettings.modus === 'klassiek'
    || activeSettings.modus === 'wegenkaart'
    || activeSettings.modus === 'collectief'
  );
  const showCardLayoutRuleSettings = activeSettings.modus === 'klassiek';
  const showModeRuleSettings = showWinAndDiagonalRuleSettings || showCardLayoutRuleSettings;
  const localizedWinSliderOptions = useMemo(() => LOBBY_WIN_SLIDER_OPTIONS.map((option) => ({
    ...option,
    label: getWinOptionLabel(language, option.id, option.label),
  })), [language]);
  const localizedDiagonalSliderOptions = useMemo(() => LOBBY_DIAGONAL_SLIDER_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.yes') : t('game.options.no'),
  })), [t]);
  const localizedDutchSliderOptions = useMemo(() => LOBBY_DUTCH_SLIDER_OPTIONS.map((option) => ({
    ...option,
    label: option.id ? t('game.options.withDutchItems') : t('game.options.noDutchItems'),
  })), [t]);
  const localizedCardLayoutSliderOptions = useMemo(() => LOBBY_CARD_LAYOUT_SLIDER_OPTIONS.map((option) => ({
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
  const localizedGameModeInfo = useMemo(() => {
    const mode = LOBBY_GAME_MODES.find((item) => item.id === activeSettings.modus) ?? LOBBY_GAME_MODES[0];

    return {
      id: `mode-${mode.id}`,
      title: getGameModeTitle(language, mode.id, mode.title),
      body: getGameModeInfoBody(language, mode.id, mode.subtitle),
    };
  }, [activeSettings.modus, language]);

  const closeInfoPopover = useCallback(() => {
    infoPopoverProgress.stopAnimation();
    Animated.timing(infoPopoverProgress, {
      toValue: 0,
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveInfoPopover(null);
      }
    });
  }, [infoPopoverProgress]);

  const showInfoPopover = useCallback((info, targetRef) => {
    const node = targetRef?.current;

    if (!info || !node?.measureInWindow) {
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      infoPopoverProgress.stopAnimation();
      setActiveInfoPopover({
        ...info,
        anchor: { x, y, width, height },
      });
      infoPopoverProgress.setValue(0);
      Animated.spring(infoPopoverProgress, {
        toValue: 1,
        friction: 8,
        tension: 92,
        useNativeDriver: true,
      }).start();
    });
  }, [infoPopoverProgress]);

  useEffect(() => {
    if (open) {
      setPanelVisible(true);
      if (tutorialActive) {
        requestAnimationFrame(() => {
          settingsScrollRef.current?.scrollTo?.({ y: 0, animated: false });
          settingsScrollY.setValue(0);
        });
      }
    }

    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 440 : 420,
      easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !open) {
        progress.setValue(0);
        setPanelVisible(false);
      }
    });
  }, [open, progress, settingsScrollY, tutorialActive]);

  useEffect(() => {
    if (!open) {
      closeInfoPopover();
    }
  }, [closeInfoPopover, open]);

  useEffect(() => {
    if (settings?.thema === displayedSettings?.thema) {
      return;
    }

    themePreviewOpacity.stopAnimation();
    Animated.timing(themePreviewOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayedSettings((current) => ({ ...current, thema: settings.thema }));
      requestAnimationFrame(() => {
        themePreviewOpacity.setValue(0);
        Animated.timing(themePreviewOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    });
  }, [displayedSettings?.thema, settings?.thema, themePreviewOpacity]);

  useEffect(() => {
    if (settings?.modus === displayedSettings?.modus) {
      return;
    }

    modeRulesOpacity.stopAnimation();
    Animated.timing(modeRulesOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayedSettings((current) => ({ ...current, modus: settings.modus }));
      requestAnimationFrame(() => {
        modeRulesOpacity.setValue(0);
        Animated.timing(modeRulesOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    });
  }, [displayedSettings?.modus, modeRulesOpacity, settings?.modus]);

  useEffect(() => {
    setDisplayedSettings((current) => ({
      ...current,
      wincondition: settings.wincondition,
      diagonaal: settings.diagonaal,
      kaartOpzet: settings.kaartOpzet,
      nederlands: settings.nederlands,
    }));
  }, [settings.diagonaal, settings.kaartOpzet, settings.nederlands, settings.wincondition]);

  if (!visible) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedPanelHeight - collapsedPanelHeight - Math.round(20 * scale), 0],
  });
  const contentOpacity = progress;
  const contentTranslateY = progress.interpolate({
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

  function measureRect(ref, fallback) {
    const node = ref.current;
    if (!node?.measureInWindow) {
      return Promise.resolve(fallback);
    }

    return new Promise((resolve) => {
      node.measureInWindow((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    });
  }

  async function openThemePicker() {
    closeInfoPopover();
    const rect = await measureRect(themePreviewRef, null);
    setThemePickerSourceRect(rect);
    setThemePickerVisible(true);
  }

  async function openSpelmodusPicker() {
    closeInfoPopover();
    const rect = await measureRect(spelmodusPreviewRef, null);
    setSpelmodusPickerSourceRect(rect);
    setSpelmodusPickerVisible(true);
  }

  return (
    <>
      {panelVisible ? (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.lobbyRulesBackdropLayer,
            {
              opacity: progress,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
      ) : null}

      <View pointerEvents="box-none" style={styles.lobbyRulesDock}>
        <Animated.View
          pointerEvents={panelVisible ? 'auto' : 'none'}
          style={[
            styles.lobbyRulesPanelShell,
            {
              height: expandedPanelHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <ImageBackground
            pointerEvents="none"
            source={SETTINGS_RULES_PANEL_IMAGE}
            resizeMode="stretch"
            style={styles.lobbyRulesPanelImage}
            imageStyle={styles.lobbyRulesPanelImageAsset}
          />
          <Pressable
            ref={headerRef}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={t('game.gameRules')}
            onPress={open ? onClose : onOpen}
            style={[
              styles.lobbyRulesPanelHeader,
              { minHeight: collapsedPanelHeight },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={styles.lobbyRulesPanelHeaderText}
            >
              {t('game.gameRules')}
            </Text>
          </Pressable>

          <Animated.View
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              styles.lobbyRulesPanelContent,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Animated.ScrollView
              ref={settingsScrollRef}
              showsVerticalScrollIndicator={false}
              style={styles.lobbyRulesScroll}
              contentContainerStyle={[styles.lobbyRulesScrollContent, { gap: ruleMetrics.settingsSectionGap }]}
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
              <View ref={overviewRef} collapsable={false} style={styles.lobbyRulesOverviewTarget}>
                <LobbyRulesOverviewTiles
                  settings={activeSettings}
                  metrics={ruleMetrics}
                  spelmodusRef={spelmodusPreviewRef}
                  themeRef={themePreviewRef}
                  onOpenSpelmodus={openSpelmodusPicker}
                  onOpenTheme={openThemePicker}
                  gameModeInfo={localizedGameModeInfo}
                  onInfoPress={showInfoPopover}
                  modeOpacity={modeRulesOpacity}
                  themeOpacity={themePreviewOpacity}
                />
              </View>

              {showModeRuleSettings ? (
                <Animated.View
                  style={{
                    opacity: modeRulesOpacity,
                    gap: ruleMetrics.settingsSectionGap,
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  {showWinAndDiagonalRuleSettings ? (
                    <>
                      <LobbySettingsRuleSlider
                        title={t('game.rules.winCondition')}
                        titleIcon={SETTINGS_WIN_CONDITION_TITLE_ICON}
                        value={activeSettings.wincondition}
                        options={localizedWinSliderOptions}
                        onChange={(wincondition) => onChange({ wincondition })}
                        metrics={ruleMetrics}
                        info={{ id: 'lobby-rule-wincondition', ...localizedRuleInfo.wincondition }}
                        onInfoPress={showInfoPopover}
                      />

                      <LobbySettingsRuleSlider
                        title={t('game.rules.diagonal')}
                        titleIcon={SETTINGS_DIAGONAL_TITLE_ICON}
                        value={activeSettings.diagonaal}
                        options={localizedDiagonalSliderOptions}
                        onChange={(diagonaal) => onChange({ diagonaal })}
                        metrics={ruleMetrics}
                        variant="diagonal"
                        info={{ id: 'lobby-rule-diagonal', ...localizedRuleInfo.diagonal }}
                        onInfoPress={showInfoPopover}
                      />
                    </>
                  ) : null}

                  {showCardLayoutRuleSettings ? (
                    <LobbySettingsRuleSlider
                      title={t('game.rules.cards')}
                      titleIcon={SETTINGS_CARD_LAYOUT_TITLE_ICON}
                      value={activeSettings.kaartOpzet}
                      options={localizedCardLayoutSliderOptions}
                      onChange={(kaartOpzet) => onChange({ kaartOpzet })}
                      metrics={ruleMetrics}
                      variant="cardLayout"
                      info={{ id: 'lobby-rule-card-layout', ...localizedRuleInfo.cardLayout }}
                      onInfoPress={showInfoPopover}
                    />
                  ) : null}
                </Animated.View>
              ) : null}

              <LobbySettingsRuleSlider
                title={t('game.rules.dutchItems')}
                titleIcon={SETTINGS_DUTCH_ITEMS_TITLE}
                value={activeSettings.nederlands}
                options={localizedDutchSliderOptions}
                onChange={(nederlands) => onChange({ nederlands })}
                metrics={ruleMetrics}
                variant="dutch"
                info={{ id: 'lobby-rule-dutch', ...localizedRuleInfo.dutch }}
                onInfoPress={showInfoPopover}
              />
            </Animated.ScrollView>
            {settingsScrollbarVisible ? (
              <View pointerEvents="none" style={styles.lobbyRulesScrollbarTrack}>
                <Animated.View
                  style={[
                    styles.lobbyRulesScrollbarThumb,
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
        {!panelVisible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('game.gameRules')}
            onPress={onOpen}
            style={[
              styles.lobbyRulesCollapsedPressTarget,
              { height: collapsedPanelHeight + Math.round(24 * scale) },
            ]}
          />
        ) : null}
      </View>

      <LobbyThemePickerModal
        visible={themePickerVisible}
        settings={activeSettings}
        sourceRect={themePickerSourceRect}
        onSelect={(thema) => onChange({ thema })}
        onClose={() => setThemePickerVisible(false)}
      />
      <LobbySpelmodusPickerModal
        visible={spelmodusPickerVisible}
        settings={activeSettings}
        sourceRect={spelmodusPickerSourceRect}
        onSelect={(modus) => onChange({ modus })}
        onClose={() => setSpelmodusPickerVisible(false)}
      />
      <InfoPopoverOverlay
        popover={activeInfoPopover}
        progress={infoPopoverProgress}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        onClose={closeInfoPopover}
      />
    </>
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

function PlayerGrid({
  players,
  canRemovePlayers = false,
  localPlayerIds = [],
  onRemovePlayer,
  avatarSize = 62,
  nameFontSize = 20,
  offlinePlayerRef = null,
  offlineRemoveRef = null,
}) {
  const slots = Array.from({ length: 6 }, (_, index) => players[index] ?? null);
  const localPlayerIdSet = useMemo(() => new Set(localPlayerIds), [localPlayerIds]);

  return (
    <ImageBackground
      source={LOBBY_PARKING_GRID_IMAGE}
      resizeMode="stretch"
      style={styles.grid}
      imageStyle={styles.gridBackgroundImage}
    >
      {slots.map((player, index) => {
        const isRightSlot = index % 2 === 1;

        return (
          <View
            ref={player?.isOffline ? offlinePlayerRef : null}
            collapsable={false}
            key={`parking-slot-${index}`}
            style={[
              styles.gridCell,
              PARKING_GRID_SLOT_STYLES[index],
            ]}
          >
            <AnimatedGridPlayer
              player={player}
              isRightSlot={isRightSlot}
              fallbackName={`Speler ${index + 1}`}
              avatarSize={avatarSize}
              nameFontSize={nameFontSize}
              canRemove={Boolean(
                canRemovePlayers
                && player
                && !localPlayerIdSet.has(player.playerId)
              )}
              onRemove={() => onRemovePlayer?.(player)}
              removeRef={player?.isOffline ? offlineRemoveRef : null}
            />
          </View>
        );
      })}
    </ImageBackground>
  );
}

function AnimatedGridPlayer({
  player,
  isRightSlot,
  fallbackName,
  canRemove = false,
  onRemove,
  avatarSize = 62,
  nameFontSize = 20,
  removeRef = null,
}) {
  const [renderedPlayer, setRenderedPlayer] = useState(player);
  const [exiting, setExiting] = useState(false);
  const playerIdRef = useRef(player?.playerId ?? null);
  const progress = useRef(new Animated.Value(player ? 1 : 0)).current;
  const offlinePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const nextPlayerId = player?.playerId ?? null;
    const currentPlayerId = playerIdRef.current;

    if (player) {
      setRenderedPlayer(player);
      setExiting(false);
      progress.stopAnimation();

      if (currentPlayerId !== nextPlayerId) {
        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else {
        progress.setValue(1);
      }

      playerIdRef.current = nextPlayerId;
      return;
    }

    if (!currentPlayerId) {
      return;
    }

    setExiting(true);
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        playerIdRef.current = null;
        setRenderedPlayer(null);
        setExiting(false);
      }
    });
  }, [player?.isOffline, player?.playerId, player?.naam, player?.skin, progress]);

  useEffect(() => {
    if (!renderedPlayer?.isOffline) {
      offlinePulse.stopAnimation();
      offlinePulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(offlinePulse, {
          toValue: 0.58,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(offlinePulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [offlinePulse, renderedPlayer?.isOffline]);

  if (!renderedPlayer) {
    return null;
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [exiting ? -PARKING_GRID_DRIVE_OFFSET_X : PARKING_GRID_DRIVE_OFFSET_X, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [exiting ? PARKING_GRID_DRIVE_OFFSET_Y : -PARKING_GRID_DRIVE_OFFSET_Y, 0],
  });
  const nameOpacity = renderedPlayer.naam ? progress : Animated.multiply(progress, 0.4);

  return (
    <View style={styles.gridPlayer}>
      <Animated.View
        style={[
          styles.gridPlayerAvatar,
          isRightSlot ? styles.gridPlayerAvatarRight : styles.gridPlayerAvatarLeft,
          {
            opacity: progress,
            transform: [
              { translateX },
              { translateY: -31 },
              { translateY },
            ],
          },
        ]}
      >
        <PlayerAvatar skin={renderedPlayer.skin} size={avatarSize} />
        {renderedPlayer.isOffline ? (
          <Animated.Image
            source={NO_WIFI_BADGE_IMAGE}
            resizeMode="contain"
            style={[
              styles.gridPlayerOfflineBadge,
              {
                opacity: offlinePulse,
                transform: [{ scale: offlinePulse }],
              },
            ]}
          />
        ) : null}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.66}
        style={[
          styles.gridPlayerName,
          isRightSlot ? styles.gridPlayerNameRight : styles.gridPlayerNameLeft,
          !renderedPlayer.naam ? styles.gridPlayerNamePlaceholder : null,
          {
            opacity: nameOpacity,
            fontSize: nameFontSize,
            lineHeight: Math.round(nameFontSize * 1.2),
          },
        ]}
      >
        {formatPlayerGridName(renderedPlayer.naam, fallbackName)}
      </Animated.Text>
      {canRemove ? (
        <Animated.View
          style={[
            styles.gridPlayerRemoveButton,
            isRightSlot ? styles.gridPlayerRemoveButtonRight : styles.gridPlayerRemoveButtonLeft,
            { opacity: progress },
          ]}
        >
          <Pressable
            ref={removeRef}
            collapsable={false}
            hitSlop={8}
            onPress={onRemove}
            style={styles.gridPlayerRemovePressable}
          >
            <RemovePlayerIcon size={27} />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
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
}) {
  const { width, height } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(width, height);
  const { language, t } = useTranslation();
  const { isPremium, ownedPaidSkins } = usePremium();
  const [challengeProgress, setChallengeProgress] = useState(null);
  const selectedSkinIndex = Math.max(0, SKIN_OPTIONS.indexOf(selectedSkin));
  const [activeIndex, setActiveIndex] = useState(selectedSkinIndex);

  useEffect(() => {
    if (visible) {
      setActiveIndex(selectedSkinIndex);
      void loadSkinChallengeProgress().then(setChallengeProgress);
    }
  }, [selectedSkinIndex, visible]);

  const activeSkin = SKIN_OPTIONS[activeIndex] ?? selectedSkin;
  const activeSkinTaken = takenSkins.includes(activeSkin) && activeSkin !== selectedSkin;
  const activeSkinLocked = (
    (isChallengeSkin(activeSkin) && !isSkinUnlocked(challengeProgress, activeSkin))
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
            itemWidth={isTablet ? 320 : 224}
            itemSpacing={isTablet ? 16 : 0}
            onSnapToItem={setActiveIndex}
            keyExtractor={(item) => item}
            containerStyle={styles.carouselWrap}
            flatListProps={{ initialScrollIndex: selectedSkinIndex }}
            renderCard={({ item }) => (
              (() => {
                const itemLocked = (
                  (isChallengeSkin(item) && !isSkinUnlocked(challengeProgress, item))
                  || !isSkinAvailableForPlayer(item, { isPremium, ownedPaidSkins })
                );
                const itemLockImage = isPremiumChallengeSkin(item) && !isPremium
                  ? PREMIUM_SKIN_LOCK_IMAGE
                  : isChallengeSkin(item) && !isSkinUnlocked(challengeProgress, item)
                  ? CHALLENGE_SKIN_LOCK_IMAGE
                  : PREMIUM_SKIN_LOCK_IMAGE;

                return (
              <View
                style={[
                  styles.carouselCardShell,
                  { shadowColor: PLAYER_HEX[item] ?? PLAYER_HEX.rood },
                ]}
              >
                <View
                  style={[
                    styles.carouselCard,
                    takenSkins.includes(item) && item !== selectedSkin ? styles.carouselCardTaken : null,
                  ]}
                >
                  <View style={itemLocked ? styles.challengeSkinLockedCar : null}>
                    <PlayerAvatar skin={item} size={isTablet ? 318 : CAROUSEL_CAR_SIZE} />
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

          <SkinChallengeProgressPanel
            skin={activeSkin}
            progress={challengeProgress}
            language={language}
            isPremium={isPremium}
            fontFamily={undefined}
          />

          <View style={styles.selectButtonWrap}>
            <GlossyButton
              label={t('common.select')}
              variant="green"
              heightOverride={isTablet ? 82 : 62}
              horizontalPadding={isTablet ? 62 : 44}
              onPress={() => onSelectSkin(activeSkin)}
              disabled={activeSkinTaken || activeSkinLocked}
            />
          </View>
        </Animated.View>
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

function AddPlayerButton({ visible, onPress }) {
  if (!visible) {
    return null;
  }

  return (
    <Pressable style={styles.addPlayerButton} onPress={onPress}>
      <Image
        source={PLAYER_SILHOUETTE_IMAGE}
        style={styles.addPlayerButtonImage}
        resizeMode="contain"
      />
    </Pressable>
  );
}

function PlayerEditor({
  player,
  compact = false,
  carSize = STAGE_SINGLE_CAR_SIZE,
  carOpacity,
  disableCar = false,
  hideRemove = false,
  nameWidth,
  onChangeName,
  onOpenSkinPicker,
  onRemove,
  carRef,
  attentionDelay = 0,
  defaultName = 'Speler',
}) {
  const playerColors = getPlayerSurfaceColors(player.skin);
  const carColor = PLAYER_HEX[player.skin] ?? playerColors.border ?? '#E03030';
  const handleNameFocus = () => {
    if (player.naam === defaultName) {
      onChangeName('');
    }
  };
  const handleNameBlur = () => {
    if (!player.naam.trim()) {
      onChangeName(defaultName);
    }
  };

  return (
    <View style={[styles.playerEditor, compact && styles.playerEditorCompact]}>
      <View
        style={[
          styles.nameInputWrap,
          compact && styles.nameInputWrapCompact,
          compact && nameWidth ? { width: nameWidth } : null,
          {
            backgroundColor: carColor,
            shadowColor: carColor,
          },
        ]}
      >
        <TextInput
          style={[
            styles.nameInput,
            compact && styles.nameInputCompact,
            {
              backgroundColor: 'rgba(255, 248, 232, 0.92)',
              color: playerColors.text,
            },
          ]}
          value={player.naam}
          onChangeText={(value) => onChangeName(value.slice(0, MAX_PLAYER_NAME_LENGTH))}
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          placeholder={defaultName}
          placeholderTextColor={playerColors.placeholderText}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
        />
      </View>

      <Animated.View style={carOpacity !== undefined ? { opacity: carOpacity } : null}>
        <View ref={carRef} collapsable={false}>
          <AttentionCarButton
            skin={player.skin}
            size={carSize}
            onPress={onOpenSkinPicker}
            disabled={disableCar}
            attentionDelay={attentionDelay}
          />
        </View>
      </Animated.View>

      {compact && onRemove ? (
        <Pressable
          style={[styles.removeButton, hideRemove && styles.removeButtonHidden]}
          onPress={onRemove}
          disabled={hideRemove}
        >
          <RemovePlayerIcon size={34} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function LobbyScreen({
  navigation,
  route,
  tutorialActive = false,
  tutorialStep = null,
  onTutorialTargetLayout = null,
  onTutorialAction = null,
  onTutorialRouteReveal = null,
}) {
  const config = route.params?.config;
  const tutorialMode = Boolean(route.params?.tutorialMode);
  const lobbyCodeTutorialActive = tutorialActive && tutorialStep?.target === 'lobby.codePlate';
  const isLiveLobby = config?.syncType === 'live' && !tutorialMode;
  const displaysLiveLobby = config?.syncType === 'live';
  const connectionStatus = useOnlineConnectionStatus(isLiveLobby);
  const liveConnectionOffline = isLiveLobby && connectionStatus.isOffline;
  const isCardCodeMode = config?.modus === 'wegenkaart'
    || config?.gameMode === 'wegenkaart'
    || config?.syncType === 'geen'
    || config?.syncType === 'offline';
  const maxLocalPlayers = isLiveLobby || tutorialMode ? 1 : MAX_LOCAL_PLAYERS;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(screenWidth, screenHeight);
  const { language, t } = useTranslation();
  const { isPremium, ownedPaidSkins } = usePremium();
  const routePlayers = Array.isArray(config?.spelers) && config.spelers.length
    ? config.spelers
        .slice(0, maxLocalPlayers)
        .map((player, index) => normalizeLocalPlayer(player, index === 0 ? 'rood' : 'blauw'))
    : null;
  const [liveLobby, setLiveLobby] = useState(null);
  const [stableLobbyPlayers, setStableLobbyPlayers] = useState(() => config?.liveLobbyPlayers ?? []);
  const [spelers, setSpelers] = useState(() => (
    routePlayers ?? [normalizeLocalPlayer(createPlayer({ skin: 'rood' }), 'rood')]
  ));
  const [startConfirmVisible, setStartConfirmVisible] = useState(false);
  const [startError, setStartError] = useState('');
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [gameSettingsVisible, setGameSettingsVisible] = useState(false);
  const [lobbyLayoutReady, setLobbyLayoutReady] = useState(false);
  const [lobbyAssetsReady, setLobbyAssetsReady] = useState(false);
  const [draftGameSettings, setDraftGameSettings] = useState(() => ({
    thema: config?.thema ?? 'snelweg',
    modus: config?.modus ?? 'klassiek',
    wincondition: config?.wincondition ?? '1rij',
    diagonaal: typeof config?.diagonaal === 'boolean' ? config.diagonaal : true,
    kaartOpzet: config?.kaartOpzet ?? 'zelfde',
    nederlands: config?.nederlands !== false,
  }));
  const handleLobbyWarmupReady = useCallback(() => {
    setLobbyAssetsReady(true);
  }, []);

  useEffect(() => {
    if (!lobbyLayoutReady || !lobbyAssetsReady) {
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
  }, [lobbyAssetsReady, lobbyLayoutReady, navigation]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('rood');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const startConfirmProgress = useRef(new Animated.Value(0)).current;
  const leaveConfirmProgress = useRef(new Animated.Value(0)).current;
  const startGameRevealRef = useRef(null);
  const leaveLobbyRevealRef = useRef(null);
  const remoteLobbyExitRevealRef = useRef(null);
  const hasObservedLiveLobbyRef = useRef(Boolean(config?.liveLobbyPlayers?.length));
  const localWasInLobbyRef = useRef(false);
  const selfLeavingLobbyRef = useRef(false);
  const lobbyMissingTimeoutRef = useRef(null);
  const confirmYesButtonRef = useRef(null);
  const lobbyPlayerShrinkTimeoutRef = useRef(null);
  const lobbyCodePlateRef = useRef(null);
  const lobbyPlayerSetupRef = useRef(null);
  const lobbyPlayerTableRef = useRef(null);
  const lobbyRulesTabRef = useRef(null);
  const lobbyRulesModeThemeRef = useRef(null);
  const lobbyStartButtonRef = useRef(null);
  const lobbyOfflinePlayerRef = useRef(null);
  const lobbyOfflineRemoveRef = useRef(null);
  const carOpacityValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const carRefs = useRef([]);
  const [startGameReveal, setStartGameReveal] = useState(null);
  const [leaveLobbyReveal, setLeaveLobbyReveal] = useState(null);
  const [remoteLobbyExitReveal, setRemoteLobbyExitReveal] = useState(null);
  const [lobbySnapshotReady, setLobbySnapshotReady] = useState(false);
  const [lobbySetupReady, setLobbySetupReady] = useState(!isLiveLobby);
  const stageCarSize = spelers.length >= 2
    ? Math.round(STAGE_MULTI_CAR_SIZE * (isTablet ? Math.min(tabletScale, 1.22) : 1))
    : Math.round(STAGE_SINGLE_CAR_SIZE * (isTablet ? Math.min(tabletScale, 1.22) : 1));
  const effectiveConfig = useMemo(
    () => ({
      ...config,
      ...(liveLobby?.config ?? {}),
      lobbyCode: config?.lobbyCode ?? liveLobby?.config?.lobbyCode,
      syncType: config?.syncType ?? liveLobby?.config?.syncType,
    }),
    [config, liveLobby?.config]
  );

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

  useEffect(() => {
    if (tutorialStep?.target === 'lobby.codePlate') {
      reportTutorialTarget('lobby.codePlate', lobbyCodePlateRef);
    } else if (tutorialStep?.target === 'lobby.playerSetup') {
      reportTutorialTarget('lobby.playerSetup', lobbyPlayerSetupRef);
    } else if (tutorialStep?.target === 'lobby.playerTable') {
      reportTutorialTarget('lobby.playerTable', lobbyPlayerTableRef);
    } else if (tutorialStep?.target === 'lobby.badConnectionPlayer') {
      reportTutorialTarget('lobby.badConnectionPlayer', lobbyOfflinePlayerRef);
    } else if (tutorialStep?.target === 'lobby.badConnectionRemove') {
      reportTutorialTarget('lobby.badConnectionRemove', lobbyOfflineRemoveRef);
    } else if (tutorialStep?.target === 'lobby.rulesTab') {
      reportTutorialTarget('lobby.rulesTab', lobbyRulesTabRef);
    } else if (tutorialStep?.target === 'lobby.rulesModeTheme') {
      reportTutorialTarget('lobby.rulesModeTheme', lobbyRulesModeThemeRef);
    } else if (tutorialStep?.target === 'lobby.startButton') {
      reportTutorialTarget('lobby.startButton', lobbyStartButtonRef);
    }
  }, [gameSettingsVisible, reportTutorialTarget, screenHeight, screenWidth, tutorialStep?.target]);

  useEffect(() => {
    if (tutorialStep?.id === 'host-lobby-start' && gameSettingsVisible) {
      setGameSettingsVisible(false);
    }
  }, [gameSettingsVisible, tutorialStep?.id]);

  useEffect(() => {
    const nextConfig = liveLobby?.config ?? config ?? {};
    setDraftGameSettings((current) => ({
      thema: nextConfig.thema ?? current.thema ?? 'snelweg',
      modus: nextConfig.modus ?? current.modus ?? 'klassiek',
      wincondition: nextConfig.wincondition ?? current.wincondition ?? '1rij',
      diagonaal: typeof nextConfig.diagonaal === 'boolean'
        ? nextConfig.diagonaal
        : (typeof current.diagonaal === 'boolean' ? current.diagonaal : true),
      kaartOpzet: nextConfig.kaartOpzet ?? current.kaartOpzet ?? 'zelfde',
      nederlands: typeof nextConfig.nederlands === 'boolean'
        ? nextConfig.nederlands
        : (typeof current.nederlands === 'boolean' ? current.nederlands : true),
    }));
  }, [
    config?.diagonaal,
    config?.kaartOpzet,
    config?.modus,
    config?.nederlands,
    config?.thema,
    config?.wincondition,
    liveLobby?.config?.diagonaal,
    liveLobby?.config?.kaartOpzet,
    liveLobby?.config?.modus,
    liveLobby?.config?.nederlands,
    liveLobby?.config?.thema,
    liveLobby?.config?.wincondition,
  ]);

  useEffect(() => {
    if (!startConfirmVisible) {
      startConfirmProgress.setValue(0);
      return;
    }

    startConfirmProgress.setValue(0);
    Animated.spring(startConfirmProgress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [startConfirmProgress, startConfirmVisible]);

  useEffect(() => {
    if (!leaveConfirmVisible) {
      leaveConfirmProgress.setValue(0);
      return;
    }

    leaveConfirmProgress.setValue(0);
    Animated.spring(leaveConfirmProgress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [leaveConfirmProgress, leaveConfirmVisible]);

  useEffect(() => {
    if (!startGameReveal) {
      return;
    }

    requestAnimationFrame(() => {
      startGameRevealRef.current?.reveal();
    });
  }, [startGameReveal]);

  useEffect(() => {
    if (!leaveLobbyReveal) {
      return;
    }

    requestAnimationFrame(() => {
      leaveLobbyRevealRef.current?.reveal();
    });
  }, [leaveLobbyReveal]);

  useEffect(() => {
    if (!remoteLobbyExitReveal) {
      return;
    }

    requestAnimationFrame(() => {
      remoteLobbyExitRevealRef.current?.reveal();
    });
  }, [remoteLobbyExitReveal]);

  useEffect(() => () => {
    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }
    if (lobbyMissingTimeoutRef.current) {
      clearTimeout(lobbyMissingTimeoutRef.current);
      lobbyMissingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isLiveLobby) {
      return;
    }

    const snapshotPlayers = liveLobby?.players;
    const nextPlayers = snapshotPlayers ?? config?.liveLobbyPlayers ?? [];
    if (!nextPlayers.length) {
      return;
    }

    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }

    setStableLobbyPlayers((current) => {
      if (snapshotPlayers) {
        return snapshotPlayers;
      }

      if (nextPlayers.length >= current.length) {
        return nextPlayers;
      }

      lobbyPlayerShrinkTimeoutRef.current = setTimeout(() => {
        setStableLobbyPlayers(nextPlayers);
        lobbyPlayerShrinkTimeoutRef.current = null;
      }, 2800);

      return current.length ? current : nextPlayers;
    });
  }, [config?.liveLobbyPlayers, isLiveLobby, liveLobby?.players]);

  useEffect(() => {
    if (routePlayers?.length) {
      setSpelers(routePlayers);
      setStorageLoaded(true);
      return;
    }

    Promise.all([
      AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY),
      AsyncStorage.getItem(EQUIPPED_SKIN_STORAGE_KEY),
    ]).then(([storedValue, storedEquippedSkin]) => {
      const preferredSkin = (
        SKIN_OPTIONS.includes(storedEquippedSkin)
        && isSkinAvailableForPlayer(storedEquippedSkin, { isPremium, ownedPaidSkins })
      ) ? storedEquippedSkin : 'rood';

      if (storedValue) {
        try {
          const parsed = JSON.parse(storedValue);
          const parsedPlayers = Array.isArray(parsed?.spelers) && parsed.spelers.length
            ? parsed.spelers
                .slice(0, 1)
                .map((player, index) => ({
                  ...normalizeLocalPlayer(player, index === 0 ? preferredSkin : 'blauw'),
                  skin: index === 0 ? preferredSkin : (player?.skin || 'blauw'),
                }))
            : null;

          if (parsedPlayers?.length) {
            setSpelers(parsedPlayers);
          } else {
            setSpelers((current) => current.map((player, index) => (
              index === 0 ? { ...player, skin: preferredSkin } : player
            )));
          }
        } catch (_error) {
          // Negeer corrupte placeholder-data.
          setSpelers((current) => current.map((player, index) => (
            index === 0 ? { ...player, skin: preferredSkin } : player
          )));
        }
      } else {
        setSpelers((current) => current.map((player, index) => (
          index === 0 ? { ...player, skin: preferredSkin } : player
        )));
      }
      setStorageLoaded(true);
    }).catch(() => {
      setSpelers((current) => current.map((player, index) => (
        index === 0 ? { ...player, skin: 'rood' } : player
      )));
      setStorageLoaded(true);
    });
  }, []);

  useEffect(() => {
    Animated.timing(playerLayoutProgress, {
      toValue: spelers.length >= 2 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playerLayoutProgress, spelers.length]);

  useEffect(() => {
    if (spelers.length <= maxLocalPlayers) {
      return;
    }

    setSpelers((current) => current.slice(0, maxLocalPlayers));
  }, [maxLocalPlayers, spelers.length]);

  const localPlayerIds = useMemo(
    () => spelers.map((player) => player.playerId),
    [spelers]
  );
  const knownLobbyPlayers = useMemo(
    () => stableLobbyPlayers.length ? stableLobbyPlayers : (config?.liveLobbyPlayers ?? []),
    [config?.liveLobbyPlayers, stableLobbyPlayers]
  );
  const localLobbyPlayers = useMemo(
    () => knownLobbyPlayers.filter((player) => localPlayerIds.includes(player.playerId)),
    [knownLobbyPlayers, localPlayerIds]
  );
  const hasKnownLobbyPlayers = knownLobbyPlayers.length > 0;
  const isLocalHost = config?.syncType === 'live'
    ? (
        localLobbyPlayers.some((player) => player.role === 'host')
        || (!hasKnownLobbyPlayers && Boolean(config?.lobbyCode))
      )
    : true;
  const isKnownGuest = config?.syncType === 'live'
    ? localLobbyPlayers.some((player) => player.role !== 'host')
    : false;

  useEffect(() => {
    if (!isLiveLobby || !config?.lobbyCode || liveConnectionOffline || !localPlayerIds.length) {
      return undefined;
    }

    void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    const interval = setInterval(() => {
      void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    }, 5000);

    return () => clearInterval(interval);
  }, [config?.lobbyCode, isLiveLobby, liveConnectionOffline, localPlayerIds]);

  useEffect(() => {
    if (!isLiveLobby || !config?.lobbyCode || !storageLoaded || !isLocalHost) {
      setLobbySetupReady(!isLiveLobby || !isLocalHost);
      return undefined;
    }

    let cancelled = false;
    setLobbySetupReady(false);

    void ensureLobby({
      code: config.lobbyCode,
      config,
      hostPlayer: {
        ...spelers[0],
        playerId: spelers[0].playerId,
        naam: normalizeName(spelers[0].naam) || getDefaultPlayerName(0),
        role: 'host',
      },
      resetExisting: !config?.liveLobbyPlayers?.length && (config?.startedAt ?? null) === null,
    }).then((snapshot) => {
      if (!cancelled) {
        setLobbySetupReady(Boolean(snapshot));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    config,
    config?.liveLobbyPlayers?.length,
    config?.lobbyCode,
    config?.startedAt,
    isLiveLobby,
    isLocalHost,
    spelers[0]?.playerId,
    storageLoaded,
  ]);

  useEffect(() => {
    if (!isLiveLobby || !config?.lobbyCode) {
      return undefined;
    }

    setLobbySnapshotReady(false);
    const publishLobbySnapshot = (snapshot) => {
      setLobbySnapshotReady(true);
      setLiveLobby(snapshot);
    };

    const unsubscribe = subscribeToLobby(config.lobbyCode, publishLobbySnapshot);
    return unsubscribe;
  }, [config?.lobbyCode, isLiveLobby]);

  function startRemoteLobbyExit(message) {
    if (selfLeavingLobbyRef.current || remoteLobbyExitReveal || leaveLobbyReveal) {
      return;
    }

    setRemoteLobbyExitReveal({
      message,
      originX: screenWidth / 2,
      originY: screenHeight / 2,
      transitionKey: `remote-lobby-exit-${Date.now()}`,
    });
  }

  function completeRemoteLobbyExit() {
    const message = remoteLobbyExitReveal?.message
      ?? 'Je bent uit de lobby gehaald of de lobby is gestopt.';
    const transitionKey = remoteLobbyExitReveal?.transitionKey ?? `remote-lobby-home-${Date.now()}`;

    navigation.reset('Home', {
      lobbyExitMessage: message,
      transition: {
        color: LEAVE_LOBBY_REVEAL_GREEN,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Home',
        pauseMs: 180,
        transitionKey,
      },
    });
  }

  useEffect(() => {
    if (!isLiveLobby || isLocalHost || liveConnectionOffline) {
      if (lobbyMissingTimeoutRef.current) {
        clearTimeout(lobbyMissingTimeoutRef.current);
        lobbyMissingTimeoutRef.current = null;
      }
      return;
    }

    if (liveLobby) {
      hasObservedLiveLobbyRef.current = true;
      if (lobbyMissingTimeoutRef.current) {
        clearTimeout(lobbyMissingTimeoutRef.current);
        lobbyMissingTimeoutRef.current = null;
      }
      return;
    }

    if (
      lobbySnapshotReady
      && liveLobby === null
      && hasObservedLiveLobbyRef.current
      && !lobbyMissingTimeoutRef.current
    ) {
      lobbyMissingTimeoutRef.current = setTimeout(() => {
        lobbyMissingTimeoutRef.current = null;
        startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      }, 1800);
    }
  }, [isLiveLobby, isLocalHost, liveConnectionOffline, liveLobby, lobbySnapshotReady, leaveLobbyReveal, remoteLobbyExitReveal]);

  useEffect(() => {
    if (!isLiveLobby || isLocalHost || liveConnectionOffline || !liveLobby) {
      return;
    }

    if (liveLobby.ended || !liveLobby.players?.length) {
      startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      return;
    }

    const hostStillInLobby = liveLobby.players.some((player) => player.role === 'host');
    if (!hostStillInLobby) {
      startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      return;
    }

    const localPlayerInLobby = liveLobby.players.some((player) => localPlayerIds.includes(player.playerId));
    if (localPlayerInLobby) {
      localWasInLobbyRef.current = true;
      return;
    }

    if (localWasInLobbyRef.current) {
      startRemoteLobbyExit('Je bent verwijderd uit de lobby.');
    }
  }, [isLiveLobby, isLocalHost, liveConnectionOffline, liveLobby, localPlayerIds, leaveLobbyReveal, remoteLobbyExitReveal]);

  useEffect(() => {
    if (!isLiveLobby || !liveLobby?.started || liveConnectionOffline) {
      return;
    }

    if (remoteLobbyExitReveal) {
      return;
    }

    const nextStartedAt = liveLobby.startedAt ?? null;
    const currentStartedAt = config?.startedAt ?? null;
    if (!nextStartedAt || nextStartedAt === currentStartedAt) {
      return;
    }

    if (!isLocalHost || isKnownGuest) {
      if (!startGameReveal) {
        setStartGameReveal({
          originX: screenWidth / 2,
          originY: screenHeight / 2,
          transitionKey: `joined-lobby-spel-${Date.now()}`,
          source: 'remote',
        });
      }
      return;
    }

    if (startGameReveal) {
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...effectiveConfig,
        ...(liveLobby.config ?? {}),
        spelers: withDefaultPlayerNames(spelers),
        aantalSpelersOpDitApparaat: spelers.length,
        liveLobbyPlayers: liveLobby.players?.length >= knownLobbyPlayers.length
          ? liveLobby.players
          : knownLobbyPlayers,
        startedAt: nextStartedAt,
      },
      replayAt: Date.now(),
    });
  }, [
    config?.startedAt,
    isLiveLobby,
    effectiveConfig,
    isLocalHost,
    isKnownGuest,
    knownLobbyPlayers,
    liveLobby,
    liveConnectionOffline,
    navigation,
    screenHeight,
    screenWidth,
    spelers,
    remoteLobbyExitReveal,
    startGameReveal,
  ]);

  const andereSpelers = useMemo(
    () => (liveLobby?.players ?? []).filter((player) => !localPlayerIds.includes(player.playerId)),
    [liveLobby?.players, localPlayerIds]
  );

  useEffect(() => {
    setSpelers((current) => resolveUniqueLocalPlayers(current, andereSpelers));
  }, [andereSpelers]);

  const validationError = useMemo(() => {
    const seenNames = new Set();
    const seenSkins = new Set();

    for (const remotePlayer of andereSpelers) {
      const remoteName = normalizeName(remotePlayer.naam).toLowerCase();
      if (remoteName) {
        seenNames.add(remoteName);
      }
      seenSkins.add(remotePlayer.skin);
    }

    for (const player of spelers) {
      const normalizedName = normalizeName(player.naam);
      if (normalizedName.length > MAX_PLAYER_NAME_LENGTH) {
        return `Naam mag maximaal ${MAX_PLAYER_NAME_LENGTH} tekens zijn.`;
      }

      if (normalizedName) {
        const lowercaseName = normalizedName.toLowerCase();
        if (seenNames.has(lowercaseName)) {
          return isCardCodeMode
            ? 'Een van deze namen is al gekozen voor deze kaartcode.'
            : 'Een van deze namen is al in gebruik in de lobby.';
        }
        seenNames.add(lowercaseName);
      }

      if (seenSkins.has(player.skin)) {
        return isCardCodeMode
          ? 'Een van deze autokleuren is al gekozen voor deze kaartcode.'
          : 'Een van deze autokleuren is al gekozen in de lobby.';
      }
      seenSkins.add(player.skin);
    }

    return '';
  }, [andereSpelers, isCardCodeMode, spelers]);

  const canStartHost = isLocalHost
    && !validationError
    && !liveConnectionOffline;
  const showHostGameSettingsButton = displaysLiveLobby && isLocalHost && !isCardCodeMode;

  useEffect(() => {
    if (!isLiveLobby || !config?.lobbyCode || validationError || liveConnectionOffline) {
      return undefined;
    }

    const normalizedPlayers = withDefaultPlayerNames(spelers).map((player, index) => ({
      ...player,
      role: isLocalHost && index === 0 ? 'host' : 'guest',
    }));

    const timeout = setTimeout(() => {
      void upsertPlayers(config.lobbyCode, normalizedPlayers);

      void AsyncStorage.setItem(
        PLAYER_SETUP_STORAGE_KEY,
        JSON.stringify({
          spelers: normalizedPlayers.map(({ role, ...player }) => ({
            ...player,
            naam: normalizeCustomPlayerName(player.naam),
          })),
        })
      );
    }, 180);

    return () => clearTimeout(timeout);
  }, [config?.lobbyCode, isLiveLobby, isLocalHost, liveConnectionOffline, spelers, validationError]);

  const deelnemers = useMemo(() => {
    if (config?.syncType !== 'live') {
      return spelers;
    }

    return knownLobbyPlayers.length ? knownLobbyPlayers : spelers;
  }, [config?.syncType, knownLobbyPlayers, spelers]);
  const isSinglePlayerLobby = deelnemers.length <= 1;
  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const takenSkins = useMemo(
    () => [
      ...andereSpelers.map((player) => player.skin),
      ...spelers.filter((_, index) => index !== selectedPlayerIndex).map((player) => player.skin),
    ],
    [andereSpelers, selectedPlayerIndex, spelers]
  );

  function updateSpeler(index, patch) {
    setSpelers((current) => current.map((player, playerIndex) => (
      playerIndex === index
        ? {
            ...player,
            ...patch,
            naam: patch.naam !== undefined ? normalizeName(patch.naam) : player.naam,
          }
        : player
    )));
  }

  function handleAddPlayer() {
    if (spelers.length >= maxLocalPlayers) {
      return;
    }

    const usedSkins = new Set([
      ...andereSpelers.map((player) => player.skin),
      ...spelers.map((player) => player.skin),
    ]);
    const preferredSkins = SKIN_OPTIONS.filter((skin) => !usedSkins.has(skin));
    const fallbackSkin = preferredSkins[0] ?? 'blauw';

    setSpelers((current) => [
      ...current,
      normalizeLocalPlayer(createPlayer({ skin: fallbackSkin }), fallbackSkin),
    ]);
  }

  function handleRemovePlayer(index) {
    const playerToRemove = spelers[index];
    if (!playerToRemove || index === 0) {
      return;
    }

    setSpelers((current) => current.filter((_, currentIndex) => currentIndex !== index));

    if (config?.syncType === 'live' && config?.lobbyCode) {
      void removePlayers(config.lobbyCode, [playerToRemove.playerId]);
    }
  }

  function handleRemoveLobbyPlayer(playerToRemove) {
    if (!isLocalHost || !config?.lobbyCode || !playerToRemove?.playerId) {
      return;
    }

    if (localPlayerIds.includes(playerToRemove.playerId)) {
      return;
    }

    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }
    setStableLobbyPlayers((current) => current.filter((player) => player.playerId !== playerToRemove.playerId));
    if (tutorialMode && tutorialStep?.advanceOnAction === 'lobby.badConnectionRemoved') {
      onTutorialAction?.('lobby.badConnectionRemoved');
    }
    if (tutorialMode) {
      return;
    }
    void removePlayers(config.lobbyCode, [playerToRemove.playerId]);
  }

  function handleStart(event) {
    if (!canStartHost) {
      return;
    }

    setStartError('');

    if (isLiveLobby && !lobbySetupReady) {
      setLobbySetupReady(true);
    }

    if (tutorialMode) {
      const startedAt = new Date().toISOString();
      const normalizedPlayers = withDefaultPlayerNames(spelers);
      const tutorialGameConfig = {
        ...effectiveConfig,
        ...draftGameSettings,
        syncType: 'live',
        lobbyCode: config?.lobbyCode,
        spelers: normalizedPlayers,
        aantalSpelersOpDitApparaat: normalizedPlayers.length,
        liveLobbyPlayers: knownLobbyPlayers.length ? knownLobbyPlayers : normalizedPlayers,
        startedAt,
      };
      const originEvent = event?.nativeEvent ?? {};
      const origin = {
        nativeEvent: {
          pageX: typeof originEvent.pageX === 'number' ? originEvent.pageX : screenWidth / 2,
          pageY: typeof originEvent.pageY === 'number' ? originEvent.pageY : screenHeight / 2,
        },
      };

      if (onTutorialRouteReveal) {
        onTutorialRouteReveal({
          color: START_GAME_REVEAL_BLUE,
          routeName: 'Spel',
          routeParams: {
            config: tutorialGameConfig,
            replayAt: `tutorial-host-game-${Date.now()}`,
            tutorialMode: true,
          },
          actionName: 'lobby.startPressed',
          origin,
        });
      } else {
        onTutorialAction?.('lobby.startPressed');
        navigation.replace('Spel', {
          config: tutorialGameConfig,
          replayAt: `tutorial-host-game-${Date.now()}`,
          tutorialMode: true,
        });
      }
      return;
    }

    if (isCardCodeMode) {
      if (startGameReveal) {
        return;
      }
      setStartGameReveal({
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        transitionKey: `kaartcode-spel-${Date.now()}`,
        source: 'host',
      });
      return;
    }

    setStartConfirmVisible(true);
  }

  function handleOpenGameSettings() {
    if (!showHostGameSettingsButton || liveConnectionOffline) {
      return;
    }

    onTutorialAction?.('lobby.rulesOpened');
    setGameSettingsVisible(true);
  }

  function updateDraftGameSettings(patch) {
    const nextSettings = {
      ...draftGameSettings,
      ...patch,
    };

    setDraftGameSettings(nextSettings);
    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences(nextSettings)
    );

    if (!isLiveLobby || !isLocalHost || !config?.lobbyCode || liveConnectionOffline) {
      return;
    }

    const nextConfig = createGameConfig({
      ...effectiveConfig,
      ...nextSettings,
      syncType: effectiveConfig.syncType ?? config?.syncType,
      lobbyCode: config.lobbyCode,
      seed: createRandomSeed(),
      salt: createRandomSalt(),
      aantalSpelersOpDitApparaat: 1,
    });

    void updateLobbySettings(config.lobbyCode, nextConfig).then((updatedLobby) => {
      if (updatedLobby) {
        setLiveLobby(updatedLobby);
      }
    });
  }

  function handleBackPress() {
    if (lobbyCodeTutorialActive) {
      return;
    }

    setLeaveConfirmVisible(true);
  }

  function handleConfirmLeavePress(event) {
    if (leaveLobbyReveal) {
      return;
    }

    selfLeavingLobbyRef.current = true;

    const origin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : {
          x: screenWidth / 2,
          y: screenHeight / 2,
        };

    setLeaveLobbyReveal({
      originX: origin.x,
      originY: origin.y,
      transitionKey: `leave-lobby-${Date.now()}`,
    });
  }

  async function confirmLeaveLobby(transitionKey) {
    if (config?.syncType === 'live' && config?.lobbyCode) {
      if (isLocalHost) {
        await deleteLobby(config.lobbyCode);
      } else {
        await removePlayers(config.lobbyCode, localPlayerIds);
      }
    }

    if (navigation.goBackWithTransition) {
      navigation.goBackWithTransition({
        color: LEAVE_LOBBY_REVEAL_GREEN,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        pauseMs: 260,
        transitionKey,
      });
    } else {
      navigation.goBack?.();
    }

    setTimeout(() => {
      setLeaveConfirmVisible(false);
      setLeaveLobbyReveal(null);
    }, 80);
  }

  async function handleConfirmStartPress(event) {
    if (startGameReveal) {
      return;
    }

    const pressOrigin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : null;

    setStartError('');

    if (isLiveLobby) {
      const online = await checkOnlineConnection(1600);
      if (!online) {
        setStartConfirmVisible(false);
        return;
      }
    }

    const origin = pressOrigin
      ?? await measureViewCenter(confirmYesButtonRef, {
        x: screenWidth / 2,
        y: screenHeight / 2,
      });

    setStartGameReveal({
      originX: origin.x,
      originY: origin.y,
      transitionKey: `lobby-spel-${Date.now()}`,
      source: 'host',
    });
  }

  async function confirmStart(transitionKey) {
    if (isLiveLobby) {
      const online = await checkOnlineConnection(1600);
      if (!online) {
        setStartGameReveal(null);
        setStartConfirmVisible(false);
        return;
      }
    }

    const normalizedPlayers = withDefaultPlayerNames(spelers);
    const storagePlayers = spelers.map((player) => ({
      ...player,
      naam: normalizeCustomPlayerName(player.naam),
    }));
    const startConfig = {
      ...effectiveConfig,
      ...draftGameSettings,
      syncType: effectiveConfig.syncType ?? config?.syncType,
      lobbyCode: config?.lobbyCode,
    };

    await AsyncStorage.setItem(
      PLAYER_SETUP_STORAGE_KEY,
      JSON.stringify({ spelers: storagePlayers })
    );

    let startedLobby = null;
    if (isLiveLobby) {
      await upsertPlayers(
        config.lobbyCode,
        normalizedPlayers.map((player, index) => ({ ...player, role: isLocalHost && index === 0 ? 'host' : 'guest' }))
      );

      const syncedLobby = await updateLobbySettings(config.lobbyCode, startConfig);
      if (!syncedLobby) {
        setStartError('De spelregels konden niet worden opgeslagen. Probeer het nog een keer.');
        setStartGameReveal(null);
        setStartConfirmVisible(false);
        return;
      }
      setLiveLobby(syncedLobby);

      startedLobby = await startLobby(config.lobbyCode);

      if (!startedLobby?.started || !startedLobby.startedAt) {
        const hostPlayer = {
          ...normalizedPlayers[0],
          role: 'host',
        };

        await ensureLobby({
          code: config.lobbyCode,
          config: startConfig,
          hostPlayer,
          resetExisting: false,
        });
        startedLobby = await startLobby(config.lobbyCode);
      }

      if (!startedLobby?.started || !startedLobby.startedAt) {
        if (!isSinglePlayerLobby) {
          setStartError('De lobby kon niet worden gestart. Probeer het nog een keer.');
          setStartGameReveal(null);
          setStartConfirmVisible(false);
          return;
        }

        startedLobby = {
          started: true,
          startedAt: new Date().toISOString(),
          config: startConfig,
          players: normalizedPlayers,
        };
      }
    }

    navigation.replace('Spel', {
      config: {
        ...startConfig,
        ...(startedLobby?.config ?? {}),
        aantalSpelersOpDitApparaat: normalizedPlayers.length,
        spelers: normalizedPlayers,
        liveLobbyPlayers: startedLobby?.players?.length >= knownLobbyPlayers.length
          ? startedLobby.players
          : (knownLobbyPlayers.length ? knownLobbyPlayers : (liveLobby?.players ?? normalizedPlayers)),
        startedAt: startedLobby?.startedAt ?? null,
      },
      tutorialMode,
      transition: {
        color: START_GAME_REVEAL_BLUE,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Spel',
        pauseMs: 80,
        minSolidMs: 560,
        settleMs: 220,
        routeReadySettleMs: 520,
        transitionKey,
      },
    });
  }

  function openStartedLobbyGame(transitionKey) {
    const nextStartedAt = liveLobby?.startedAt ?? null;

    if (!nextStartedAt) {
      setStartGameReveal(null);
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...effectiveConfig,
        ...(liveLobby.config ?? {}),
        spelers: withDefaultPlayerNames(spelers),
        aantalSpelersOpDitApparaat: spelers.length,
        liveLobbyPlayers: liveLobby.players?.length >= knownLobbyPlayers.length
          ? liveLobby.players
          : knownLobbyPlayers,
        startedAt: nextStartedAt,
      },
      replayAt: Date.now(),
      transition: {
        color: START_GAME_REVEAL_BLUE,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Spel',
        pauseMs: 80,
        minSolidMs: 560,
        settleMs: 220,
        routeReadySettleMs: 520,
        transitionKey,
      },
    });
  }

  const playerStageWidth = Math.max(0, screenWidth - SCREEN_HORIZONTAL_PADDING * 2);
  const laneOffset = playerStageWidth / 4;
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
  function animatePickerOpen(index) {
    const targetRef = carRefs.current[index];
    targetRef?.measureInWindow?.((x, y, width) => {
      const sourceSize = stageCarSize;
      const measuredWidth = width || sourceSize;
      const sourceLeft = x + (measuredWidth - sourceSize) / 2;
      const destinationLeft = (screenWidth - sourceSize) / 2;

      setHeroTop(y + HERO_CAR_Y_OFFSET);
      setTransitionSourceLeft(sourceLeft);
      setTransitionSkin(spelers[index]?.skin ?? 'rood');
      setTransitionCarSize(sourceSize);
      setSelectedPlayerIndex(index);
      setSkinPickerMounted(true);
      carOpacityValues[index]?.stopAnimation();
      carOpacityValues[index]?.setValue(0);
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

    if (nextSkin && isSkinAvailableForPlayer(nextSkin, { isPremium, ownedPaidSkins })) {
      setTransitionSkin(nextSkin);
      updateSpeler(closingPlayerIndex, { skin: nextSkin });
      if (closingPlayerIndex === 0) {
        void AsyncStorage.setItem(EQUIPPED_SKIN_STORAGE_KEY, nextSkin);
      }
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
      transitionOpacity.setValue(0);
      carOpacityValues[closingPlayerIndex]?.setValue(1);
      setSelectedPlayerIndex(null);
      setSkinPickerMounted(false);
    });
  }

  return (
    <>
      <WarmupImages
        assets={WAITING_ROOM_ASSETS}
        timeoutMs={null}
        imageSize={128}
        batchSize={16}
        onReady={handleLobbyWarmupReady}
      />
      <ScreenLayout
        onLayout={() => setLobbyLayoutReady(true)}
        title=""
        scroll={false}
        backgroundImage={LOBBY_ROAD_BACKGROUND_IMAGE}
        footerTransparent
        footer={showHostGameSettingsButton ? null : (
          <View
            ref={lobbyStartButtonRef}
            collapsable={false}
            style={[styles.lobbyActionStack, showHostGameSettingsButton && styles.lobbyActionStackWithRules]}
          >
            <GlossyButton
              label="Start spel"
              variant="blue"
              size="large"
              disabled={!canStartHost}
              onPress={handleStart}
              heightOverride={62}
              labelOffsetY={-1}
            />
          </View>
        )}
      >
        <View style={styles.topBar}>
          <BackButton
            navigation={navigation}
            disabled={lobbyCodeTutorialActive}
            onPress={handleBackPress}
          />
        </View>

        <View style={[styles.screenBody, showHostGameSettingsButton && styles.screenBodyWithHostRules]}>
          <View ref={lobbyCodePlateRef} collapsable={false}>
            <LobbyCodePlate
              code={config?.lobbyCode}
              title={isCardCodeMode ? t('game.cardCode') : t('game.lobbyCode')}
              preserveCodeCharacters={tutorialMode}
            />
          </View>

          <View
            ref={lobbyPlayerSetupRef}
            collapsable={false}
            style={[styles.playerStage, showHostGameSettingsButton && styles.playerStageWithHostRules]}
          >
            <Animated.View
              style={[
                styles.playerStageSlot,
                { transform: [{ translateX: firstPlayerTranslateX }] },
              ]}
            >
              <PlayerEditor
                player={spelers[0]}
                compact={spelers.length >= 2}
                carSize={stageCarSize}
                carOpacity={carOpacityValues[0]}
                disableCar={skinPickerMounted && selectedPlayerIndex === 0}
                nameWidth={getCompactNameInputWidth(spelers[0]?.naam)}
                carRef={(node) => {
                  carRefs.current[0] = node;
                }}
                onChangeName={(naam) => updateSpeler(0, { naam })}
                onOpenSkinPicker={() => animatePickerOpen(0)}
                attentionDelay={0}
                defaultName={getDefaultPlayerNameForLanguage(language, 0)}
              />
            </Animated.View>

            <View
              pointerEvents="box-none"
              style={[
                styles.playerStageSlot,
                { transform: [{ translateX: laneOffset }] },
              ]}
            >
              <Animated.View
                pointerEvents={spelers.length >= 2 || skinPickerMounted ? 'none' : 'auto'}
                style={[
                  styles.stageOverlay,
                  {
                    opacity: skinPickerMounted ? 0 : addButtonOpacity,
                    transform: [{ translateX: addButtonTranslateX }],
                  },
                ]}
              >
                <AddPlayerButton visible={spelers.length < maxLocalPlayers} onPress={handleAddPlayer} />
              </Animated.View>

              {spelers[1] ? (
                <Animated.View
                  style={[
                    styles.stageOverlay,
                    {
                      opacity: secondPlayerOpacity,
                      transform: [
                        { translateY: secondPlayerTranslateY },
                        { scale: secondPlayerScale },
                      ],
                    },
                  ]}
                >
                  <PlayerEditor
                    player={spelers[1]}
                    compact
                    carSize={stageCarSize}
                    carOpacity={carOpacityValues[1]}
                    disableCar={skinPickerMounted && selectedPlayerIndex === 1}
                    hideRemove={skinPickerMounted && selectedPlayerIndex === 1}
                    nameWidth={getCompactNameInputWidth(spelers[1]?.naam)}
                    carRef={(node) => {
                      carRefs.current[1] = node;
                    }}
                    onChangeName={(naam) => updateSpeler(1, { naam })}
                    onOpenSkinPicker={() => animatePickerOpen(1)}
                    onRemove={() => handleRemovePlayer(1)}
                    attentionDelay={CAR_ATTENTION_STAGGER_MS}
                    defaultName={getDefaultPlayerNameForLanguage(language, 1)}
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>

          {validationError ? <InlineNote>{validationError}</InlineNote> : null}
          {startError ? <InlineNote>{startError}</InlineNote> : null}

          {!isCardCodeMode ? (
            <View ref={lobbyPlayerTableRef} collapsable={false}>
              <PlayerGrid
                players={deelnemers}
                canRemovePlayers={displaysLiveLobby && isLocalHost}
                localPlayerIds={localPlayerIds}
                onRemovePlayer={handleRemoveLobbyPlayer}
                offlinePlayerRef={lobbyOfflinePlayerRef}
                offlineRemoveRef={lobbyOfflineRemoveRef}
              />
            </View>
          ) : null}

        </View>
      </ScreenLayout>

      {showHostGameSettingsButton ? (
        <>
          <View pointerEvents="box-none" style={styles.hostLobbyFloatingActions}>
            <View ref={lobbyStartButtonRef} collapsable={false}>
              <GlossyButton
                label="Start spel"
                variant="blue"
                size="large"
                disabled={!canStartHost}
                onPress={handleStart}
                heightOverride={62}
                labelOffsetY={-1}
              />
            </View>
          </View>
          <LobbyGameSettingsDock
            visible
            open={gameSettingsVisible}
            settings={draftGameSettings}
            onChange={updateDraftGameSettings}
            onOpen={handleOpenGameSettings}
            onClose={() => setGameSettingsVisible(false)}
            headerRef={lobbyRulesTabRef}
            overviewRef={lobbyRulesModeThemeRef}
            tutorialActive={tutorialActive}
          />
        </>
      ) : null}

      <ConnectionWarningOverlay
        visible={liveConnectionOffline}
        width={screenWidth}
        height={screenHeight}
      />

      <SkinCarouselModal
        visible={skinPickerMounted && selectedPlayer !== null}
        selectedSkin={selectedPlayer?.skin ?? 'rood'}
        takenSkins={takenSkins}
        heroTop={heroTop}
        overlayOpacity={overlayOpacity}
        carouselOpacity={carouselOpacity}
        onClose={() => animatePickerClose()}
        onSelectSkin={(skin) => animatePickerClose(skin)}
      />

      {!showHostGameSettingsButton ? (
        <LobbyGameSettingsPage
          visible={gameSettingsVisible}
          settings={draftGameSettings}
          onChange={updateDraftGameSettings}
          onClose={() => {
            setGameSettingsVisible(false);
          }}
        />
      ) : null}

      <Modal
        visible={leaveConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaveConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <Animated.View
            style={{
              opacity: leaveConfirmProgress,
              transform: [
                {
                  scale: leaveConfirmProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            }}
          >
            <PopupPanel
              title={isCardCodeMode ? t('game.leaveCardCode') : t('game.leaveLobby')}
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label={t('game.options.no')}
                      variant="red"
                      onPress={() => setLeaveConfirmVisible(false)}
                      disabled={Boolean(leaveLobbyReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label={t('game.options.yes')}
                      variant="green"
                      onPress={handleConfirmLeavePress}
                      disabled={Boolean(leaveLobbyReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                </>
              )}
            >
              {isLocalHost
                ? (isCardCodeMode
                  ? 'Als je deze pagina verlaat, verdwijnt deze kaartcode uit beeld.'
                  : 'Als je deze pagina verlaat, verdwijnt de lobby.')
                : 'Als je nu de pagina verlaat, verlaat je ook de lobby. Je kunt later nog weer joinen.'}
            </PopupPanel>
          </Animated.View>
          {leaveLobbyReveal ? (
            <CircularReveal
              key={leaveLobbyReveal.transitionKey}
              ref={leaveLobbyRevealRef}
              color={LEAVE_LOBBY_REVEAL_GREEN}
              originX={leaveLobbyReveal.originX}
              originY={leaveLobbyReveal.originY}
              onComplete={() => {
                void confirmLeaveLobby(leaveLobbyReveal.transitionKey);
              }}
            />
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={startConfirmVisible}
        transparent
        animationType="none"
        onRequestClose={() => setStartConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <Animated.View
            style={{
              opacity: startConfirmProgress,
              transform: [
                {
                  scale: startConfirmProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            }}
          >
            <PopupPanel
              title={t('game.startGame')}
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label={t('game.options.no')}
                      variant="red"
                      onPress={() => setStartConfirmVisible(false)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                  <View
                    ref={confirmYesButtonRef}
                    collapsable={false}
                    style={styles.confirmGlossyButton}
                  >
                    <GlossyButton
                      label={t('game.options.yes')}
                      variant="green"
                      onPress={(event) => {
                        void handleConfirmStartPress(event);
                      }}
                      disabled={Boolean(startGameReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                </>
              )}
            >
              {isSinglePlayerLobby ? (
                <Text style={[styles.confirmText, isTablet && styles.confirmTextTablet]}>
                  Er is maar <Text style={styles.confirmTextStrong}>1 speler</Text>{isCardCodeMode ? ' klaar.' : ' in de lobby.'}
                  {' '}Weet je zeker dat je wilt spelen?
                </Text>
              ) : (
                'Weet je zeker dat je het spel wilt beginnen?'
              )}
            </PopupPanel>
          </Animated.View>
          {startGameReveal && startGameReveal.source !== 'remote' ? (
            <CircularReveal
              key={startGameReveal.transitionKey}
              ref={startGameRevealRef}
              color={START_GAME_REVEAL_BLUE}
              originX={startGameReveal.originX}
              originY={startGameReveal.originY}
              onComplete={() => {
                if (startGameReveal.source === 'remote') {
                  openStartedLobbyGame(startGameReveal.transitionKey);
                  return;
                }

                void confirmStart(startGameReveal.transitionKey);
              }}
            />
          ) : null}
        </View>
      </Modal>

      {startGameReveal?.source === 'remote' ? (
        <CircularReveal
          key={startGameReveal.transitionKey}
          ref={startGameRevealRef}
          color={START_GAME_REVEAL_BLUE}
          originX={startGameReveal.originX}
          originY={startGameReveal.originY}
          onComplete={() => {
            openStartedLobbyGame(startGameReveal.transitionKey);
          }}
        />
      ) : null}

      {remoteLobbyExitReveal ? (
        <CircularReveal
          key={remoteLobbyExitReveal.transitionKey}
          ref={remoteLobbyExitRevealRef}
          color={LEAVE_LOBBY_REVEAL_GREEN}
          originX={remoteLobbyExitReveal.originX}
          originY={remoteLobbyExitReveal.originY}
          onComplete={completeRemoteLobbyExit}
        />
      ) : null}

      {skinPickerMounted && selectedPlayer !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.transitionCar,
            {
              top: heroTop,
              left: transitionSourceLeft,
              opacity: transitionOpacity,
              transform: [
                { translateX: transitionTranslateX },
              ],
            },
          ]}
        >
          <PlayerAvatar skin={transitionSkin} size={transitionCarSize} />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    elevation: 20,
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 8,
    justifyContent: 'flex-start',
    gap: 12,
  },
  screenBodyWithHostRules: {
    paddingTop: 58,
    gap: 8,
  },
  lobbyActionStack: {
    gap: 10,
  },
  lobbyActionStackWithRules: {
    gap: 8,
  },
  hostLobbyFloatingActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 92,
    zIndex: 34,
    elevation: 34,
  },
  lobbyRulesBackdropLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.54)',
    zIndex: 30,
    elevation: 30,
  },
  lobbyRulesDock: {
    position: 'absolute',
    left: -8,
    right: -8,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
  },
  lobbyRulesPanelShell: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  lobbyRulesCollapsedPressTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  lobbyRulesPanelImage: {
    ...StyleSheet.absoluteFillObject,
  },
  lobbyRulesPanelImageAsset: {
    width: '100%',
    height: '100%',
  },
  lobbyRulesPanelHeader: {
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
  lobbyRulesPanelHeaderText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 34,
    lineHeight: 39,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(116, 7, 5, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    marginTop: 30,
  },
  lobbyRulesPanelContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  lobbyRulesScroll: {
    flex: 1,
    marginTop: 18,
    marginBottom: 52,
  },
  lobbyRulesScrollContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 36,
    paddingBottom: 28,
  },
  lobbyRulesScrollbarTrack: {
    position: 'absolute',
    top: 28,
    right: 34,
    bottom: 82,
    width: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(151, 80, 29, 0.12)',
    overflow: 'hidden',
  },
  lobbyRulesScrollbarThumb: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(151, 80, 29, 0.34)',
  },
  lobbyRulesOverview: {
    width: '100%',
    maxWidth: 382,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 22,
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 2,
  },
  lobbyRulesOverviewTarget: {
    width: '100%',
    alignItems: 'center',
  },
  lobbyRulesOverviewColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  lobbyRulesModeInfoButton: {
    right: '7.5%',
    bottom: '5%',
    width: 25,
    height: 25,
  },
  lobbyRulesOverviewTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 23,
    lineHeight: 27,
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  lobbyRulesTitleBlock: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(20, 71, 102, 0.34)',
    backgroundColor: 'rgba(238, 249, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#09283B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lobbyRulesTitleBlockGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  lobbyRulesTitleBlockText: {
    fontFamily: 'FredokaOne_400Regular',
    color: '#144766',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  lobbyRulesModePreview: {
    marginTop: 24,
    borderRadius: 22,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#32180a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 3,
  },
  lobbyRulesModePreviewTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 9,
    zIndex: 3,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 19,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(91, 42, 0, 0.52)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  lobbyRulesModePreviewArt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  lobbyRulesModePreviewImage: {
    position: 'absolute',
    bottom: 7,
    width: 72,
    height: 56,
  },
  lobbyRulesModePreviewImageLeft: {
    left: 13,
    transform: [{ rotate: '-7deg' }],
  },
  lobbyRulesModePreviewImageCenter: {
    left: 41,
    transform: [{ rotate: '-1deg' }],
    zIndex: 2,
  },
  lobbyRulesModePreviewImageRight: {
    right: 13,
    transform: [{ rotate: '7deg' }],
  },
  lobbyRulesThemePreviewShell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lobbyRulesThemePreview: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  lobbyRulesThemePreviewImage: {
    borderRadius: 5,
  },
  lobbyRulesThemePreviewTitleWrap: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F74F2',
    borderBottomWidth: 2,
    borderBottomColor: '#003EAD',
    paddingHorizontal: 6,
  },
  lobbyRulesThemePreviewTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 36, 102, 0.58)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  lobbyPickerLayer: {
    flex: 1,
    backgroundColor: 'rgba(4, 11, 20, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyThemePickerContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
  },
  lobbyThemePickerCarousel: {
    height: 332,
    width: '100%',
  },
  lobbyThemePickerCardMuted: {
    opacity: 0.58,
    transform: [{ scale: 0.96 }],
  },
  lobbyPickerSelectWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyThemeCardShell: {
    borderRadius: 26,
  },
  lobbyThemeCardOutline: {
    borderWidth: 4,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  lobbyThemeCardOutlineEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  lobbyThemeCardBody: {
    width: 214,
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
  },
  lobbyThemeCardBodyEmbedded: {
    borderRadius: 0,
    overflow: 'visible',
  },
  lobbyThemeCardImage: {
    borderRadius: 22,
  },
  lobbyThemeCardImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  lobbyThemeCardImageEmbedded: {
    borderRadius: 0,
  },
  lobbyThemeCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 38, 0.18)',
  },
  lobbyThemeCardLockedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    zIndex: 1,
  },
  lobbyThemeCardLockPressable: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  lobbyThemeCardLockOverlay: {
    width: '100%',
    height: '100%',
  },
  lobbyThemeCardTitleWrap: {
    position: 'absolute',
    top: 26,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  lobbyThemeCardTitleWrapEmbedded: {
    top: '1.5%',
    left: '6%',
    right: '6%',
    height: 46,
    justifyContent: 'center',
  },
  lobbyThemeCardTitleWrapEmbeddedPreview: {
    top: '-3%',
  },
  lobbyThemeCardTitleWrapEmbeddedPicker: {
    top: '2.4%',
  },
  lobbyThemeCardTitleWrapEmbeddedWide: {
    left: '-5%',
    right: '-5%',
  },
  lobbyThemeCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.38)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  lobbyThemeCardTitleNoWrap: {
    width: '100%',
    flexShrink: 1,
    includeFontPadding: false,
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
  klassiekGameModeCardSetupPreview: {
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
    zIndex: 8,
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
    left: '12%',
    right: '12%',
    bottom: '2%',
    height: '66%',
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
    width: '43%',
    height: '104%',
    bottom: -4,
  },
  klassiekBingoCardCenter: {
    width: '40%',
    height: '98%',
    left: '30%',
    bottom: -1,
    zIndex: 2,
    elevation: 2,
  },
  klassiekBingoCardCenterSetupPreview: {
    width: '48%',
    height: '119%',
    left: '26%',
    bottom: -8,
  },
  klassiekBingoCardLeft: {
    left: '8%',
    zIndex: 1,
    elevation: 1,
  },
  klassiekBingoCardLeftSetupPreview: {
    left: '9%',
  },
  klassiekBingoCardRight: {
    right: '8%',
    zIndex: 1,
    elevation: 1,
  },
  klassiekBingoCardRightSetupPreview: {
    right: '9%',
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
    left: 8,
    right: 8,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    lineHeight: 26,
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
  gameModePickerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
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
  gameModeChoiceGrid: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
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
  lobbySpelmodusPickerContent: {
    width: '92%',
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#0B3550',
    backgroundColor: 'rgba(238, 248, 255, 0.97)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 16,
    shadowColor: '#00172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  lobbySpelmodusPickerTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    lineHeight: 36,
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
  },
  lobbySpelmodusPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  settingsRuleSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  playerStage: {
    height: 244,
    position: 'relative',
    marginBottom: 4,
  },
  playerStageWithHostRules: {
    height: 214,
    marginBottom: 0,
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
  playerEditor: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  playerEditorCompact: {
    minWidth: 0,
    marginTop: 18,
    paddingBottom: 16,
  },
  nameInputWrap: {
    width: 172,
    borderRadius: 18,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 5,
    shadowOpacity: 0.24,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  nameInputWrapCompact: {
    minWidth: COMPACT_INPUT_BASE_WIDTH,
  },
  nameInput: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
    color: '#111111',
  },
  nameInputCompact: {
    fontSize: 18,
    paddingHorizontal: 10,
  },
  heroCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: -8,
  },
  heroCarButtonHidden: {
    opacity: 0,
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    bottom: 28,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonHidden: {
    opacity: 0,
  },
  addPlayerButton: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 96,
  },
  addPlayerButtonImage: {
    width: 62,
    height: 62,
  },
  grid: {
    position: 'relative',
    alignSelf: 'stretch',
    aspectRatio: 1224 / 876,
    overflow: 'hidden',
    marginHorizontal: -12,
    marginTop: 2,
  },
  gridBackgroundImage: {
    borderRadius: 24,
  },
  gridCell: {
    position: 'absolute',
  },
  gridPlayer: {
    flex: 1,
    position: 'relative',
  },
  gridPlayerAvatar: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -31 }],
  },
  gridPlayerOfflineBadge: {
    position: 'absolute',
    width: 34,
    height: 34,
    right: -8,
    top: -10,
  },
  gridPlayerAvatarLeft: {
    right: '4%',
  },
  gridPlayerAvatarRight: {
    left: '4%',
  },
  gridPlayerName: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    lineHeight: 24,
    color: '#EEDFCB',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(48, 37, 55, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridPlayerNameLeft: {
    left: '1%',
    width: '58%',
  },
  gridPlayerNameRight: {
    right: '1%',
    width: '58%',
  },
  gridPlayerNamePlaceholder: {
    opacity: 0.4,
  },
  gridPlayerRemoveButton: {
    position: 'absolute',
    top: '50%',
    marginTop: 10,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 4,
  },
  gridPlayerRemoveButtonLeft: {
    left: '1%',
  },
  gridPlayerRemoveButtonRight: {
    right: '1%',
  },
  gridPlayerRemovePressable: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.76)',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    gap: 20,
  },
  carouselWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardShell: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  carouselCard: {
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
  confirmTextTablet: {
    fontSize: 24,
    lineHeight: 32,
  },
  confirmTextStrong: {
    fontWeight: '900',
    color: '#143A52',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 14,
  },
  confirmGlossyButton: {
    flex: 1,
  },
  transitionCar: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  settingsPage: {
    flex: 1,
    backgroundColor: '#F4F1E8',
  },
  settingsPageBackground: {
    flex: 1,
  },
  settingsPageGrabberWrap: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 120,
    marginLeft: -60,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  settingsPageGrabber: {
    width: 54,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 58, 82, 0.42)',
  },
  settingsPageScroll: {
    flex: 1,
  },
  settingsPageContent: {
    paddingTop: 78,
    paddingBottom: 34,
    gap: 14,
  },
  settingsPageTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
  },
  settingsPageSectionTitle: {
    marginTop: 2,
    paddingHorizontal: 22,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#143A52',
    letterSpacing: 0,
  },
  settingsSectionLabel: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: '#143A52',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  settingsThemeCarouselWrap: {
    height: 190,
    marginHorizontal: -20,
  },
  settingsThemeCardShell: {
    width: 210,
    height: 168,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(20, 58, 82, 0.28)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  settingsThemeCardShellSelected: {
    borderColor: LOBBY_SETTINGS_BLUE,
  },
  settingsThemeCard: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  settingsThemeCardImage: {
    borderRadius: 14,
  },
  settingsThemeCardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  settingsThemeCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  settingsModeGrid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  settingsModeCard: {
    height: 118,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#0B3550',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#0B3550',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  settingsModeCardSelected: {
    borderColor: LOBBY_SETTINGS_BLUE,
    backgroundColor: 'rgba(226, 247, 255, 0.96)',
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
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    elevation: 120,
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
    zIndex: 124,
    elevation: 124,
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
    elevation: 125,
    zIndex: 125,
  },
  infoBubbleArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  infoBubbleArrowTop: {
    top: -13,
    borderBottomWidth: 14,
    borderBottomColor: '#F8FDFF',
  },
  infoBubbleArrowBottom: {
    bottom: -13,
    borderTopWidth: 14,
    borderTopColor: '#F8FDFF',
  },
  infoBubbleTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    lineHeight: 25,
    color: '#123F5C',
    letterSpacing: 0,
    marginBottom: 6,
  },
  infoBubbleBody: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#315D74',
    letterSpacing: 0,
  },
  settingsModeCardTitle: {
    position: 'absolute',
    left: 18,
    top: 13,
    zIndex: 2,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    color: '#143A52',
    letterSpacing: 0,
  },
  settingsModeCardArt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settingsModeCardImage: {
    position: 'absolute',
    right: 10,
    width: 132,
    height: 96,
  },
  settingsModeCardImageLeft: {
    right: 80,
    transform: [{ rotate: '-7deg' }],
  },
  settingsModeCardImageCenter: {
    right: 46,
    transform: [{ rotate: '-1deg' }],
  },
  settingsModeCardImageRight: {
    right: 12,
    transform: [{ rotate: '7deg' }],
  },
  settingsBottomPanel: {
    marginHorizontal: 14,
    marginTop: 6,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#0B3550',
    backgroundColor: 'rgba(244, 241, 232, 0.94)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
  },
  settingsBottomPanelTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
  },
  settingsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingsChip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#B8C6D0',
    backgroundColor: '#FFFDFC',
  },
  settingsChipSelected: {
    borderColor: '#0B3550',
    backgroundColor: '#1A7BD4',
  },
  settingsChipText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#143A52',
  },
  settingsChipTextSelected: {
    color: '#FFFFFF',
  },
});
