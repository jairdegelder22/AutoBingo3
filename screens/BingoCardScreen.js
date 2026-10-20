import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, StyleSheet, Text, View, Pressable,
  Image, ImageBackground, Platform, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import LottieView from 'lottie-react-native';
import * as Haptics from '../src/settings/haptics';
import CircularReveal from '../components/CircularReveal';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import { getRandomItems } from './themeIcons';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getPlayerThemes, withDefaultPlayerNames } from './gameFlowConfig';
import { getBoardState, setBoardCell, subscribeToBoardState } from '../src/services/liveLobbyService';
import { DESIGN_BASELINE_HEIGHT, DESIGN_BASELINE_WIDTH, getResponsiveMetrics } from '../src/utils/responsive';
import useOnlineConnectionStatus from '../src/hooks/useOnlineConnectionStatus';
import ConnectionWarningOverlay from '../src/components/ConnectionWarningOverlay';
import { useAppSettings } from '../src/settings/AppSettingsContext';
import { useTranslation } from '../src/i18n/useTranslation';
import { recordFinishedGameForSkinChallenges } from '../src/challenges/skinChallenges';
import { usePremium } from '../src/premium/PremiumContext';
import { useAccount } from '../src/account/AccountContext';
import { preloadImageAssets } from '../src/assets/preloadImages';
import {
  playPooledSoundEffect,
  playSoundEffect,
  preloadPooledSoundEffect,
  preloadSoundEffect,
  stopSoundEffect,
} from '../src/audio/soundEffects';
import { stopGameBackgroundMusicForBingo } from '../src/audio/backgroundMusic';

const STANDARD_GRID_SIZE = 4;
const RECENT_BINGO_ITEMS_STORAGE_KEY = 'autobingo-recent-bingo-item-ids-v1';
const RECENT_BINGO_ITEMS_LIMIT = 64;
const PROGRESS_SAVE_AFTER_SKIN_UNLOCK_PROMPT_STORAGE_KEY = '@AutoBingo:progressSaveAfterSkinUnlockPromptSeen:v1';
const CLAIM_GRID_SIZE = 4;

const CLAIM_TARGET_TILE_COUNT = 12;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function readCachedRecentBingoItemIds() {
  return Array.isArray(globalThis.__AUTOBINGO_RECENT_BINGO_ITEM_IDS)
    ? globalThis.__AUTOBINGO_RECENT_BINGO_ITEM_IDS
    : [];
}

async function loadRecentBingoItemIds() {
  try {
    const storedValue = await AsyncStorage.getItem(RECENT_BINGO_ITEMS_STORAGE_KEY);
    const parsed = JSON.parse(storedValue ?? '[]');
    if (Array.isArray(parsed)) {
      globalThis.__AUTOBINGO_RECENT_BINGO_ITEM_IDS = [...new Set([
        ...readCachedRecentBingoItemIds(),
        ...parsed,
      ])]
        .filter((itemId) => typeof itemId === 'string')
        .slice(0, RECENT_BINGO_ITEMS_LIMIT);
    }
  } catch (error) {
    console.warn('Kon recente bingo-items niet laden.', error);
  }
}

async function rememberRecentBingoItems(boardItems) {
  const currentRecentIds = readCachedRecentBingoItemIds();
  const nextIds = boardItems
    .flat()
    .map((item) => item?.id)
    .filter((itemId) => typeof itemId === 'string');
  const mergedIds = [...new Set([...nextIds, ...currentRecentIds])].slice(0, RECENT_BINGO_ITEMS_LIMIT);

  globalThis.__AUTOBINGO_RECENT_BINGO_ITEM_IDS = mergedIds;

  try {
    await AsyncStorage.setItem(RECENT_BINGO_ITEMS_STORAGE_KEY, JSON.stringify(mergedIds));
  } catch (error) {
    console.warn('Kon recente bingo-items niet opslaan.', error);
  }
}

const width = DESIGN_BASELINE_WIDTH;
const height = DESIGN_BASELINE_HEIGHT;
const { isTablet: IS_TABLET_GAME, tabletScale: GAME_TABLET_SCALE } = getResponsiveMetrics(width, height);
const GAME_BACK_BUTTON = require('../assets/images/navigation/back-button.png');
const GAME_BACK_BUTTON_PRESSED = require('../assets/images/navigation/back-button-pressed.png');
const CLAIM_PODIUM_ASSETS = {
  blauw: require('../assets/images/claim-results/podium-blauw.png'),
  geel: require('../assets/images/claim-results/podium-geel.png'),
  groen: require('../assets/images/claim-results/podium-groen.png'),
  lichtblauw: require('../assets/images/claim-results/podium-lichtblauw.png'),
  oranje: require('../assets/images/claim-results/podium-oranje.png'),
  paars: require('../assets/images/claim-results/podium-paars.png'),
  rood: require('../assets/images/claim-results/podium-red.png'),
  roze: require('../assets/images/claim-results/podium-roze.png'),
  wit: require('../assets/images/claim-results/podium-wit.png'),
  zwart: require('../assets/images/claim-results/podium-zwart.png'),
  regenboog: require('../assets/images/claim-results/podium-regenboog.png'),
  koe: require('../assets/images/claim-results/podium-koe.png'),
  kerst: require('../assets/images/claim-results/podium-kerst.png'),
  politie: require('../assets/images/claim-results/podium-politie.png'),
  ambulance: require('../assets/images/claim-results/podium-ambulance.png'),
  brandweer: require('../assets/images/claim-results/podium-brandweer.png'),
  brons: require('../assets/images/claim-results/podium-brons.png'),
  zilver: require('../assets/images/claim-results/podium-zilver.png'),
  goud: require('../assets/images/claim-results/podium-goud.png'),
  kat: require('../assets/images/claim-results/podium-kat.png'),
  hond: require('../assets/images/claim-results/podium-hond.png'),
  hartjes: require('../assets/images/claim-results/podium-hartjes.png'),
  taxi: require('../assets/images/claim-results/podium-taxi.png'),
  vlammen: require('../assets/images/claim-results/podium-vlammen.png'),
  premium_racer: require('../assets/images/claim-results/podium-premium-racer.png'),
  eend: require('../assets/images/claim-results/podium-eend.png'),
  sport_coupe: require('../assets/images/claim-results/podium-sport-coupe.png'),
  neon_nacht: require('../assets/images/claim-results/podium-neon-nacht.png'),
  maanrijder: require('../assets/images/claim-results/podium-maanrijder.png'),
  hot_rod: require('../assets/images/claim-results/podium-hot-rod.png'),
  monstertruck: require('../assets/images/claim-results/podium-monstertruck.png'),
  carbon_supercar: require('../assets/images/claim-results/podium-carbon-supercar.png'),
  ijsco_wagen: require('../assets/images/claim-results/podium-ijsco-wagen.png'),
  piraten_wagen: require('../assets/images/claim-results/podium-piraten-wagen.png'),
  safari_jeep: require('../assets/images/claim-results/podium-safari-jeep.png'),
  koninklijke_racer: require('../assets/images/claim-results/podium-koninklijke-racer.png'),
  klassieke_brandweer: require('../assets/images/claim-results/podium-klassieke-brandweer.png'),
  supercar_racer: require('../assets/images/claim-results/podium-supercar-racer.png'),
  locomotief: require('../assets/images/claim-results/podium-locomotief.png'),
  strand_buggy: require('../assets/images/claim-results/podium-strand-buggy.png'),
  sneeuwschuiver: require('../assets/images/claim-results/podium-sneeuwschuiver.png'),
  ridder: require('../assets/images/claim-results/podium-ridder.png'),
};
const BINGO_BOARD_IMAGES = {
  blauw: require('../assets/images/bingo-boards/board-blauw.png'),
  geel: require('../assets/images/bingo-boards/board-geel.png'),
  groen: require('../assets/images/bingo-boards/board-groen.png'),
  lichtblauw: require('../assets/images/bingo-boards/board-lichtblauw.png'),
  oranje: require('../assets/images/bingo-boards/board-oranje.png'),
  paars: require('../assets/images/bingo-boards/board-paars.png'),
  rood: require('../assets/images/bingo-boards/board-rood.png'),
  roze: require('../assets/images/bingo-boards/board-roze.png'),
  wit: require('../assets/images/bingo-boards/board-wit.png'),
  zwart: require('../assets/images/bingo-boards/board-zwart.png'),
  regenboog: require('../assets/images/bingo-boards/board-regenboog.png'),
  koe: require('../assets/images/bingo-boards/board-koe.png'),
  kerst: require('../assets/images/bingo-boards/board-kerst.png'),
  politie: require('../assets/images/bingo-boards/board-politie.png'),
  ambulance: require('../assets/images/bingo-boards/board-ambulance.png'),
  brandweer: require('../assets/images/bingo-boards/board-brandweer.png'),
  brons: require('../assets/images/bingo-boards/board-brons.png'),
  zilver: require('../assets/images/bingo-boards/board-zilver.png'),
  goud: require('../assets/images/bingo-boards/board-goud.png'),
  kat: require('../assets/images/bingo-boards/board-kat.png'),
  hond: require('../assets/images/bingo-boards/board-hond.png'),
  hartjes: require('../assets/images/bingo-boards/board-hartjes.png'),
  taxi: require('../assets/images/bingo-boards/board-taxi.png'),
  vlammen: require('../assets/images/bingo-boards/board-vlammen.png'),
  premium_racer: require('../assets/images/bingo-boards/board-premium-racer.png'),
  eend: require('../assets/images/bingo-boards/board-eend.png'),
  sport_coupe: require('../assets/images/bingo-boards/board-sport-coupe.png'),
  neon_nacht: require('../assets/images/bingo-boards/board-neon-nacht.png'),
  maanrijder: require('../assets/images/bingo-boards/board-maanrijder.png'),
  hot_rod: require('../assets/images/bingo-boards/board-hot-rod.png'),
  monstertruck: require('../assets/images/bingo-boards/board-monstertruck.png'),
  carbon_supercar: require('../assets/images/bingo-boards/board-carbon-supercar.png'),
  ijsco_wagen: require('../assets/images/bingo-boards/board-ijsco-wagen.png'),
  piraten_wagen: require('../assets/images/bingo-boards/board-piraten-wagen.png'),
  safari_jeep: require('../assets/images/bingo-boards/board-safari-jeep.png'),
  koninklijke_racer: require('../assets/images/bingo-boards/board-koninklijke-racer.png'),
  klassieke_brandweer: require('../assets/images/bingo-boards/board-klassieke-brandweer.png'),
  supercar_racer: require('../assets/images/bingo-boards/board-supercar-racer.png'),
  locomotief: require('../assets/images/bingo-boards/board-locomotief.png'),
  strand_buggy: require('../assets/images/bingo-boards/board-strand-buggy.png'),
  sneeuwschuiver: require('../assets/images/bingo-boards/board-sneeuwschuiver.png'),
  ridder: require('../assets/images/bingo-boards/board-ridder.png'),
  neutral: require('../assets/images/bingo-boards/board-neutral.png'),
};
const GAME_BACK_CONFIRM_REVEAL_COLOR = '#159B3B';
const OUTER_PADDING = 12;
const TOP_CONTROLS_HEIGHT = 12;
const TWO_PLAYER_MIDDLE_ROW_HEIGHT = 62;
const TWO_PLAYER_VERTICAL_RESERVE = TOP_CONTROLS_HEIGHT + OUTER_PADDING + 58;
const BINGO_LINE_DRAW_DURATION_MS = 1450;
const BINGO_CHEER_SOUND = 'bingoCheer';
const BINGO_ITEM_CHECK_SOUND = 'bingoItemCheck';
const BINGO_LINE_STEP_SOUNDS = [
  'bingoItemCheck',
  'bingoItemCheckPitch1',
  'bingoItemCheckPitch2',
  'bingoItemCheckPitch3',
  'bingoItemCheckPitch4',
  'bingoItemCheckPitch5',
  'bingoItemCheckPitch6',
  'bingoItemCheckPitch7',
];
const HOLD_DOWN_TICKING_SOUND = 'holdDownTicking';
const SKIN_UNLOCK_BELL_SOUND = 'skinUnlockBell';
const BINGO_ITEM_CHECK_SOUND_POOL_SIZE = 16;
const COLOR_BINGO_SPLASH_IMAGE_LIFT_Y = IS_TABLET_GAME ? -28 : -22;
const UNCHECK_HOLD_DURATION_MS = 3000;
const IS_ANDROID = Platform.OS === 'android';
const COLLECTIVE_COLOR_HOLD_RATIO = 0.34;
const COLLECTIVE_COLOR_SEGMENT_MS = 4300;
const COLLECTIVE_WIPE_SOFTNESS = 0.42;
const BINGO_BOARD_PLAY_AREA = {
  left: 0.091,
  top: 0.092,
  width: 0.82,
  height: 0.815,
  gap: 4,
  padding: IS_TABLET_GAME ? 7 : 5,
  gridScale: IS_TABLET_GAME ? 0.96 : 1,
  boardScale: 1.14,
};
const BINGO_BOARD_SCALE_BY_SKIN = {
  rood: 1.14,
  groen: 1.14,
  default: 1.09,
};
const BINGO_BOARD_DISPLAY_BOOST_BY_SKIN = {
  maanrijder: 1.05,
  ijsco_wagen: 1.05,
  koninklijke_racer: 1.05,
  klassieke_brandweer: 1.05,
  supercar_racer: 1.05,
  strand_buggy: 1.05,
  ridder: 1.05,
};

function getBingoBoardImageLayout(gridSize, compact = false, skin = 'default', viewport = {}) {
  const viewportWidth = viewport.width ?? width;
  const viewportHeight = viewport.height ?? height;
  const viewportIsTablet = viewport.isTablet ?? IS_TABLET_GAME;
  const availableWidth = viewportWidth - (compact ? OUTER_PADDING * 2 : 4);
  const availableHeight = compact
    ? (viewportHeight - TWO_PLAYER_VERTICAL_RESERVE - TWO_PLAYER_MIDDLE_ROW_HEIGHT) / 2
    : viewportHeight - TOP_CONTROLS_HEIGHT - 4;
  const boardPlayArea = BINGO_BOARD_PLAY_AREA;
  const displayBoost = BINGO_BOARD_DISPLAY_BOOST_BY_SKIN[skin] ?? 1;
  const maxVisibleBoardSize = Math.max(compact ? 218 : 240, Math.min(availableWidth, availableHeight));
  const boostedBoardSize = Math.floor(maxVisibleBoardSize * displayBoost);
  const displayBoardSize = Math.min(boostedBoardSize, Math.floor(Math.max(1, Math.min(availableWidth, availableHeight))));
  const playArea = {
    left: displayBoardSize * boardPlayArea.left,
    top: displayBoardSize * boardPlayArea.top,
    width: displayBoardSize * boardPlayArea.width,
    height: displayBoardSize * boardPlayArea.height,
  };
  const gap = boardPlayArea.gap ?? (compact ? 5 : 6);
  const padding = viewportIsTablet ? 7 : 5;
  const targetGridSize = Math.floor(
    Math.max(1, Math.min(playArea.width, playArea.height) * (viewportIsTablet ? 0.96 : 1))
  );
  const cellSize = Math.max(1, Math.floor((targetGridSize - padding * 2 - gap * (gridSize - 1)) / gridSize));
  const gridPixelSize = gridSize * cellSize + (gridSize - 1) * gap + padding * 2;

  return {
    boardSize: displayBoardSize,
    cellSize,
    gap,
    padding,
    gridPixelSize,
    gridLeft: playArea.left + (playArea.width - gridPixelSize) / 2,
    gridTop: playArea.top + (playArea.height - gridPixelSize) / 2 + (compact ? 3 : 4),
  };
}

function getClaimBingoBoardImageLayout(gridSize, viewport = {}) {
  const viewportWidth = viewport.width ?? width;
  const viewportHeight = viewport.height ?? height;
  const viewportIsTablet = viewport.isTablet ?? IS_TABLET_GAME;
  const availableWidth = viewportWidth - 4;
  const availableHeight = viewportHeight - TOP_CONTROLS_HEIGHT - OUTER_PADDING - (viewportIsTablet ? 360 : 300);
  const boardPlayArea = BINGO_BOARD_PLAY_AREA;
  const boardScale = BINGO_BOARD_SCALE_BY_SKIN.neutral ?? BINGO_BOARD_SCALE_BY_SKIN.default;
  const maxDisplayBoardSize = Math.max(260, Math.min(availableWidth, availableHeight));
  const boardSize = Math.floor(maxDisplayBoardSize / boardScale);
  const displayBoardSize = Math.floor(boardSize * boardScale);
  const playArea = {
    left: displayBoardSize * boardPlayArea.left,
    top: displayBoardSize * boardPlayArea.top,
    width: displayBoardSize * boardPlayArea.width,
    height: displayBoardSize * boardPlayArea.height,
  };
  const gap = boardPlayArea.gap ?? 5;
  const padding = viewportIsTablet ? 7 : 5;
  const targetGridSize = Math.floor(Math.min(playArea.width, playArea.height) * (viewportIsTablet ? 0.96 : 1));
  const cellSize = Math.floor((targetGridSize - padding * 2 - gap * (gridSize - 1)) / gridSize);
  const gridPixelSize = gridSize * cellSize + (gridSize - 1) * gap + padding * 2;

  return {
    boardSize: displayBoardSize,
    cellSize,
    gap,
    padding,
    gridPixelSize,
    gridLeft: playArea.left + (playArea.width - gridPixelSize) / 2,
    gridTop: playArea.top + (playArea.height - gridPixelSize) / 2 + 3,
  };
}

function darkenHex(hex, factor = 0.82) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;

  const channels = [0, 2, 4].map((index) =>
    Math.max(0, Math.min(255, Math.round(parseInt(value.slice(index, index + 2), 16) * factor)))
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(hex, targetHex = '#ffffff', amount = 0.7) {
  const normalize = (value) => {
    const clean = value.replace('#', '');
    return clean.length === 3
      ? clean.split('').map((char) => char + char).join('')
      : clean;
  };

  const source = normalize(hex);
  const target = normalize(targetHex);

  const channels = [0, 2, 4].map((index) => {
    const sourceValue = parseInt(source.slice(index, index + 2), 16);
    const targetValue = parseInt(target.slice(index, index + 2), 16);
    return Math.round(sourceValue + (targetValue - sourceValue) * amount);
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function withAlpha(hex, alpha = 0.18) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const alphaChannel = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${value}${alphaChannel}`;
}

function boostHexVibrance(hex, saturationBoost = 1.24) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  const average = channels.reduce((sum, channel) => sum + channel, 0) / channels.length;
  const boostedChannels = channels.map((channel) => (
    Math.max(0, Math.min(255, Math.round(average + (channel - average) * saturationBoost)))
  ));

  return `#${boostedChannels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getHexLuminance(hex) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function polishGradientColor(hex) {
  const luminance = getHexLuminance(hex);

  if (luminance < 0.16) {
    return mixHex(hex, '#ffffff', 0.18);
  }

  if (luminance > 0.78) {
    return mixHex(hex, '#f4d35e', 0.2);
  }

  return hex;
}

function energizeGradientColor(hex) {
  const luminance = getHexLuminance(hex);
  const lifted = luminance < 0.22
    ? mixHex(hex, '#ffffff', 0.16)
    : hex;
  const vibrant = boostHexVibrance(lifted, luminance > 0.72 ? 1.12 : 1.32);
  const warmGlow = luminance > 0.72
    ? '#fff6a8'
    : '#ffffff';

  return mixHex(vibrant, warmGlow, 0.035);
}

function getCollectiveGradientPalette(playerSkins = []) {
  const uniqueColors = [];

  playerSkins.forEach((skin) => {
    const color = PLAYER_HEX[skin];
    if (color && !uniqueColors.includes(color)) {
      uniqueColors.push(color);
    }
  });

  const colors = uniqueColors.length ? uniqueColors : [PLAYER_HEX.groen];
  const polishedColors = colors.map((color) => energizeGradientColor(polishGradientColor(color)));

  if (polishedColors.length === 1) {
    return polishedColors;
  }

  return polishedColors;
}

function getCollectiveWipeDirection(segmentIndex) {
  const directions = [
    { x1: 1, y1: 1, x2: 0, y2: 0 },
    { x1: 0, y1: 0, x2: 1, y2: 1 },
    { x1: 1, y1: 0, x2: 0, y2: 1 },
    { x1: 0, y1: 1, x2: 1, y2: 0 },
    { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
    { x1: 0.5, y1: 1, x2: 0.5, y2: 0 },
    { x1: 1, y1: 0.5, x2: 0, y2: 0.5 },
    { x1: 0, y1: 0.5, x2: 1, y2: 0.5 },
  ];

  return directions[segmentIndex % directions.length];
}

function easeCollectiveWipe(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function getCollectiveWipePhase(startedAt, colorCount) {
  const parsedStartTime = typeof startedAt === 'string' ? Date.parse(startedAt) : Number.NaN;
  const startTime = Number.isFinite(parsedStartTime) ? parsedStartTime : 0;
  const totalElapsed = Math.max(0, Date.now() - startTime);
  const cycleMs = Math.max(1, colorCount) * COLLECTIVE_COLOR_SEGMENT_MS;
  const elapsed = (totalElapsed % cycleMs + cycleMs) % cycleMs;
  const absoluteSegmentIndex = Math.floor(totalElapsed / COLLECTIVE_COLOR_SEGMENT_MS);
  const segmentIndex = Math.floor(elapsed / COLLECTIVE_COLOR_SEGMENT_MS);
  const segmentPhase = (elapsed % COLLECTIVE_COLOR_SEGMENT_MS) / COLLECTIVE_COLOR_SEGMENT_MS;

  return { absoluteSegmentIndex, segmentIndex, segmentPhase };
}

function getCollectiveWipeGradient(colors, startedAt) {
  const fallbackColors = colors.length ? colors : [PLAYER_HEX.groen];
  const colorCount = fallbackColors.length;
  const { absoluteSegmentIndex, segmentIndex, segmentPhase } = getCollectiveWipePhase(startedAt, colorCount);
  const currentIndex = segmentIndex % colorCount;
  const nextIndex = (currentIndex + 1) % colorCount;
  const currentColor = fallbackColors[currentIndex];
  const nextColor = fallbackColors[nextIndex];
  const blendColor = mixHex(currentColor, nextColor, 0.5);
  const direction = getCollectiveWipeDirection(absoluteSegmentIndex);
  const { x1, y1, x2, y2 } = direction;

  if (colorCount === 1 || segmentPhase < COLLECTIVE_COLOR_HOLD_RATIO) {
    return {
      colors: [currentColor, currentColor],
      glowColors: [
        withAlpha(mixHex(currentColor, '#fff8b4', 0.24), 0.24),
        withAlpha(mixHex(currentColor, '#fff8b4', 0.24), 0.24),
      ],
      locations: [0, 1],
      x1,
      y1,
      x2,
      y2,
    };
  }

  const wipePhase = easeCollectiveWipe(
    (segmentPhase - COLLECTIVE_COLOR_HOLD_RATIO) / (1 - COLLECTIVE_COLOR_HOLD_RATIO)
  );
  const front = wipePhase * (1 + COLLECTIVE_WIPE_SOFTNESS);
  const start = Math.max(0, Math.min(1, front - COLLECTIVE_WIPE_SOFTNESS));
  const middle = Math.max(0, Math.min(1, front - COLLECTIVE_WIPE_SOFTNESS * 0.48));
  const end = Math.max(0, Math.min(1, front));

  return {
    colors: [nextColor, nextColor, blendColor, currentColor, currentColor],
    glowColors: [nextColor, nextColor, blendColor, currentColor, currentColor]
      .map((color) => withAlpha(mixHex(color, '#fff8b4', 0.24), 0.24)),
    locations: [0, start, middle, end, 1],
    x1,
    y1,
    x2,
    y2,
  };
}

function getCollectiveBoardGradient(colors, boardGridSize, startedAt) {
  const wipeGradient = getCollectiveWipeGradient(colors, startedAt);
  const accentColor = colors[0] ?? PLAYER_HEX.groen;

  return {
    ...wipeGradient,
    borderColor: darkenHex(accentColor, 0.72),
    accentColor,
  };
}

function getCompletedLines(checked, rules, gridSize = STANDARD_GRID_SIZE) {
  if (gridSize !== STANDARD_GRID_SIZE) {
    return [];
  }

  const lines = [
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
    [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  ];

  if (rules.allowDiagonal) {
    lines.push([0, 5, 10, 15], [3, 6, 9, 12]);
  }

  return lines.filter((line) => line.every((index) => checked[index]));
}

function findBingo(checked, rules, gridSize = STANDARD_GRID_SIZE) {
  if (gridSize !== STANDARD_GRID_SIZE) {
    return null;
  }

  if (rules.winMode === 'full_card') {
    return checked.every(Boolean) ? 'full_card' : null;
  }

  const completedLines = getCompletedLines(checked, rules, gridSize);

  if (rules.winMode === 'two_lines') {
    if (completedLines.length >= 2) {
      return [completedLines[0][0], completedLines[0][3]];
    }
    return null;
  }

  if (completedLines.length >= 1) {
    return [completedLines[0][0], completedLines[0][3]];
  }

  return null;
}

function getLineKey(line, gridSize = STANDARD_GRID_SIZE) {
  return orderWinningLineForDraw(line, gridSize).join('-');
}

function getNewCompletedLines(previousChecked, nextChecked, rules, gridSize = STANDARD_GRID_SIZE, changedIndex = null) {
  const previousLineKeys = new Set(
    getCompletedLines(previousChecked, rules, gridSize).map((line) => getLineKey(line, gridSize))
  );
  const newLines = getCompletedLines(nextChecked, rules, gridSize)
    .filter((line) => !previousLineKeys.has(getLineKey(line, gridSize)));

  if (!newLines.length) {
    return [];
  }

  const changedLines = newLines.filter((line) => line.includes(changedIndex));
  return changedLines.length ? changedLines : newLines;
}

function getNearBingoCellIndexes(checked, rules, gridSize = STANDARD_GRID_SIZE) {
  if (gridSize !== STANDARD_GRID_SIZE || findBingo(checked, rules, gridSize)) {
    return new Set();
  }

  const cellIndexes = new Set();

  for (let cellIndex = 0; cellIndex < checked.length; cellIndex += 1) {
    if (checked[cellIndex]) {
      continue;
    }

    const nextChecked = [...checked];
    nextChecked[cellIndex] = true;

    if (!findBingo(nextChecked, rules, gridSize)) {
      continue;
    }

    cellIndexes.add(cellIndex);
  }

  return cellIndexes;
}

function getPrimaryWinningSequence(checked, rules, gridSize = STANDARD_GRID_SIZE) {
  if (gridSize !== STANDARD_GRID_SIZE) {
    return [];
  }

  if (rules.winMode === 'full_card') {
    return checked.every(Boolean) ? Array.from({ length: checked.length }, (_, index) => index) : [];
  }

  const completedLines = getCompletedLines(checked, rules, gridSize);
  return orderWinningLineForDraw(completedLines[0] ?? [], gridSize);
}

function orderWinningLineForDraw(line, gridSize = STANDARD_GRID_SIZE) {
  if (!Array.isArray(line) || line.length === 0) {
    return [];
  }

  const cells = line.map((index) => ({
    index,
    row: Math.floor(index / gridSize),
    col: index % gridSize,
  }));
  const sameRow = cells.every((cell) => cell.row === cells[0].row);
  const sameCol = cells.every((cell) => cell.col === cells[0].col);

  if (sameRow) {
    return [...cells].sort((left, right) => left.col - right.col).map((cell) => cell.index);
  }

  if (sameCol) {
    return [...cells].sort((left, right) => right.row - left.row).map((cell) => cell.index);
  }

  const isTopLeftToBottomRight = cells.every((cell) => cell.row - cell.col === cells[0].row - cells[0].col);
  if (isTopLeftToBottomRight) {
    return [...cells].sort((left, right) => left.row - right.row).map((cell) => cell.index);
  }

  return [...cells].sort((left, right) => left.row - right.row).map((cell) => cell.index);
}

function getBingoLineColors(playerColor) {
  return {
    core: mixHex(playerColor, '#ffffff', 0.78),
    edge: darkenHex(playerColor, 0.5),
    glow: mixHex(playerColor, '#fff6b8', 0.52),
  };
}

function buildClaimLeaderboard(players) {
  const sortedPlayers = [...players].sort((left, right) => {
    if (right.tileCount !== left.tileCount) {
      return right.tileCount - left.tileCount;
    }

    return left.originalIndex - right.originalIndex;
  });

  let previousScore = null;
  let currentRank = 0;

  return sortedPlayers.map((player, index) => {
    if (player.tileCount !== previousScore) {
      currentRank = index + 1;
      previousScore = player.tileCount;
    }

    return {
      ...player,
      rank: currentRank,
    };
  });
}

function SparkBurst({ progress, color, cellSize, visible }) {
  const sparkCount = IS_ANDROID ? 8 : 12;
  const radius = cellSize * 0.22;
  const sparkLength = Math.max(10, cellSize * 0.16);
  const center = cellSize / 2;

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: sparkCount }, (_, index) => {
        const angle = (360 / sparkCount) * index;
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(radius + sparkLength * 0.2)],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.12, 0.68, 1],
          outputRange: [0, 1, 0.92, 0],
        });
        const scaleY = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.3, 1.15, 0.12],
        });

        return (
          <Animated.View
            key={`spark-${index}`}
            style={[
              styles.spark,
              {
                left: center - 1,
                top: center - sparkLength,
                height: sparkLength,
                backgroundColor: color,
                opacity,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY },
                  { scaleY },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function CellFlash({ progress, color, cellSize, visible }) {
  if (!visible) {
    return null;
  }

  const inset = Math.max(4, cellSize * 0.08);
  const opacity = progress.interpolate({
    inputRange: [0, 0.14, 0.55, 1],
    outputRange: [0, 0.38, 0.16, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.82, 1.06, 1.18],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cellFlash,
        {
          top: inset,
          right: inset,
          bottom: inset,
          left: inset,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

function CheckedFillReveal({
  progress,
  color,
  gradient,
  cellSize,
  borderRadius,
  inset = 1.5,
  visible,
}) {
  if (!visible) {
    return null;
  }

  const fillSize = cellSize - inset * 2;
  const diameter = fillSize * 1.48;
  const circleOffset = (fillSize - diameter) / 2;
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 1],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.checkedFillClip,
        {
          top: inset,
          right: inset,
          bottom: inset,
          left: inset,
          borderRadius,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.checkedFillCircle,
          {
            left: circleOffset,
            top: circleOffset,
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: gradient ? '#ffffff' : color,
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

function createSeededRandom(seed = 1) {
  let state = seed >>> 0;

  return function seededRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function ClaimSparkBurst({ progress, color, visible, seed = 1, width = 216, height = 152 }) {
  const sparkCount = 11;
  const centerX = width / 2;
  const centerY = height * 0.5;
  const baseRadius = Math.max(24, width * 0.2);
  const random = createSeededRandom(seed);
  const sparkConfig = Array.from({ length: sparkCount }, (_, index) => ({
    angle: (360 / sparkCount) * index + (random() * 16 - 8),
    distance: baseRadius + random() * 12,
    length: 16 + random() * 12,
    width: 2.5 + random() * 1.7,
  }));

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.claimSparkLayer, { width, height }]}>
      {sparkConfig.map((spark, index) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -spark.distance],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.62, 1],
          outputRange: [0, 1, 0.9, 0],
        });
        const scaleY = progress.interpolate({
          inputRange: [0, 0.14, 1],
          outputRange: [0.35, 1.08, 0.18],
        });

        return (
          <Animated.View
            key={`claim-spark-${seed}-${index}`}
            style={[
              styles.claimSpark,
              {
                left: centerX - spark.width / 2,
                top: centerY - spark.length,
                width: spark.width,
                height: spark.length,
                backgroundColor: color,
                opacity,
                transform: [
                  { rotate: `${spark.angle}deg` },
                  { translateY },
                  { scaleY },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function BingoCell({
  checked,
  checkedColor,
  checkedGradient,
  checkedBorderColor,
  icon,
  nearBingoHighlight = false,
  nearBingoProgress = null,
  nearBingoGradient = null,
  onPress,
  onUndo,
  canUndo = true,
  cellSize,
  celebrationPulseKey,
  suppressCheckPulseKey,
  checkedFillInset = 1.5,
  tutorialTargetKey = null,
  onTutorialTargetLayout = null,
  onTutorialAction = null,
}) {
  const { settings } = useAppSettings();
  const cellRef = useRef(null);
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const nearBingoNudge = useRef(new Animated.Value(0)).current;
  const sparkProgress = useRef(new Animated.Value(0)).current;
  const fillRevealProgress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const nearBingoAppear = useRef(new Animated.Value(nearBingoHighlight && !checked ? 1 : 0)).current;
  const undoProgress = useRef(new Animated.Value(0)).current;
  const [nearBingoVisible, setNearBingoVisible] = useState(nearBingoHighlight && !checked);
  const [sparksVisible, setSparksVisible] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoCompleted, setUndoCompleted] = useState(false);
  const previousChecked = useRef(checked);
  const previousCelebrationPulseKey = useRef(null);
  const previousSuppressCheckPulseKey = useRef(null);
  const pulseAnimationRef = useRef(null);
  const undoAnimationRef = useRef(null);
  const undoShakeAnimationRef = useRef(null);
  const undoPulseIntervalRef = useRef(null);
  const nearBingoNudgeTimeoutRef = useRef(null);
  const nearBingoNudgeIntervalRef = useRef(null);
  const nearBingoAppearTokenRef = useRef(0);
  const suppressNextPressRef = useRef(false);

  useEffect(() => {
    if (!tutorialTargetKey || !onTutorialTargetLayout || !cellRef.current?.measureInWindow) {
      return;
    }

    requestAnimationFrame(() => {
      cellRef.current?.measureInWindow?.((x, y, width, height) => {
        onTutorialTargetLayout(tutorialTargetKey, { x, y, width, height });
      });
    });
  }, [cellSize, onTutorialTargetLayout, tutorialTargetKey]);

  useEffect(() => {
    nearBingoAppearTokenRef.current += 1;
    const appearToken = nearBingoAppearTokenRef.current;
    nearBingoAppear.stopAnimation();

    if (nearBingoHighlight && !checked) {
      setNearBingoVisible(true);
      nearBingoAppear.setValue(0);
      Animated.timing(nearBingoAppear, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(nearBingoAppear, {
      toValue: 0,
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && nearBingoAppearTokenRef.current === appearToken) {
        setNearBingoVisible(false);
      }
    });
  }, [checked, nearBingoAppear, nearBingoHighlight]);

  useEffect(() => {
    function clearNearBingoNudgeTimers() {
      if (nearBingoNudgeTimeoutRef.current) {
        clearTimeout(nearBingoNudgeTimeoutRef.current);
        nearBingoNudgeTimeoutRef.current = null;
      }

      if (nearBingoNudgeIntervalRef.current) {
        clearInterval(nearBingoNudgeIntervalRef.current);
        nearBingoNudgeIntervalRef.current = null;
      }
    }

    clearNearBingoNudgeTimers();
    nearBingoNudge.stopAnimation();
    nearBingoNudge.setValue(0);

    if (!nearBingoHighlight || checked) {
      return clearNearBingoNudgeTimers;
    }

    const runNudge = () => {
      nearBingoNudge.stopAnimation();
      nearBingoNudge.setValue(0);
      Animated.sequence([
        Animated.timing(nearBingoNudge, {
          toValue: -1,
          duration: 58,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nearBingoNudge, {
          toValue: 1,
          duration: 82,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nearBingoNudge, {
          toValue: -0.62,
          duration: 70,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nearBingoNudge, {
          toValue: 0.32,
          duration: 62,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nearBingoNudge, {
          toValue: 0,
          duration: 112,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    nearBingoNudgeTimeoutRef.current = setTimeout(runNudge, 1050);
    nearBingoNudgeIntervalRef.current = setInterval(runNudge, 5200);

    return clearNearBingoNudgeTimers;
  }, [checked, nearBingoHighlight, nearBingoNudge]);

  function runCelebrationPulse({
    scalePeak = 1.16,
    rotatePeak = 1,
    sparkDuration = 520,
    triggerHaptic = false,
    hapticType = 'success',
  } = {}) {
    pulseAnimationRef.current?.stop();
    setSparksVisible(true);
    scale.setValue(1);
    rotate.setValue(0);
    sparkProgress.setValue(0);

    const pulseAnimation = Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: scalePeak,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: rotatePeak,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -rotatePeak,
          duration: 110,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotatePeak * 0.65,
          duration: 95,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(sparkProgress, {
        toValue: 1,
        duration: sparkDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    pulseAnimationRef.current = pulseAnimation;
    pulseAnimation.start(() => {
      if (pulseAnimationRef.current !== pulseAnimation) {
        return;
      }

      scale.setValue(1);
      rotate.setValue(0);
      sparkProgress.setValue(1);
      setSparksVisible(false);
      pulseAnimationRef.current = null;
    });

    if (triggerHaptic) {
      if (hapticType === 'impact') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }

  useEffect(() => {
    if (!previousChecked.current && checked) {
      setUndoCompleted(false);
      const shouldSuppressCheckPulse = Boolean(suppressCheckPulseKey)
        && suppressCheckPulseKey !== previousSuppressCheckPulseKey.current;

      if (shouldSuppressCheckPulse) {
        previousSuppressCheckPulseKey.current = suppressCheckPulseKey;
      }

      fillRevealProgress.stopAnimation();
      fillRevealProgress.setValue(0);
      Animated.timing(fillRevealProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      if (!shouldSuppressCheckPulse) {
        runCelebrationPulse({ scalePeak: 1.12, triggerHaptic: false });
      }
    } else if (!checked) {
      setUndoCompleted(false);
      setUndoVisible(false);
      fillRevealProgress.stopAnimation();
      fillRevealProgress.setValue(0);
      undoProgress.stopAnimation();
      undoProgress.setValue(0);
    }

    previousChecked.current = checked;
  }, [checked, fillRevealProgress, suppressCheckPulseKey]);

  useEffect(() => {
    if (!celebrationPulseKey || celebrationPulseKey === previousCelebrationPulseKey.current) {
      return;
    }

    previousCelebrationPulseKey.current = celebrationPulseKey;
    runCelebrationPulse({
      scalePeak: 1.18,
      rotatePeak: 1.08,
      sparkDuration: 460,
      triggerHaptic: true,
      hapticType: 'impact',
    });
  }, [celebrationPulseKey]);

  useEffect(() => () => {
    pulseAnimationRef.current?.stop();
    undoAnimationRef.current?.stop();
    undoShakeAnimationRef.current?.stop();
    if (undoPulseIntervalRef.current) {
      clearInterval(undoPulseIntervalRef.current);
      undoPulseIntervalRef.current = null;
    }
    if (nearBingoNudgeTimeoutRef.current) {
      clearTimeout(nearBingoNudgeTimeoutRef.current);
      nearBingoNudgeTimeoutRef.current = null;
    }
    if (nearBingoNudgeIntervalRef.current) {
      clearInterval(nearBingoNudgeIntervalRef.current);
      nearBingoNudgeIntervalRef.current = null;
    }
    void stopSoundEffect(HOLD_DOWN_TICKING_SOUND);
    scale.setValue(1);
    rotate.setValue(0);
    nearBingoNudge.stopAnimation();
    fillRevealProgress.stopAnimation();
    nearBingoAppear.stopAnimation();
    undoProgress.stopAnimation();
  }, [fillRevealProgress, nearBingoAppear, nearBingoNudge, rotate, scale, undoProgress]);

  const rotateDeg = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });
  const cellBorderRadius = Math.max(10, Math.round(cellSize * 0.18));
  const fillBorderRadius = Math.max(8, cellBorderRadius - 2);
  const checkedFillBorderRadius = checkedFillInset <= 0 ? cellBorderRadius : fillBorderRadius;
  const accentColor = checkedGradient?.accentColor ?? checkedColor;
  const resolvedCheckedBorderColor = checkedBorderColor ?? checkedGradient?.borderColor ?? darkenHex(checkedColor);
  const visibleBorderColor = checked
    ? resolvedCheckedBorderColor
    : withAlpha(darkenHex(checkedColor, 0.88), 0.34);
  const sparkColor = mixHex(accentColor, '#ffffff', 0.28);
  const flashColor = mixHex(accentColor, '#ffffff', 0.45);
  const nearBingoStrokeWidth = Math.max(4, Math.round(cellSize * 0.05));
  const nearBingoRectOffset = nearBingoStrokeWidth / 2;
  const nearBingoRectSize = cellSize - nearBingoRectOffset * 2;
  const nearBingoRadius = Math.max(8, cellBorderRadius - nearBingoStrokeWidth / 2);
  const nearBingoPerimeter = Math.max(
    1,
    4 * (nearBingoRectSize - 2 * nearBingoRadius) + 2 * Math.PI * nearBingoRadius
  );
  const nearBingoGradientId = 'near-bingo-border-gradient';
  const nearBingoColor = nearBingoGradient ? `url(#${nearBingoGradientId})` : accentColor;
  const nearBingoTrailLength = Math.max(38, Math.round(nearBingoPerimeter * 0.2));
  const nearBingoTrailGap = Math.max(1, nearBingoPerimeter - nearBingoTrailLength);
  const nearBingoAnimation = nearBingoProgress ?? fillRevealProgress;
  const nearBingoTrailOffset = nearBingoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -nearBingoPerimeter],
  });
  const nearBingoSecondTrailOffset = nearBingoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [nearBingoPerimeter * 0.52, -nearBingoPerimeter * 0.48],
  });
  const nearBingoAppearScale = nearBingoAppear.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [1, 1.035, 1],
  });
  const nearBingoNudgeRotate = nearBingoNudge.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3.6deg', '0deg', '3.6deg'],
  });
  const nearBingoNudgeScale = nearBingoNudge.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.012, 1, 1.012],
  });
  const undoCoverHeight = undoProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cellSize],
  });

  function stopUndoHold({ reset = true } = {}) {
    undoAnimationRef.current?.stop();
    undoAnimationRef.current = null;
    undoShakeAnimationRef.current?.stop();
    undoShakeAnimationRef.current = null;
    rotate.stopAnimation();
    scale.stopAnimation();
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    if (undoPulseIntervalRef.current) {
      clearInterval(undoPulseIntervalRef.current);
      undoPulseIntervalRef.current = null;
    }
    void stopSoundEffect(HOLD_DOWN_TICKING_SOUND);

    if (reset) {
      setUndoCompleted(false);
      undoProgress.stopAnimation();
      Animated.timing(undoProgress, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        setUndoVisible(false);
      });
    }
  }

  function startUndoHold() {
    if (!checked || !canUndo || undoAnimationRef.current) {
      return;
    }

    suppressNextPressRef.current = true;
    pulseAnimationRef.current?.stop();
    scale.stopAnimation();
    rotate.stopAnimation();
    scale.setValue(1);
    rotate.setValue(0);
    undoProgress.stopAnimation();
    undoProgress.setValue(0);
    setUndoCompleted(false);
    setUndoVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.spring(scale, {
      toValue: 1.055,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
    undoShakeAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -0.18,
          duration: 80,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0.18,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 80,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    undoShakeAnimationRef.current.start();

    undoPulseIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 650);

    const undoAnimation = Animated.timing(undoProgress, {
      toValue: 1,
      duration: UNCHECK_HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    undoAnimationRef.current = undoAnimation;
    undoAnimation.start(({ finished }) => {
      if (undoAnimationRef.current !== undoAnimation) {
        return;
      }

      undoAnimationRef.current = null;
      undoShakeAnimationRef.current?.stop();
      undoShakeAnimationRef.current = null;
      if (undoPulseIntervalRef.current) {
        clearInterval(undoPulseIntervalRef.current);
        undoPulseIntervalRef.current = null;
      }
      void stopSoundEffect(HOLD_DOWN_TICKING_SOUND, { reset: false });

      if (!finished) {
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setUndoCompleted(true);
      undoProgress.setValue(1);
      fillRevealProgress.stopAnimation();
      fillRevealProgress.setValue(0);
      scale.setValue(1);
      rotate.setValue(0);
      suppressNextPressRef.current = true;
      onUndo?.();
      onTutorialAction?.('game.cellHeld');
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 85,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 170,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function runLockedTapFeedback() {
    Haptics.selectionAsync();
    pulseAnimationRef.current?.stop();
    rotate.stopAnimation();
    scale.stopAnimation();
    scale.setValue(1);
    rotate.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.035,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 170,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -0.36,
          duration: 55,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0.36,
          duration: 75,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function handlePress() {
    if (suppressNextPressRef.current) {
      suppressNextPressRef.current = false;
      return;
    }

    if (checked) {
      runLockedTapFeedback();
      return;
    }

    onTutorialAction?.('game.cellTapped');
    onPress();
  }

  function handleLongPress() {
    if (checked && canUndo) {
      suppressNextPressRef.current = true;
      startUndoHold();
    }
  }

  return (
    <Animated.View
      ref={cellRef}
      collapsable={false}
      style={[
        styles.cellMotionWrap,
        {
          transform: [
            { scale },
            { scale: nearBingoAppearScale },
            { scale: nearBingoNudgeScale },
            { rotate: rotateDeg },
            { rotate: nearBingoNudgeRotate },
          ],
        },
      ]}
    >
      <Pressable
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderRadius: cellBorderRadius,
          },
          checked
            ? {
                backgroundColor: checkedGradient ? 'transparent' : '#F3F0E8',
                borderColor: 'transparent',
              }
            : { backgroundColor: '#F3F0E8', borderColor: 'transparent' },
        ]}
        delayLongPress={320}
        onLongPress={checked && canUndo ? handleLongPress : undefined}
        onPress={handlePress}
        onPressOut={() => {
          if (undoAnimationRef.current) {
            stopUndoHold();
          }
        }}
      >
        <CheckedFillReveal
          progress={fillRevealProgress}
          color={checkedColor}
          gradient={null}
          cellSize={cellSize}
          borderRadius={checkedFillBorderRadius}
          inset={checkedFillInset}
          visible={checked && !checkedGradient && !undoCompleted}
        />
        <ActiveCollectiveCellGradient
          gradient={checkedGradient}
          cellSize={cellSize}
          borderRadius={cellBorderRadius}
          visible={Boolean(checked && checkedGradient && !undoCompleted)}
        />
        {undoVisible ? (
          <View
            pointerEvents="none"
            style={[
              styles.undoHoldClip,
              { borderRadius: cellBorderRadius },
            ]}
          >
            <Animated.View
              style={[
                styles.undoHoldCover,
                {
                  height: undoCoverHeight,
                },
              ]}
            />
          </View>
        ) : null}
        <View
          style={[
            styles.cellIconWrap,
            {
              width: cellSize * 0.82,
              height: cellSize * 0.82,
            },
          ]}
          pointerEvents="none"
          collapsable={false}
        >
          <Image
            source={icon}
            style={styles.cellIcon}
            resizeMode="contain"
            resizeMethod="resize"
            fadeDuration={0}
          />
        </View>
        <CellFlash
          progress={sparkProgress}
          color={flashColor}
          cellSize={cellSize}
          visible={sparksVisible}
        />
        {nearBingoVisible ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.nearBingoCellBorder,
              { opacity: nearBingoAppear },
            ]}
          >
            <Svg
              width={cellSize}
              height={cellSize}
              viewBox={`0 0 ${cellSize} ${cellSize}`}
              style={StyleSheet.absoluteFill}
            >
              {nearBingoGradient ? (
                <Defs>
                  <SvgLinearGradient
                    id={nearBingoGradientId}
                    x1={`${nearBingoGradient.x1 * 100}%`}
                    y1={`${nearBingoGradient.y1 * 100}%`}
                    x2={`${nearBingoGradient.x2 * 100}%`}
                    y2={`${nearBingoGradient.y2 * 100}%`}
                  >
                    {nearBingoGradient.colors.map((color, index) => (
                      <Stop
                        key={`near-bingo-stop-${index}`}
                        offset={`${(nearBingoGradient.locations?.[index] ?? index / Math.max(1, nearBingoGradient.colors.length - 1)) * 100}%`}
                        stopColor={color}
                      />
                    ))}
                  </SvgLinearGradient>
                </Defs>
              ) : null}
              <AnimatedRect
                x={nearBingoRectOffset}
                y={nearBingoRectOffset}
                width={nearBingoRectSize}
                height={nearBingoRectSize}
                rx={nearBingoRadius}
                ry={nearBingoRadius}
                fill="none"
                stroke={nearBingoColor}
                strokeWidth={nearBingoStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${nearBingoTrailLength} ${nearBingoTrailGap}`}
                strokeDashoffset={nearBingoTrailOffset}
                strokeOpacity={0.96}
              />
              <AnimatedRect
                x={nearBingoRectOffset}
                y={nearBingoRectOffset}
                width={nearBingoRectSize}
                height={nearBingoRectSize}
                rx={nearBingoRadius}
                ry={nearBingoRadius}
                fill="none"
                stroke={nearBingoColor}
                strokeWidth={nearBingoStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${nearBingoTrailLength} ${nearBingoTrailGap}`}
                strokeDashoffset={nearBingoSecondTrailOffset}
                strokeOpacity={0.96}
              />
            </Svg>
          </Animated.View>
        ) : null}
        <SparkBurst
          progress={sparkProgress}
          color={sparkColor}
          cellSize={cellSize}
          visible={sparksVisible}
        />
        <View
          pointerEvents="none"
          style={[
            styles.cellBorderOverlay,
            {
              top: -1,
              right: -1,
              bottom: -1,
              left: -1,
              borderRadius: cellBorderRadius + 1,
              borderColor: visibleBorderColor,
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

function CellInspectOverlay({ cell, progress, onClose }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!cell) {
    return null;
  }

  const startSize = cell.rect.width || cell.cellSize;
  const targetSize = Math.min(
    Math.max(cell.cellSize * 2.82, 197),
    screenWidth - 48,
    screenHeight - 170
  );
  const targetLeft = (screenWidth - targetSize) / 2;
  const targetTop = (screenHeight - targetSize) / 2;
  const borderRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(10, Math.round(cell.cellSize * 0.18)), 28],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.68],
  });
  const left = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cell.rect.x, targetLeft],
  });
  const top = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cell.rect.y, targetTop],
  });
  const size = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startSize, targetSize],
  });
  const shadowOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.28],
  });
  const imageSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startSize * 0.82, targetSize * 0.82],
  });
  const labelTop = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cell.rect.y + startSize + 10, targetTop + targetSize + 14],
  });
  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.36, 1],
    outputRange: [0, 0, 1],
  });
  const checkedBorderColor = cell.checkedBorderColor ?? cell.checkedGradient?.borderColor ?? darkenHex(cell.checkedColor);

  return (
    <View pointerEvents="box-none" style={styles.inspectLayer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.inspectBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.inspectCell,
          {
            left,
            top,
            width: size,
            height: size,
            borderRadius,
            shadowOpacity,
          },
          cell.checked
            ? {
                backgroundColor: cell.checkedGradient ? 'transparent' : cell.checkedColor,
                borderColor: 'transparent',
              }
            : { backgroundColor: '#FFFDF7', borderColor: 'transparent' },
        ]}
      >
        {cell.checked && cell.checkedGradient ? (
          <CollectiveInspectGradientFill
            gradient={cell.checkedGradient}
            borderRadius={borderRadius}
          />
        ) : null}
        <Animated.Image
          source={cell.icon}
          resizeMode="contain"
          style={{
            width: imageSize,
            height: imageSize,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.inspectBorderOverlay,
            {
              top: -1,
              right: -1,
              bottom: -1,
              left: -1,
              borderRadius,
              borderColor: checkedBorderColor,
            },
          ]}
        />
      </Animated.View>
      {cell.label ? (
        <Animated.Text
          pointerEvents="none"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={[
            styles.inspectCellLabel,
            {
              left: targetLeft + 12,
              top: labelTop,
              width: targetSize - 24,
              opacity: labelOpacity,
            },
          ]}
        >
          {cell.label}
        </Animated.Text>
      ) : null}
    </View>
  );
}

function CollectiveInspectGradientFill({ gradient, borderRadius }) {
  if (!gradient) {
    return null;
  }

  const gradientId = `inspect-collective-gradient-${gradient.board?.cellIndex ?? 'cell'}`;
  const glowGradientId = `inspect-collective-glow-${gradient.board?.cellIndex ?? 'cell'}`;
  const board = gradient.board ?? {};
  const boardSize = board.size || 1;
  const sourceCellSize = board.cellSize || 1;
  const cellLeft = board.cellLeft || 0;
  const cellTop = board.cellTop || 0;
  const gradientCoords = {
    x1: ((gradient.x1 * boardSize - cellLeft) / sourceCellSize) * 100,
    y1: ((gradient.y1 * boardSize - cellTop) / sourceCellSize) * 100,
    x2: ((gradient.x2 * boardSize - cellLeft) / sourceCellSize) * 100,
    y2: ((gradient.y2 * boardSize - cellTop) / sourceCellSize) * 100,
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.inspectGradientFill,
        {
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={gradientCoords.x1}
            y1={gradientCoords.y1}
            x2={gradientCoords.x2}
            y2={gradientCoords.y2}
          >
            {gradient.colors.map((stopColor, index) => (
              <Stop
                key={`inspect-collective-stop-${index}`}
                offset={gradient.locations[index]}
                stopColor={stopColor}
              />
            ))}
          </SvgLinearGradient>
          <SvgLinearGradient
            id={glowGradientId}
            gradientUnits="userSpaceOnUse"
            x1={gradientCoords.x1}
            y1={gradientCoords.y1}
            x2={gradientCoords.x2}
            y2={gradientCoords.y2}
          >
            {gradient.glowColors.map((stopColor, index) => (
              <Stop
                key={`inspect-collective-glow-stop-${index}`}
                offset={gradient.locations[index]}
                stopColor={stopColor}
              />
            ))}
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${gradientId})`} />
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${glowGradientId})`} />
      </Svg>
    </Animated.View>
  );
}

const YELLOW_BINGO_SPLASH = require('../assets/logo (bingo-geel).png');
const RED_BINGO_SPLASH = require('../assets/logo (bingo-rood).png');
const BLUE_BINGO_SPLASH = require('../assets/logo (bingo-blauw).png');
const GREEN_BINGO_SPLASH = require('../assets/logo (bingo-groen).png');
const LIGHT_BLUE_BINGO_SPLASH = require('../assets/logo (bingo-lichtblauw).png');
const ORANGE_BINGO_SPLASH = require('../assets/logo (bingo-oranje).png');
const PURPLE_BINGO_SPLASH = require('../assets/logo (bingo-paars).png');
const PINK_BINGO_SPLASH = require('../assets/logo (bingo-roze).png');
const WHITE_BINGO_SPLASH = require('../assets/logo (bingo-wit).png');
const BLACK_BINGO_SPLASH = require('../assets/logo (bingo-zwart).png');
const RAINBOW_BINGO_SPLASH = require('../assets/logo (bingo-regenboog).png');
const DOG_BINGO_SPLASH = require('../assets/logo (bingo-hond).png');
const TAXI_BINGO_SPLASH = require('../assets/logo (bingo-taxi).png');
const FLAMES_BINGO_SPLASH = require('../assets/logo (bingo-vlammen).png');
const COW_BINGO_SPLASH = require('../assets/logo (bingo-koe).png');
const CAT_BINGO_SPLASH = require('../assets/logo (bingo-kat).png');
const HEARTS_BINGO_SPLASH = require('../assets/logo (bingo-hartjes).png');
const CHRISTMAS_BINGO_SPLASH = require('../assets/logo (bingo-kerst).png');
const GOLD_BINGO_SPLASH = require('../assets/logo (bingo-goud).png');
const SILVER_BINGO_SPLASH = require('../assets/logo (bingo-zilver).png');
const BRONZE_BINGO_SPLASH = require('../assets/logo (bingo-brons).png');
const POLICE_BINGO_SPLASH = require('../assets/logo (bingo-politie).png');
const FIRETRUCK_BINGO_SPLASH = require('../assets/logo (bingo-brandweer).png');
const AMBULANCE_BINGO_SPLASH = require('../assets/logo (bingo-ambulance).png');
const PREMIUM_RACER_BINGO_SPLASH = require('../assets/logo (bingo-premium-racer).png');
const DUCK_BINGO_SPLASH = require('../assets/logo (bingo-eend).png');
const SPORT_COUPE_BINGO_SPLASH = require('../assets/logo (bingo-sport-coupe).png');
const NEON_NIGHT_BINGO_SPLASH = require('../assets/logo (bingo-neon-nacht).png');
const MOON_RIDER_BINGO_SPLASH = require('../assets/logo (bingo-maanrijder).png');
const HOT_ROD_BINGO_SPLASH = require('../assets/logo (bingo-hot-rod).png');
const MONSTERTRUCK_BINGO_SPLASH = require('../assets/logo (bingo-monstertruck).png');
const CARBON_SUPERCAR_BINGO_SPLASH = require('../assets/logo (bingo-carbon-supercar).png');
const ICE_CREAM_TRUCK_BINGO_SPLASH = require('../assets/logo (bingo-ijsco-wagen).png');
const PIRATE_CAR_BINGO_SPLASH = require('../assets/logo (bingo-piraten-wagen).png');
const SAFARI_JEEP_BINGO_SPLASH = require('../assets/logo (bingo-safari-jeep).png');
const ROYAL_RACER_BINGO_SPLASH = require('../assets/logo (bingo-koninklijke-racer).png');
const CLASSIC_FIRETRUCK_BINGO_SPLASH = require('../assets/logo (bingo-klassieke-brandweer).png');
const SUPERCAR_RACER_BINGO_SPLASH = require('../assets/logo (bingo-supercar-racer).png');
const LOCOMOTIVE_BINGO_SPLASH = require('../assets/logo (bingo-locomotief).png');
const BEACH_BUGGY_BINGO_SPLASH = require('../assets/logo (bingo-strand-buggy).png');
const SNOWPLOW_BINGO_SPLASH = require('../assets/logo (bingo-sneeuwschuiver).png');
const KNIGHT_BINGO_SPLASH = require('../assets/logo (bingo-ridder).png');
const BINGO_LIGHT_LOTTIE = require('../assets/animations/bingo-light.json');
const CHALLENGE_SKIN_LOCK_IMAGE = require('../assets/images/players/challenge-skin-lock.png');
const CHALLENGE_SKIN_UNLOCK_IMAGE = require('../assets/images/players/challenge-skin-lock-swing-open.png');
const CHALLENGE_UNLOCK_STAR_BLUE = require('../assets/images/players/challenge-unlock-star-blue.png');
const WINNER_SKIN_UNLOCK_DELAY_MS = 1120;
const PROGRESS_SAVE_PANEL_IMAGE = require('../assets/images/ui/popups/progress-save-panel-v2.png');
const PROGRESS_SAVE_PANEL_ASPECT_RATIO = 843 / 1115;
const BINGO_SPLASH_BY_SKIN = {
  geel: YELLOW_BINGO_SPLASH,
  rood: RED_BINGO_SPLASH,
  blauw: BLUE_BINGO_SPLASH,
  groen: GREEN_BINGO_SPLASH,
  lichtblauw: LIGHT_BLUE_BINGO_SPLASH,
  oranje: ORANGE_BINGO_SPLASH,
  paars: PURPLE_BINGO_SPLASH,
  roze: PINK_BINGO_SPLASH,
  wit: WHITE_BINGO_SPLASH,
  zwart: BLACK_BINGO_SPLASH,
  regenboog: RAINBOW_BINGO_SPLASH,
  hond: DOG_BINGO_SPLASH,
  taxi: TAXI_BINGO_SPLASH,
  vlammen: FLAMES_BINGO_SPLASH,
  koe: COW_BINGO_SPLASH,
  kat: CAT_BINGO_SPLASH,
  hartjes: HEARTS_BINGO_SPLASH,
  kerst: CHRISTMAS_BINGO_SPLASH,
  goud: GOLD_BINGO_SPLASH,
  zilver: SILVER_BINGO_SPLASH,
  brons: BRONZE_BINGO_SPLASH,
  politie: POLICE_BINGO_SPLASH,
  brandweer: FIRETRUCK_BINGO_SPLASH,
  ambulance: AMBULANCE_BINGO_SPLASH,
  premium_racer: PREMIUM_RACER_BINGO_SPLASH,
  eend: DUCK_BINGO_SPLASH,
  sport_coupe: SPORT_COUPE_BINGO_SPLASH,
  neon_nacht: NEON_NIGHT_BINGO_SPLASH,
  maanrijder: MOON_RIDER_BINGO_SPLASH,
  hot_rod: HOT_ROD_BINGO_SPLASH,
  monstertruck: MONSTERTRUCK_BINGO_SPLASH,
  carbon_supercar: CARBON_SUPERCAR_BINGO_SPLASH,
  ijsco_wagen: ICE_CREAM_TRUCK_BINGO_SPLASH,
  piraten_wagen: PIRATE_CAR_BINGO_SPLASH,
  safari_jeep: SAFARI_JEEP_BINGO_SPLASH,
  koninklijke_racer: ROYAL_RACER_BINGO_SPLASH,
  klassieke_brandweer: CLASSIC_FIRETRUCK_BINGO_SPLASH,
  supercar_racer: SUPERCAR_RACER_BINGO_SPLASH,
  locomotief: LOCOMOTIVE_BINGO_SPLASH,
  strand_buggy: BEACH_BUGGY_BINGO_SPLASH,
  sneeuwschuiver: SNOWPLOW_BINGO_SPLASH,
  ridder: KNIGHT_BINGO_SPLASH,
};
const NEW_BINGO_SPLASH_SKINS = new Set([
  'premium_racer',
  'eend',
  'sport_coupe',
  'neon_nacht',
  'maanrijder',
  'hot_rod',
  'monstertruck',
  'carbon_supercar',
  'ijsco_wagen',
  'piraten_wagen',
  'safari_jeep',
  'koninklijke_racer',
  'klassieke_brandweer',
  'supercar_racer',
  'locomotief',
  'strand_buggy',
  'sneeuwschuiver',
  'ridder',
]);
const COLOR_BINGO_SPLASH_LAYOUT = { imageOffsetY: COLOR_BINGO_SPLASH_IMAGE_LIFT_Y };
const CENTERED_BINGO_SPLASH_LAYOUT = {
  widthMultiplier: 3.96,
  compactWidthMultiplier: 3.08,
  marginBottom: IS_TABLET_GAME ? -124 : -96,
  imageOffsetY: 0,
};
const SMALL_BINGO_SPLASH_LAYOUT = {
  ...CENTERED_BINGO_SPLASH_LAYOUT,
  widthMultiplier: 1.86,
  compactWidthMultiplier: 1.44,
};
const EXTRA_SMALL_BINGO_SPLASH_LAYOUT = {
  ...CENTERED_BINGO_SPLASH_LAYOUT,
  widthMultiplier: 1.18,
  compactWidthMultiplier: 0.92,
};
const MEDIUM_SMALL_BINGO_SPLASH_LAYOUT = {
  ...CENTERED_BINGO_SPLASH_LAYOUT,
  widthMultiplier: 2.02,
  compactWidthMultiplier: 1.56,
};
const BINGO_SPLASH_LAYOUT_BY_SKIN = {
  geel: COLOR_BINGO_SPLASH_LAYOUT,
  rood: COLOR_BINGO_SPLASH_LAYOUT,
  blauw: COLOR_BINGO_SPLASH_LAYOUT,
  groen: COLOR_BINGO_SPLASH_LAYOUT,
  lichtblauw: COLOR_BINGO_SPLASH_LAYOUT,
  oranje: COLOR_BINGO_SPLASH_LAYOUT,
  paars: COLOR_BINGO_SPLASH_LAYOUT,
  roze: COLOR_BINGO_SPLASH_LAYOUT,
  wit: COLOR_BINGO_SPLASH_LAYOUT,
  zwart: COLOR_BINGO_SPLASH_LAYOUT,
  kerst: COLOR_BINGO_SPLASH_LAYOUT,
  zilver: COLOR_BINGO_SPLASH_LAYOUT,
  brons: COLOR_BINGO_SPLASH_LAYOUT,
  regenboog: CENTERED_BINGO_SPLASH_LAYOUT,
  hond: CENTERED_BINGO_SPLASH_LAYOUT,
  taxi: CENTERED_BINGO_SPLASH_LAYOUT,
  vlammen: CENTERED_BINGO_SPLASH_LAYOUT,
  koe: CENTERED_BINGO_SPLASH_LAYOUT,
  kat: CENTERED_BINGO_SPLASH_LAYOUT,
  hartjes: CENTERED_BINGO_SPLASH_LAYOUT,
  goud: CENTERED_BINGO_SPLASH_LAYOUT,
  politie: CENTERED_BINGO_SPLASH_LAYOUT,
  brandweer: CENTERED_BINGO_SPLASH_LAYOUT,
  ambulance: CENTERED_BINGO_SPLASH_LAYOUT,
  premium_racer: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  eend: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  sport_coupe: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  neon_nacht: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  maanrijder: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  hot_rod: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  monstertruck: CENTERED_BINGO_SPLASH_LAYOUT,
  carbon_supercar: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  ijsco_wagen: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  piraten_wagen: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  safari_jeep: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  koninklijke_racer: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  klassieke_brandweer: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  supercar_racer: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  locomotief: CENTERED_BINGO_SPLASH_LAYOUT,
  strand_buggy: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  sneeuwschuiver: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
  ridder: EXTRA_SMALL_BINGO_SPLASH_LAYOUT,
};

function BingoSplash({ color, fontFamily, skin, visibleKey, width, compact = false, screenOverlay = false }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [logoReady, setLogoReady] = useState(false);
  const logoSplash = BINGO_SPLASH_BY_SKIN[skin] ?? null;
  const splashLayout = BINGO_SPLASH_LAYOUT_BY_SKIN[skin] ?? null;

  useEffect(() => {
    entrance.setValue(0);
    pulse.setValue(1);
    setLogoReady(!logoSplash);
  }, [entrance, logoSplash, pulse, visibleKey]);

  useEffect(() => {
    if (logoSplash && !logoReady) {
      return undefined;
    }

    let pulseAnimation = null;
    entrance.setValue(0);
    pulse.setValue(1);
    Animated.spring(entrance, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.045,
            duration: 1450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    });

    return () => {
      pulseAnimation?.stop();
    };
  }, [entrance, logoReady, logoSplash, pulse, visibleKey]);

  const opacity = entrance.interpolate({
    inputRange: [0, 0.08, 1],
    outputRange: [0, 1, 1],
  });
  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 1],
  });
  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  if (logoSplash) {
    const logoWidthMultiplier = screenOverlay
      ? splashLayout?.widthMultiplier ?? 3.96
      : compact
        ? splashLayout?.compactWidthMultiplier ?? 3.36
        : splashLayout?.widthMultiplier ?? 3.96;
    const logoImageOffsetY = splashLayout?.imageOffsetY ?? 0;
    const useRaisedLogoLight = NEW_BINGO_SPLASH_SKINS.has(skin);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          screenOverlay
            ? styles.bingoLogoBannerScreen
            : compact
              ? styles.bingoLogoBannerCompact
              : styles.bingoLogoBanner,
          {
            width: width * logoWidthMultiplier,
            marginBottom: screenOverlay || compact ? 0 : splashLayout?.marginBottom ?? styles.bingoLogoBanner.marginBottom,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {logoReady ? (
          <LottieView
            key={`bingo-light:${visibleKey}`}
            source={BINGO_LIGHT_LOTTIE}
            autoPlay
            loop={false}
            resizeMode="contain"
            style={[
              styles.bingoLogoLight,
              compact && styles.bingoLogoLightCompact,
              useRaisedLogoLight && styles.bingoLogoLightRaised,
              useRaisedLogoLight && compact && styles.bingoLogoLightRaisedCompact,
            ]}
          />
        ) : null}
        <Animated.View style={[styles.bingoLogoPulseWrap, { transform: [{ translateY: logoImageOffsetY }, { scale: pulse }] }]}>
          <Image
            source={logoSplash}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setLogoReady(true)}
            onError={() => setLogoReady(true)}
            style={styles.bingoLogoImage}
          />
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bingoSplashOverlay,
        compact && styles.bingoSplashOverlayCompact,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <OutlinedBingoText
        color={color}
        fontFamily={fontFamily}
        width={width}
        compact={compact}
      />
    </Animated.View>
  );
}

function OutlinedBingoText({ color, fontFamily, width, compact = false }) {
  const outlineOffsets = [
    [-2, -2],
    [0, -2],
    [2, -2],
    [-2, 0],
    [2, 0],
    [-2, 2],
    [0, 2],
    [2, 2],
  ];

  return (
    <View
      style={[
        styles.bingoBanner,
        compact && styles.bingoBannerCompact,
        { width },
      ]}
      pointerEvents="none"
    >
      {outlineOffsets.map(([left, top]) => (
        <Text
          key={`${left}:${top}`}
          style={[
            styles.bingoBannerText,
            compact && styles.bingoBannerTextCompact,
            {
              color: '#111111',
              fontFamily,
              transform: [{ translateX: left }, { translateY: top }],
            },
          ]}
        >
          BINGO!
        </Text>
      ))}
      <Text
        style={[
          styles.bingoBannerText,
          compact && styles.bingoBannerTextCompact,
          {
            color,
            fontFamily,
            transform: [{ translateX: 0 }, { translateY: 0 }],
            textShadowColor: 'rgba(255, 255, 255, 0.32)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1,
          },
        ]}
      >
        BINGO!
      </Text>
    </View>
  );
}

function WinnerActionOverlay({
  skin,
  playerIndex,
  fontFamily,
  canReplay,
  mirrorCar = false,
  settingsLabel = 'Instellingen',
  disabledActions = {},
  onReplay,
  onSettings,
  onMenu,
}) {
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const winnerMetrics = getResponsiveMetrics(screenWidth, screenHeight);
  const latestPressPointRef = useRef({ x: screenWidth / 2, y: screenHeight / 2 });
  const carProgress = useRef(new Animated.Value(0)).current;
  const playButtonProgress = useRef(new Animated.Value(0)).current;
  const settingsButtonProgress = useRef(new Animated.Value(0)).current;
  const homeButtonProgress = useRef(new Animated.Value(0)).current;
  const waitTextProgress = useRef(new Animated.Value(0)).current;

  const rememberPressPoint = (event) => {
    latestPressPointRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
  };

  useEffect(() => {
    carProgress.setValue(0);
    playButtonProgress.setValue(0);
    settingsButtonProgress.setValue(0);
    homeButtonProgress.setValue(0);
    waitTextProgress.setValue(0);

    const carTimer = setTimeout(() => {
      Animated.timing(carProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished: carFinished }) => {
        if (!carFinished) {
          return;
        }

        Animated.stagger(115, [
          Animated.timing(playButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(settingsButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(homeButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(waitTextProgress, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 240);

    return () => {
      clearTimeout(carTimer);
    };
  }, [carProgress, homeButtonProgress, playButtonProgress, settingsButtonProgress, skin, waitTextProgress]);

  const carTranslateY = carProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });
  const carScale = carProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const waitTextTranslateY = waitTextProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });
  return (
    <View
      style={[
        styles.winnerOverlay,
        {
          top: Math.max(
            winnerMetrics.s(winnerMetrics.isTablet ? 270 : 230),
            screenHeight * (winnerMetrics.isTablet ? 0.34 : 0.31)
          ),
        },
      ]}
    >
      <Animated.View
        style={[
          styles.winnerHero,
          {
            minHeight: winnerMetrics.s(winnerMetrics.isTablet ? 268 : 220),
            marginTop: winnerMetrics.sy(winnerMetrics.isTablet ? -2 : -8),
          },
          {
            opacity: carProgress,
            transform: [
              { translateY: carTranslateY },
              { scale: carScale },
            ],
          },
        ]}
      >
        <Image
          source={PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.groen}
          style={[
            styles.winnerHeroCar,
            {
              width: Math.min(screenWidth * (winnerMetrics.isTablet ? 0.74 : 0.9), winnerMetrics.isTablet ? 560 : 430),
              height: Math.min(screenWidth * (winnerMetrics.isTablet ? 0.48 : 0.56), winnerMetrics.isTablet ? 360 : 270),
            },
            mirrorCar && styles.winnerCarImageMirrored,
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>

      <View style={styles.winnerDetails}>
        <View style={styles.winnerButtonStack}>
          <WinnerMenuButton
            progress={playButtonProgress}
            disabled={!canReplay}
            interactionDisabled={disabledActions.replay}
            variant="green"
            onPress={onReplay}
            fontFamily={fontFamily}
            label={t('home.play')}
            metrics={winnerMetrics}
          />
          <WinnerMenuButton
            progress={settingsButtonProgress}
            interactionDisabled={disabledActions.settings}
            variant="blue"
            onPress={onSettings}
            onPressIn={rememberPressPoint}
            fontFamily={fontFamily}
            label={settingsLabel}
            getPressOrigin={() => latestPressPointRef.current}
            metrics={winnerMetrics}
          />
          <WinnerMenuButton
            progress={homeButtonProgress}
            interactionDisabled={disabledActions.menu}
            variant="yellow"
            onPress={onMenu}
            onPressIn={rememberPressPoint}
            fontFamily={fontFamily}
            label="Hoofdmenu"
            getPressOrigin={() => latestPressPointRef.current}
            metrics={winnerMetrics}
          />
        </View>

        {!canReplay ? (
          <Animated.Text
            style={[
              styles.waitForHostText,
              {
                opacity: waitTextProgress,
                transform: [{ translateY: waitTextTranslateY }],
              },
            ]}
          >
            Wacht tot de host opnieuw start.
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

function WinnerMenuButton({
  progress,
  variant,
  onPress,
  onPressIn,
  label,
  disabled = false,
  interactionDisabled = false,
  getPressOrigin,
  metrics,
}) {
  const fallbackDimensions = useWindowDimensions();
  const buttonMetrics = metrics ?? getResponsiveMetrics(fallbackDimensions.width, fallbackDimensions.height);
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [buttonMetrics.sy(-18), 0],
  });

  return (
    <Animated.View
      pointerEvents={interactionDisabled ? 'none' : 'auto'}
      style={[
        styles.winnerMenuButtonWrap,
        {
          width: Math.min(
            buttonMetrics.shortestSide * (buttonMetrics.isTablet ? 0.52 : 0.62),
            buttonMetrics.isTablet ? 360 : 282
          ),
        },
        {
          opacity: progress,
          transform: [{ translateY }],
        },
      ]}
    >
      <GlossyButton
        label={label}
        variant={variant}
        size="large"
        disabled={disabled}
        onPress={() => onPress?.(getPressOrigin?.())}
        onPressIn={onPressIn}
        heightOverride={buttonMetrics.s(84, 76, buttonMetrics.isTablet ? 108 : 96)}
        horizontalPadding={buttonMetrics.s(label.length > 8 ? 18 : 30, 16, buttonMetrics.isTablet ? 44 : 34)}
        labelFontScale={buttonMetrics.isTablet ? 1.12 : 1}
        labelOffsetY={0}
        contentOffsetY={0}
        hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
      />
    </Animated.View>
  );
}

function WinnerFocusBackdrop() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.winnerFocusBackdrop, { opacity }]}
    />
  );
}

const UNLOCK_STAR_POINTS = [
  { left: '18%', top: '12%', size: 34, x: -26, y: -22 },
  { left: '72%', top: '11%', size: 28, x: 24, y: -24 },
  { left: '12%', top: '43%', size: 25, x: -30, y: 0 },
  { left: '78%', top: '42%', size: 38, x: 30, y: 6 },
  { left: '25%', top: '70%', size: 26, x: -18, y: 24 },
  { left: '66%', top: '71%', size: 31, x: 20, y: 26 },
];

function SkinUnlockAnnouncement({ unlock, fontFamily, settings, onDismiss }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const unlockMetrics = getResponsiveMetrics(screenWidth, screenHeight);
  const unlockStageWidth = Math.min(
    screenWidth * (unlockMetrics.isTablet ? 0.86 : 1.08),
    unlockMetrics.isTablet ? 680 : 470
  );
  const unlockLockSize = unlockMetrics.s(120, 104, unlockMetrics.isTablet ? 152 : 132);
  const entrance = useRef(new Animated.Value(0)).current;
  const progressFill = useRef(new Animated.Value(0)).current;
  const lockJump = useRef(new Animated.Value(0)).current;
  const closedLockOpacity = useRef(new Animated.Value(1)).current;
  const openLockOpacity = useRef(new Animated.Value(0)).current;
  const openLockPulse = useRef(new Animated.Value(0)).current;
  const carReveal = useRef(new Animated.Value(0)).current;
  const starBurst = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  const [progressTextCurrent, setProgressTextCurrent] = useState(unlock?.previous?.current ?? 0);
  const previousValue = unlock?.previous?.current ?? 0;
  const currentValue = unlock?.current?.current ?? previousValue;
  const targetValue = unlock?.current?.target ?? 1;
  const previousRatio = targetValue > 0 ? Math.max(0, Math.min(1, previousValue / targetValue)) : 1;
  const currentRatio = targetValue > 0 ? Math.max(0, Math.min(1, currentValue / targetValue)) : 1;
  const revealScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });
  const revealTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const lockTranslateY = lockJump.interpolate({
    inputRange: [0, 1],
    outputRange: [0, unlockMetrics.sy(unlockMetrics.isTablet ? -14 : -12)],
  });
  const lockScale = lockJump.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });
  const lockedCarOpacity = carReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.46, 1],
  });
  const lockedCarScale = carReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const openLockPulseScale = openLockPulse.interpolate({
    inputRange: [0, 0.38, 1],
    outputRange: [1, 1.46, 1],
  });

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    let lockAnimation = null;
    const timers = [];

    entrance.setValue(0);
    progressFill.setValue(0);
    lockJump.setValue(0);
    closedLockOpacity.setValue(1);
    openLockOpacity.setValue(0);
    openLockPulse.setValue(0);
    carReveal.setValue(0);
    starBurst.setValue(0);
    setProgressTextCurrent(previousValue);

    Animated.spring(entrance, {
      toValue: 1,
      friction: 6,
      tension: 105,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressFill, {
      toValue: 1,
      duration: 1120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    timers.push(setTimeout(() => {
      setProgressTextCurrent(currentValue);
    }, 960));

    timers.push(setTimeout(() => {
      timers.push(setTimeout(() => {
        void playSoundEffect(SKIN_UNLOCK_BELL_SOUND, settings, {
          volumeMultiplier: 0.58,
          forceAudioMode: true,
        });
      }, 1120));

      lockAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(lockJump, {
            toValue: 1,
            duration: 130,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(lockJump, {
            toValue: 0,
            duration: 190,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(120),
        ]),
        { iterations: 3 }
      );
      lockAnimation.start(() => {
        lockJump.setValue(0);
        openLockPulse.setValue(0);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Animated.parallel([
          Animated.timing(closedLockOpacity, {
            toValue: 0,
            duration: 1,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(openLockOpacity, {
              toValue: 1,
              duration: 1,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(openLockPulse, {
              toValue: 1,
              duration: 620,
              easing: Easing.out(Easing.back(1.35)),
              useNativeDriver: true,
            }),
            Animated.timing(openLockOpacity, {
              toValue: 0,
              duration: 260,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(carReveal, {
            toValue: 1,
            duration: 720,
            easing: Easing.out(Easing.back(1.25)),
            useNativeDriver: true,
          }),
          Animated.timing(starBurst, {
            toValue: 1,
            duration: 920,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 1320));

    timers.push(setTimeout(() => {
      Animated.timing(entrance, {
        toValue: 0,
        duration: 360,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onDismissRef.current?.();
        }
      });
    }, 5200));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      lockAnimation?.stop();
    };
  }, [
    carReveal,
    closedLockOpacity,
    currentValue,
    entrance,
    lockJump,
    openLockOpacity,
    openLockPulse,
    previousValue,
    progressFill,
    starBurst,
  ]);

  if (!unlock) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.skinUnlockLayer}>
      <Animated.View style={[styles.skinUnlockBackdrop, { opacity: entrance }]} />
      <Pressable style={styles.skinUnlockDismissArea} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.skinUnlockContent,
            {
              opacity: entrance,
              transform: [{ translateY: revealTranslateY }, { scale: revealScale }],
            },
          ]}
        >
          <View
            style={[
              styles.skinUnlockStage,
              {
                width: unlockStageWidth,
                height: unlockStageWidth * 0.58,
              },
            ]}
          >
            {UNLOCK_STAR_POINTS.map((star, index) => {
              const starOpacity = starBurst.interpolate({
                inputRange: [0, 0.18 + index * 0.03, 1],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              });
              const starTranslateX = starBurst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, star.x],
              });
              const starTranslateY = starBurst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, star.y],
              });
              const starScale = starBurst.interpolate({
                inputRange: [0, 0.35, 1],
                outputRange: [0.4, 1.18, 0.72],
              });

              return (
                <Animated.Image
                  key={`unlock-star-${index}`}
                  source={CHALLENGE_UNLOCK_STAR_BLUE}
                  resizeMode="contain"
                  style={[
                    styles.skinUnlockStar,
                    {
                      left: star.left,
                      top: star.top,
                      width: unlockMetrics.s(star.size),
                      height: unlockMetrics.s(star.size),
                      opacity: starOpacity,
                      transform: [
                        { translateX: starTranslateX },
                        { translateY: starTranslateY },
                        { scale: starScale },
                      ],
                    },
                  ]}
                />
              );
            })}
            <Animated.Image
              source={PLAYER_IMAGES[unlock.skin] ?? PLAYER_IMAGES.groen}
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.skinUnlockCar,
                {
                  opacity: lockedCarOpacity,
                  transform: [{ scale: lockedCarScale }],
                },
              ]}
            />
            <Animated.Image
              source={CHALLENGE_SKIN_LOCK_IMAGE}
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.skinUnlockClosedLock,
                {
                  width: unlockLockSize,
                  height: unlockLockSize,
                  marginLeft: -unlockLockSize / 2,
                  marginTop: -unlockLockSize / 2,
                  opacity: closedLockOpacity,
                  transform: [
                    { translateY: lockTranslateY },
                    { scale: lockScale },
                  ],
                },
              ]}
            />
            <Animated.Image
              source={CHALLENGE_SKIN_UNLOCK_IMAGE}
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.skinUnlockOpenLock,
                {
                  width: unlockLockSize,
                  height: unlockLockSize,
                  marginLeft: -unlockLockSize / 2,
                  marginTop: -unlockLockSize / 2,
                  opacity: openLockOpacity,
                  transform: [
                    { translateY: lockTranslateY },
                    { scale: lockScale },
                    { scale: openLockPulseScale },
                  ],
                },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.skinUnlockChallengeTextBlock,
              {
                width: Math.min(screenWidth - 22, unlockMetrics.isTablet ? 650 : 620),
                minHeight: unlockMetrics.s(122, 112, unlockMetrics.isTablet ? 142 : 132),
                opacity: entrance,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
              style={[styles.skinUnlockChallengeName, { fontFamily }]}
            >
              {unlock.title}
            </Text>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.skinUnlockChallengeText, { fontFamily }]}
            >
              {unlock.description}
            </Text>
            <View style={styles.skinUnlockChallengeProgressRow}>
              <View style={styles.skinUnlockChallengeProgressTrack}>
                <Animated.View
                  style={[
                    styles.skinUnlockChallengeProgressFill,
                    {
                      width: progressFill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${previousRatio * 100}%`, `${currentRatio * 100}%`],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.skinUnlockChallengeProgressText, { fontFamily }]}>
                {progressTextCurrent} / {targetValue}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function ProgressSaveAfterSkinUnlockPrompt({ visible, fontFamily, onClose }) {
  const { loading: accountLoading, signingInProvider, signInWithApple, signInWithGoogle, user } = useAccount();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [errorText, setErrorText] = useState('');
  const progressSaveProvider = Platform.OS === 'android' ? 'google' : Platform.OS === 'ios' ? 'apple' : null;
  const providerLabel = progressSaveProvider === 'google' ? 'Google' : 'Apple';
  const signingIn = signingInProvider === progressSaveProvider;
  const panelWidth = Math.round(Math.min(screenWidth - 4, 390));
  const panelHeight = Math.round(panelWidth / PROGRESS_SAVE_PANEL_ASPECT_RATIO);
  const panelScale = panelWidth / 390;
  const titleSitsLowerOnPlusPhone = screenWidth >= 420 && screenHeight >= 900;
  const contentTopPadding = (titleSitsLowerOnPlusPhone ? 56 : 68) * panelScale;

  useEffect(() => {
    if (visible) {
      setErrorText('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && user) {
      onClose?.();
    }
  }, [onClose, user, visible]);

  if (!progressSaveProvider) {
    return null;
  }

  async function handleSaveProgress() {
    if (accountLoading || signingIn) {
      return;
    }

    setErrorText('');

    try {
      const nextSession = progressSaveProvider === 'google'
        ? await signInWithGoogle()
        : await signInWithApple();

      if (nextSession?.user) {
        onClose?.();
        return;
      }

      setErrorText('Inloggen is geannuleerd.');
    } catch (_error) {
      setErrorText('Opslaan lukt nu niet. Probeer het straks opnieuw via instellingen.');
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, styles.progressSavePromptBackdrop]}>
        <View
          style={[
            styles.progressSavePromptPanel,
            {
              width: panelWidth,
              height: panelHeight,
              transform: [{ translateY: -28 * panelScale }],
            },
          ]}
        >
          <Image
            source={PROGRESS_SAVE_PANEL_IMAGE}
            resizeMode="stretch"
            style={[
              styles.progressSavePromptPanelImage,
              {
                width: panelWidth,
                height: panelHeight,
              },
            ]}
            fadeDuration={0}
          />
          <View
            style={[
              styles.progressSavePromptContent,
              {
                paddingHorizontal: 54 * panelScale,
                paddingTop: contentTopPadding,
                paddingBottom: 70 * panelScale,
              },
            ]}
          >
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              style={[
                styles.progressSavePromptTitle,
                {
                  fontFamily,
                  fontSize: 34 * panelScale,
                  lineHeight: 39 * panelScale,
                },
              ]}
            >
              Voortgang opslaan?
            </Text>
            <View style={styles.progressSavePromptBody}>
              <Text
                style={[
                  styles.progressSavePromptText,
                  {
                    fontFamily,
                    fontSize: 18 * panelScale,
                    lineHeight: 25 * panelScale,
                  },
                ]}
              >
                Log in met je {providerLabel} account om geen autoskins te verliezen als je AutoBingo opnieuw download.
              </Text>
              <View style={[styles.progressSavePromptActions, { marginTop: 20 * panelScale, gap: 10 * panelScale }]}>
                <View style={styles.progressSavePromptButtonWrap}>
                  <GlossyButton
                    label={signingIn ? 'Even wachten...' : 'Voortgang opslaan'}
                    variant="green"
                    size="normal"
                    disabled={accountLoading || signingIn}
                    heightOverride={68 * panelScale}
                    horizontalPadding={32 * panelScale}
                    labelFontScale={1}
                    onPress={handleSaveProgress}
                  />
                </View>
                <View style={[styles.progressSavePromptButtonWrap, styles.progressSavePromptNoButtonWrap]}>
                  <GlossyButton
                    label="Nee"
                    variant="red"
                    size="normal"
                    disabled={signingIn}
                    heightOverride={56 * panelScale}
                    horizontalPadding={28 * panelScale}
                    labelFontScale={0.92}
                    onPress={onClose}
                  />
                </View>
              </View>
              {errorText ? (
                <Text
                  style={[
                    styles.progressSavePromptError,
                    {
                      fontFamily,
                      fontSize: 12 * panelScale,
                      lineHeight: 16 * panelScale,
                    },
                  ]}
                >
                  {errorText}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.progressSavePromptFootnote,
                  {
                    fontFamily,
                    fontSize: 12 * panelScale,
                    lineHeight: 16 * panelScale,
                    marginTop: 12 * panelScale,
                  },
                ]}
              >
                Dit kan je altijd nog aanpassen in de instellingen
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ClaimScoreCard({
  player,
  fredoka,
  cardWidth,
  carWidth = 216,
  carHeight = 152,
  carMinHeight = 156,
  nameFontSize = 16,
  scoreFontSize = 28,
}) {
  const playerColor = PLAYER_HEX[player.skin] ?? '#2E8B3F';
  const scoreScale = useRef(new Animated.Value(1)).current;
  const carScale = useRef(new Animated.Value(1)).current;
  const carLift = useRef(new Animated.Value(0)).current;
  const sparkProgress = useRef(new Animated.Value(0)).current;
  const [sparksVisible, setSparksVisible] = useState(false);
  const [sparkSeed, setSparkSeed] = useState(1);
  const previousScoreRef = useRef(player.tileCount);

  useEffect(() => {
    if (player.tileCount <= previousScoreRef.current) {
      previousScoreRef.current = player.tileCount;
      return;
    }

    scoreScale.setValue(1);
    carScale.setValue(1);
    carLift.setValue(0);
    sparkProgress.setValue(0);
    setSparkSeed((current) => current + 1);
    setSparksVisible(true);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(carLift, {
          toValue: -7,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(carLift, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: 1.22,
          duration: 110,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 4,
          tension: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(carScale, {
          toValue: 1.22,
          duration: 120,
          easing: Easing.out(Easing.back(1.35)),
          useNativeDriver: true,
        }),
        Animated.spring(carScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(sparkProgress, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    const hideTimeout = setTimeout(() => {
      setSparksVisible(false);
    }, 520);

    previousScoreRef.current = player.tileCount;
    return () => clearTimeout(hideTimeout);
  }, [carLift, carScale, player.tileCount, scoreScale, sparkProgress]);

  return (
    <View style={[styles.claimScoreCard, { width: cardWidth }]}>
      <Text
        style={[
          styles.claimScoreCardName,
          {
            fontFamily: fredoka,
            color: playerColor,
            fontSize: nameFontSize,
            lineHeight: nameFontSize + 4,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {player.naam}
      </Text>
      <View
        style={[
          styles.claimCarWrap,
          {
            width: carWidth,
            minHeight: carMinHeight,
          },
        ]}
      >
        <Animated.Image
          source={PLAYER_IMAGES[player.skin] ?? PLAYER_IMAGES.groen}
          style={[
            styles.claimScoreCar,
            {
              width: carWidth,
              height: carHeight,
            },
            {
              transform: [{ translateY: carLift }, { scale: carScale }],
            },
          ]}
          resizeMode="contain"
        />
        <ClaimSparkBurst
          progress={sparkProgress}
          color={mixHex(playerColor, '#ffffff', 0.18)}
          visible={sparksVisible}
          seed={sparkSeed}
          width={carWidth}
          height={carHeight}
        />
      </View>
      <Animated.Text
        style={[
          styles.claimScoreValue,
          {
            color: playerColor,
            fontFamily: fredoka,
            fontSize: scoreFontSize,
            lineHeight: scoreFontSize + 4,
            transform: [{ scale: scoreScale }],
          },
        ]}
      >
        {player.tileCount}
      </Animated.Text>
    </View>
  );
}

function MiddlePlayerCar({ skin, mirrored = false, feedbackKey = 0 }) {
  const playerColor = PLAYER_HEX[skin] ?? '#2E8B3F';
  const carScale = useRef(new Animated.Value(1)).current;
  const carLift = useRef(new Animated.Value(0)).current;
  const sparkProgress = useRef(new Animated.Value(0)).current;
  const [sparksVisible, setSparksVisible] = useState(false);
  const [sparkSeed, setSparkSeed] = useState(1);

  useEffect(() => {
    if (!feedbackKey) {
      return undefined;
    }

    carScale.setValue(1);
    carLift.setValue(0);
    sparkProgress.setValue(0);
    setSparkSeed((current) => current + 1);
    setSparksVisible(true);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(carLift, {
          toValue: -5,
          duration: 95,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(carLift, {
          toValue: 0,
          friction: 7,
          tension: 115,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(carScale, {
          toValue: 1.13,
          duration: 105,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.spring(carScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(sparkProgress, {
        toValue: 1,
        duration: 430,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const hideTimeout = setTimeout(() => {
      setSparksVisible(false);
    }, 470);

    return () => clearTimeout(hideTimeout);
  }, [carLift, carScale, feedbackKey, sparkProgress]);

  const carTransform = [
    { translateY: carLift },
    ...(mirrored ? [{ scaleX: -1 }] : []),
    { scale: carScale },
  ];

  return (
    <View style={styles.middlePlayerCarWrap}>
      <Animated.Image
        source={PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.groen}
        style={[
          styles.middlePlayerCar,
          {
            transform: carTransform,
          },
        ]}
        resizeMode="contain"
      />
      <ClaimSparkBurst
        progress={sparkProgress}
        color={mixHex(playerColor, '#ffffff', 0.18)}
        visible={sparksVisible}
        seed={sparkSeed}
        width={170}
        height={114}
      />
    </View>
  );
}

const ClaimConfettiOverlay = memo(function ClaimConfettiOverlay({
  visible,
  winnerColor,
  winnerColors,
  onAnimationEnd,
}) {
  const { width: screenWidth } = useWindowDimensions();

  if (!visible) {
    return null;
  }

  const confettiBaseColors = Array.isArray(winnerColors) && winnerColors.length
    ? winnerColors
    : [winnerColor ?? '#2E8B3F'];
  const confettiColors = confettiBaseColors.flatMap((color) => [
    mixHex(color, '#ffffff', 0.18),
    mixHex(color, '#fff1a8', 0.42),
    mixHex(color, '#ffffff', 0.62),
    darkenHex(color, 0.72),
  ]);

  return (
    <View pointerEvents="none" style={styles.claimConfettiForeground}>
      <ConfettiCannon
        count={64}
        origin={{ x: screenWidth / 2, y: 12 }}
        autoStart
        fadeOut
        fallSpeed={2600}
        explosionSpeed={320}
        colors={confettiColors}
        onAnimationEnd={onAnimationEnd}
      />
    </View>
  );
});

function ClaimResultsPodium({
  players,
  fredoka,
  canReplay,
  settingsLabel = 'Instellingen',
  confirmHomeMenu = false,
  onBeforeWinnerMenu,
  onMenu,
  onReplay,
  onSettings,
}) {
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCrowdedPodium = players.length >= 5;
  const isMediumPodium = players.length >= 3 && players.length <= 4;
  const pillarDelay = 500;
  const pillarStagger = 80;
  const pillarDuration = 2100;
  const stageHeight = isCrowdedPodium ? 224 : 250;
  const scoreBlockHeight = 54;
  const assetScoreAreaHeight = isCrowdedPodium ? 32 : 34;
  const assetBaseHeight = isCrowdedPodium ? 18 : 24;
  const assetImageHeight = isCrowdedPodium ? 204 : 232;
  const maxGrowHeight = isCrowdedPodium ? 132 : 142;
  const podiumLiftStart = isCrowdedPodium ? -2 : -6;
  const podiumCarOverlap = isCrowdedPodium ? 7 : 9;
  const maxScore = Math.max(...players.map((player) => player.tileCount), 1);
  const resultsKey = players
    .map((player) => `${player.playerId}:${player.tileCount}`)
    .join('|');
  const playerScores = useMemo(
    () => players.map((player) => player.tileCount),
    [resultsKey]
  );
  const topScore = Math.max(...playerScores, 0);
  const winnerIndexes = useMemo(
    () => players
      .map((player, index) => (player.tileCount === topScore ? index : -1))
      .filter((index) => index >= 0),
    [resultsKey, topScore]
  );
  const winnerColor = winnerIndexes.length > 0
    ? (PLAYER_HEX[players[winnerIndexes[0]].skin] ?? '#2E8B3F')
    : '#2E8B3F';
  const winnerColors = winnerIndexes.length > 0
    ? winnerIndexes.map((index) => PLAYER_HEX[players[index].skin] ?? '#2E8B3F')
    : ['#2E8B3F'];
  const hasMultipleWinners = winnerIndexes.length > 1;
  const winnerNameParts = winnerIndexes
    .map((index) => {
      const player = players[index];

      if (!player?.naam) {
        return null;
      }

      return {
        name: player.naam,
        color: mixHex(PLAYER_HEX[player.skin] ?? '#2E8B3F', '#111827', 0.12),
        playerId: player.playerId ?? `winner-${index}`,
      };
    })
    .filter(Boolean);
  const barProgressValues = useMemo(
    () => players.map(() => new Animated.Value(0)),
    [players.length]
  );
  const carFloatValues = useMemo(
    () => players.map(() => new Animated.Value(0)),
    [players.length]
  );
  const winnerScaleValues = useMemo(
    () => players.map(() => new Animated.Value(1)),
    [players.length]
  );
  const winnerRotateValues = useMemo(
    () => players.map(() => new Animated.Value(0)),
    [players.length]
  );
  const animationRef = useRef(null);
  const startTimeoutRef = useRef(null);
  const confettiTimeoutRef = useRef(null);
  const latestPressPointRef = useRef({ x: screenWidth / 2, y: screenHeight / 2 });
  const claimRouteRevealRef = useRef(null);
  const pendingClaimRouteActionRef = useRef(null);
  const claimRouteRevealBusyRef = useRef(false);
  const winnerNameProgress = useRef(new Animated.Value(0)).current;
  const playButtonProgress = useRef(new Animated.Value(0)).current;
  const settingsButtonProgress = useRef(new Animated.Value(0)).current;
  const homeButtonProgress = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimRouteReveal, setClaimRouteReveal] = useState({
    color: '#F5C400',
    origin: { x: screenWidth / 2, y: screenHeight / 2 },
    key: 0,
  });
  const rememberPressPoint = (event) => {
    latestPressPointRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
  };

  const startClaimRouteReveal = (action, origin = {}, color = '#F5C400') => {
    if (claimRouteRevealBusyRef.current) {
      return;
    }

    const revealOrigin = {
      x: origin.x ?? screenWidth / 2,
      y: origin.y ?? screenHeight / 2,
    };

    claimRouteRevealBusyRef.current = true;
    pendingClaimRouteActionRef.current = () => action?.(revealOrigin);
    setClaimRouteReveal({
      color,
      origin: revealOrigin,
      key: Date.now(),
    });
  };

  useEffect(() => {
    if (!claimRouteReveal.key) {
      return;
    }

    requestAnimationFrame(() => {
      claimRouteRevealRef.current?.reveal();
    });
  }, [claimRouteReveal.key]);

  useEffect(() => {
    const hasStartedPillars = barProgressValues.some((value) => {
      if (typeof value.__getValue !== 'function') {
        return false;
      }
      return value.__getValue() > 0;
    });

    if (hasStartedPillars) {
      return undefined;
    }

    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
    }
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = null;
    }
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    barProgressValues.forEach((value) => value.setValue(0));
    carFloatValues.forEach((value) => value.setValue(0));
    winnerScaleValues.forEach((value) => value.setValue(1));
    winnerRotateValues.forEach((value) => value.setValue(0));
    winnerNameProgress.setValue(0);
    playButtonProgress.setValue(0);
    settingsButtonProgress.setValue(0);
    homeButtonProgress.setValue(0);
    setShowConfetti(false);

    const animations = playerScores.flatMap((tileCount, index) => {
      const normalizedHeight = tileCount <= 0
        ? 0
        : maxGrowHeight * (tileCount / maxScore);

      return [
        Animated.sequence([
          Animated.delay(pillarDelay + index * pillarStagger),
          Animated.timing(barProgressValues[index], {
            toValue: normalizedHeight,
            duration: pillarDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.delay(pillarDelay + pillarDuration + 250 + index * pillarStagger),
            Animated.timing(carFloatValues[index], {
              toValue: -4,
              duration: 1400,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(carFloatValues[index], {
              toValue: 0,
              duration: 1400,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
          ])
        ),
      ];
    });

    const winnerRevealDelay = pillarDelay + pillarDuration + 220;
    const winnerAnimations = winnerIndexes.flatMap((index) => ([
      Animated.sequence([
        Animated.delay(winnerRevealDelay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(winnerScaleValues[index], {
              toValue: 1.18,
              duration: 180,
              easing: Easing.out(Easing.back(1.6)),
              useNativeDriver: false,
            }),
            Animated.timing(winnerScaleValues[index], {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(winnerRotateValues[index], {
              toValue: -1,
              duration: 80,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(winnerRotateValues[index], {
              toValue: 1,
              duration: 100,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(winnerRotateValues[index], {
              toValue: -0.7,
              duration: 90,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(winnerRotateValues[index], {
              toValue: 0.5,
              duration: 90,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(winnerRotateValues[index], {
              toValue: 0,
              duration: 110,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
          ]),
        ]),
      ]),
    ]));

    const animation = Animated.parallel(
      [...animations, ...winnerAnimations],
      { stopTogether: false }
    );
    startTimeoutRef.current = setTimeout(() => {
      animationRef.current = animation;
      animation.start(() => {
        animationRef.current = null;
      });
    }, 0);
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(true);
      Animated.parallel([
        Animated.timing(winnerNameProgress, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(105, [
          Animated.timing(playButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(settingsButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(homeButtonProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, winnerRevealDelay + 220);

    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      barProgressValues.forEach((value) => value.stopAnimation());
      carFloatValues.forEach((value) => value.stopAnimation());
      winnerScaleValues.forEach((value) => value.stopAnimation());
      winnerRotateValues.forEach((value) => value.stopAnimation());
    };
  }, [
    resultsKey,
    barProgressValues,
    carFloatValues,
    homeButtonProgress,
    playButtonProgress,
    settingsButtonProgress,
    winnerNameProgress,
    winnerRotateValues,
    winnerScaleValues,
  ]);

  const winnerNameOpacity = winnerNameProgress;
  const winnerNameTranslateY = winnerNameProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const dotsOpacity = winnerNameProgress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <>
      <ClaimConfettiOverlay
        visible={showConfetti}
        winnerColor={winnerColor}
        winnerColors={winnerColors}
        onAnimationEnd={() => setShowConfetti(false)}
      />
      <View style={[styles.modalCard, styles.claimResultModalCard]}>
        <View style={styles.claimWinnerHeader}>
          <Text style={[styles.modalTitle, styles.claimResultTitle, { fontFamily: fredoka }]}>
            {hasMultipleWinners ? 'De winnaars zijn:' : 'De winnaar is:'}
          </Text>
          <View style={styles.claimWinnerNameWrap}>
            <Animated.Text
              style={[
                styles.claimWinnerDots,
                { fontFamily: fredoka, opacity: dotsOpacity },
              ]}
            >
              ....
            </Animated.Text>
            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              style={[
                styles.claimWinnerName,
                {
                  fontFamily: fredoka,
                  opacity: winnerNameOpacity,
                  transform: [{ translateY: winnerNameTranslateY }],
                },
              ]}
            >
              {winnerNameParts.length ? winnerNameParts.map((winnerPart, winnerPartIndex) => (
                <Text key={winnerPart.playerId}>
                  {winnerPartIndex > 0 ? (
                    <Text style={styles.claimWinnerNameJoiner}> & </Text>
                  ) : null}
                  <Text style={{ color: winnerPart.color }}>{winnerPart.name}</Text>
                </Text>
              )) : t('players.defaultName', { number: 1 })}
            </Animated.Text>
          </View>
        </View>

        <View style={[styles.claimResultStage, isCrowdedPodium && styles.claimResultStageCrowded]}>
          {players.map((player, index) => {
            const playerColor = PLAYER_HEX[player.skin] ?? '#2E8B3F';
            const podiumAsset = CLAIM_PODIUM_ASSETS[player.skin];
            const growHeight = barProgressValues[index];
            const blockPillarHeight = growHeight.interpolate({
              inputRange: [0, maxGrowHeight],
              outputRange: [scoreBlockHeight, scoreBlockHeight + maxGrowHeight],
              extrapolate: 'clamp',
            });
            const assetPillarHeight = growHeight.interpolate({
              inputRange: [0, maxGrowHeight],
              outputRange: [assetBaseHeight, assetBaseHeight + maxGrowHeight],
              extrapolate: 'clamp',
            });
            const totalPillarHeight = podiumAsset ? assetPillarHeight : blockPillarHeight;
            const stackBottom = podiumAsset
              ? assetPillarHeight.interpolate({
                  inputRange: [assetBaseHeight, assetBaseHeight + maxGrowHeight],
                  outputRange: [
                    assetScoreAreaHeight + assetBaseHeight - podiumCarOverlap,
                    assetScoreAreaHeight + assetBaseHeight + maxGrowHeight - podiumCarOverlap,
                  ],
                  extrapolate: 'clamp',
                })
              : blockPillarHeight.interpolate({
                  inputRange: [scoreBlockHeight, scoreBlockHeight + maxGrowHeight],
                  outputRange: [scoreBlockHeight + podiumLiftStart, scoreBlockHeight + maxGrowHeight + podiumLiftStart],
                  extrapolate: 'clamp',
                });
            return (
              <View
                key={`${player.playerId}-podium`}
                style={[
                  styles.claimPodiumLane,
                  isMediumPodium && styles.claimPodiumLaneMedium,
                  isCrowdedPodium && styles.claimPodiumLaneCrowded,
                ]}
              >
                <View style={[styles.claimPodiumStage, { height: stageHeight }]}>
                  {podiumAsset ? (
                    <>
                      <Animated.View
                        style={[
                          styles.claimPodiumAssetClip,
                          isMediumPodium && styles.claimPodiumAssetClipMedium,
                          {
                            bottom: assetScoreAreaHeight,
                            height: totalPillarHeight,
                          },
                        ]}
                      >
                        <Image
                          source={podiumAsset}
                          style={[
                            styles.claimPodiumAssetImage,
                            { height: assetImageHeight },
                          ]}
                          resizeMode="stretch"
                        />
                      </Animated.View>
                      <ClaimPodiumCounter
                        value={player.tileCount}
                        progress={growHeight}
                        maxGrowHeight={maxGrowHeight}
                        targetHeight={player.tileCount <= 0 ? 0 : maxGrowHeight * (player.tileCount / maxScore)}
                        fredoka={fredoka}
                        style={[
                          styles.claimPodiumAssetScore,
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.claimPodiumScoreBlock}>
                        <ClaimPodiumCounter
                          value={player.tileCount}
                          progress={growHeight}
                          maxGrowHeight={maxGrowHeight}
                          targetHeight={player.tileCount <= 0 ? 0 : maxGrowHeight * (player.tileCount / maxScore)}
                          fredoka={fredoka}
                        />
                      </View>
                      <Animated.View
                        style={[
                          styles.claimPodiumGrowBlock,
                          isMediumPodium && styles.claimPodiumGrowBlockMedium,
                          {
                            backgroundColor: playerColor,
                            height: growHeight,
                          },
                        ]}
                      >
                        <LinearGradient
                          pointerEvents="none"
                          colors={[
                            mixHex(playerColor, '#ffffff', 0.5),
                            playerColor,
                            darkenHex(playerColor, 0.72),
                          ]}
                          locations={[0, 0.42, 1]}
                          start={{ x: 0.16, y: 0 }}
                          end={{ x: 0.84, y: 1 }}
                          style={styles.claimPodiumShaftGradient}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumTopCap,
                            { backgroundColor: mixHex(playerColor, '#ffffff', 0.32) },
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumGrowGloss,
                            { backgroundColor: mixHex(playerColor, '#ffffff', 0.42) },
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumShaftHighlight,
                            { backgroundColor: mixHex(playerColor, '#ffffff', 0.5) },
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumShaftGroove,
                            styles.claimPodiumShaftGrooveLeft,
                            { backgroundColor: darkenHex(playerColor, 0.76) },
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumShaftGroove,
                            styles.claimPodiumShaftGrooveRight,
                            { backgroundColor: darkenHex(playerColor, 0.76) },
                          ]}
                        />
                      </Animated.View>
                    </>
                  )}
                  <Animated.View
                    style={[
                      styles.claimPodiumStack,
                      {
                        bottom: stackBottom,
                        transform: [
                          { translateY: carFloatValues[index] },
                          { scale: winnerScaleValues[index] },
                          {
                            rotate: winnerRotateValues[index].interpolate({
                              inputRange: [-1, 1],
                              outputRange: ['-7deg', '7deg'],
                            }),
                          },
                        ],
                      },
                  ]}
                >
                  <Image
                    source={PLAYER_IMAGES[player.skin] ?? PLAYER_IMAGES.groen}
                    style={[
                      styles.claimPodiumCar,
                      isMediumPodium && styles.claimPodiumCarMedium,
                      isCrowdedPodium && styles.claimPodiumCarCrowded,
                    ]}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.claimResultActions}>
        <WinnerMenuButton
          progress={playButtonProgress}
          disabled={!canReplay}
          variant="green"
          label={t('home.play')}
          onPress={() => {
              if (!canReplay) {
                return;
              }

              setShowConfetti(false);
              onReplay?.();
          }}
        />
        <WinnerMenuButton
          progress={settingsButtonProgress}
          variant="blue"
          label={settingsLabel}
          onPressIn={rememberPressPoint}
          getPressOrigin={() => latestPressPointRef.current}
          onPress={() => {
              startClaimRouteReveal((revealOrigin) => {
                setShowConfetti(false);
                onSettings?.(revealOrigin);
              }, latestPressPointRef.current, '#1A7BD4');
          }}
        />
        <WinnerMenuButton
          progress={homeButtonProgress}
          variant="yellow"
          label="Hoofdmenu"
          onPressIn={rememberPressPoint}
          getPressOrigin={() => latestPressPointRef.current}
          onPress={() => {
              if (confirmHomeMenu) {
                setShowConfetti(false);
                onMenu?.(latestPressPointRef.current);
                return;
              }

              void Promise.resolve(onBeforeWinnerMenu?.()).then(() => {
                setShowConfetti(false);
                startClaimRouteReveal((revealOrigin) => {
                  onMenu?.(revealOrigin);
                }, latestPressPointRef.current, '#F5C400');
              });
          }}
        />
      </View>
      {!canReplay ? (
        <Text style={styles.waitForHostText}>Wacht tot de host opnieuw start.</Text>
      ) : null}
      <CircularReveal
        key={`claim-route-cover-${claimRouteReveal.key}`}
        ref={claimRouteRevealRef}
        color={claimRouteReveal.color}
        originX={claimRouteReveal.origin.x}
        originY={claimRouteReveal.origin.y}
        onComplete={() => {
          const pendingAction = pendingClaimRouteActionRef.current;
          pendingClaimRouteActionRef.current = null;
          claimRouteRevealBusyRef.current = false;
          pendingAction?.();
        }}
      />
    </>
  );
}

function ClaimPodiumCounter({ value, progress, maxGrowHeight, targetHeight, fredoka, style }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(0);

    const listenerId = progress.addListener(({ value: latest }) => {
      const resolvedTargetHeight = Number.isFinite(targetHeight) ? targetHeight : maxGrowHeight;
      const ratio = resolvedTargetHeight <= 0
        ? 0
        : Math.max(0, Math.min(1, latest / resolvedTargetHeight));
      setDisplayValue(Math.round(value * ratio));
    });

    return () => {
      progress.removeListener(listenerId);
    };
  }, [maxGrowHeight, progress, targetHeight, value]);

  return (
    <Text style={[styles.claimPodiumScore, style, { fontFamily: fredoka }]}>
      {displayValue}
    </Text>
  );
}

function getRulesFromProps({
  rules,
  wincondition,
  diagonaal,
  kaartOpzet,
}) {
  if (rules) return rules;

  const winModeMap = {
    '1rij': 'one_line',
    '2rijen': 'two_lines',
    'heel-blok': 'full_card',
  };

  return {
    sharedCards: kaartOpzet === 'zelfde',
    winMode: winModeMap[wincondition] ?? 'one_line',
    allowDiagonal: diagonaal ?? true,
  };
}

function getLocalPlayerKey(player, index) {
  return player?.playerId ?? `local:${index}`;
}

function ActiveCollectiveCellGradient({ gradient, cellSize, borderRadius, visible }) {
  if (!visible || !gradient?.board) {
    return null;
  }

  const { size, cellLeft, cellTop, cellIndex = 0 } = gradient.board;
  const gradientId = `active-collective-cell-gradient-${cellIndex}-${Math.round(cellSize)}`;
  const glowGradientId = `active-collective-cell-glow-${cellIndex}-${Math.round(cellSize)}`;
  const gradientCoords = {
    x1: gradient.x1 * size - cellLeft,
    y1: gradient.y1 * size - cellTop,
    x2: gradient.x2 * size - cellLeft,
    y2: gradient.y2 * size - cellTop,
  };

  return (
    <Svg
      pointerEvents="none"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      style={styles.activeCollectiveCellGradient}
    >
      <Defs>
        <SvgLinearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={gradientCoords.x1}
          y1={gradientCoords.y1}
          x2={gradientCoords.x2}
          y2={gradientCoords.y2}
        >
          {gradient.colors.map((stopColor, index) => (
            <Stop
              key={`active-collective-wipe-stop-${index}`}
              offset={gradient.locations[index]}
              stopColor={stopColor}
            />
          ))}
        </SvgLinearGradient>
        <SvgLinearGradient
          id={glowGradientId}
          gradientUnits="userSpaceOnUse"
          x1={gradientCoords.x1}
          y1={gradientCoords.y1}
          x2={gradientCoords.x2}
          y2={gradientCoords.y2}
        >
          {gradient.glowColors.map((stopColor, index) => (
            <Stop
              key={`active-collective-wipe-glow-stop-${index}`}
              offset={gradient.locations[index]}
              stopColor={stopColor}
            />
          ))}
        </SvgLinearGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        rx={borderRadius}
        ry={borderRadius}
        fill={`url(#${gradientId})`}
      />
      <Rect
        x={0}
        y={0}
        width={cellSize}
        height={cellSize}
        rx={borderRadius}
        ry={borderRadius}
        fill={`url(#${glowGradientId})`}
      />
    </Svg>
  );
}

function GameBackButton({ onPress }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      hitSlop={10}
      style={styles.gameBackButton}
    >
      <Image
        source={GAME_BACK_BUTTON}
        style={[styles.gameBackButtonImage, styles.gameBackButtonShadow]}
        resizeMode="contain"
      />
      <Image
        source={pressed ? GAME_BACK_BUTTON_PRESSED : GAME_BACK_BUTTON}
        style={styles.gameBackButtonImage}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function BingoCardScreen({
  theme,
  thema,
  seed,
  syncType,
  modus,
  lobbyCode,
  liveLobbyPlayers,
  startedAt,
  playerCount,
  playerColors,
  playerNames,
  playerThemes,
  spelers,
  rules,
  wincondition,
  diagonaal,
  nederlands,
  aantalSpelersOpDitApparaat,
  kaartOpzet,
  onGameBack,
  onBeforeWinnerMenu,
  onMenu,
  onReplay,
  onSettings,
  settingsLabel = 'Instellingen',
  canReplay = true,
  isLiveLobbyHost = true,
  tutorialMode = false,
  tutorialActive = false,
  tutorialStep = null,
  onTutorialTargetLayout = null,
  onTutorialAction = null,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const gameResponsiveMetrics = getResponsiveMetrics(screenWidth, screenHeight);
  const { isTablet: isTabletGame } = gameResponsiveMetrics;
  const boardViewport = useMemo(() => ({
    width: screenWidth,
    height: screenHeight,
    isTablet: isTabletGame,
  }), [isTabletGame, screenHeight, screenWidth]);
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const { settings } = useAppSettings();
  const { isPremium } = usePremium();
  const { loading: accountLoading, user } = useAccount();
  const normalizedMode = typeof modus === 'string' ? modus.toLowerCase() : '';
  const isCollectiveMode = normalizedMode === 'collectief';
  const isClaimMode = normalizedMode === 'claim';
  const boardGridSize = isClaimMode ? CLAIM_GRID_SIZE : STANDARD_GRID_SIZE;
  const boardCellCount = boardGridSize * boardGridSize;
  const resolvedTheme = thema ?? theme ?? 'snelweg';
  const liveSyncEnabled = syncType === 'live' && Boolean(lobbyCode);
  const resolvedPlayers = useMemo(
    () => (
      withDefaultPlayerNames(
        spelers?.length
          ? spelers
          : Array.from({ length: aantalSpelersOpDitApparaat ?? playerCount ?? 1 }, (_, index) => ({
              naam: playerNames?.[index] ?? `Speler ${index + 1}`,
              skin: playerColors?.[index] ?? 'groen',
            }))
      )
    ),
    [
      aantalSpelersOpDitApparaat,
      playerColors,
      playerCount,
      playerNames,
      spelers,
    ]
  );
  const allKnownPlayers = useMemo(() => {
    const playerMap = new Map();

    withDefaultPlayerNames([...(liveLobbyPlayers ?? []), ...resolvedPlayers]).forEach((player, index) => {
      const playerId = getLocalPlayerKey(player, index);
      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          playerId,
          skin: player?.skin ?? 'groen',
          naam: player?.naam ?? `Speler ${index + 1}`,
        });
      }
    });

    return playerMap;
  }, [liveLobbyPlayers, resolvedPlayers]);
  const displayPlayers = useMemo(
    () => Array.from(allKnownPlayers.values()),
    [allKnownPlayers]
  );
  const boardPlayers = useMemo(
    () => resolvedPlayers,
    [resolvedPlayers]
  );
  const liveBingoPlayers = useMemo(
    () => (
      liveSyncEnabled && !isCollectiveMode && !isClaimMode
        ? displayPlayers
        : []
    ),
    [displayPlayers, isClaimMode, isCollectiveMode, liveSyncEnabled]
  );
  const localPlayerIds = useMemo(
    () => new Set(resolvedPlayers.map((player, index) => getLocalPlayerKey(player, index))),
    [resolvedPlayers]
  );
  const resolvedPlayerCount = boardPlayers.length || resolvedPlayers.length || aantalSpelersOpDitApparaat || playerCount || 1;
  const resolvedPlayerColors = useMemo(
    () => boardPlayers.map((player, index) => player.skin ?? playerColors?.[index] ?? 'groen'),
    [boardPlayers, playerColors]
  );

  const derivedThemes = useMemo(
    () => (
      playerThemes?.length
        ? playerThemes
        : kaartOpzet === 'ander-thema'
          ? getPlayerThemes(resolvedTheme, resolvedPlayerCount)
          : Array.from({ length: resolvedPlayerCount }, () => resolvedTheme)
    ),
    [kaartOpzet, playerThemes, resolvedPlayerCount, resolvedTheme]
  );
  const actieveRegels = useMemo(
    () => getRulesFromProps({
      rules,
      wincondition,
      diagonaal,
      kaartOpzet,
    }),
    [rules, wincondition, diagonaal, kaartOpzet]
  );
  const resolvedSeed = Number.isFinite(seed) ? seed : 0;
  const connectionStatus = useOnlineConnectionStatus(liveSyncEnabled);
  const liveConnectionOffline = liveSyncEnabled && connectionStatus.isOffline;
  const compactTwoPlayerLayout = !isClaimMode && resolvedPlayerCount >= 2;
  const boardKeys = useMemo(
    () => boardPlayers.map((player, index) => {
      if (isCollectiveMode || isClaimMode) {
        return 'shared:0';
      }

      return player.playerId ?? `local:${index}`;
    }),
    [boardPlayers, isClaimMode, isCollectiveMode]
  );
  const collectiveGradientPlayers = useMemo(
    () => (liveLobbyPlayers?.length ? liveLobbyPlayers : resolvedPlayers),
    [liveLobbyPlayers, resolvedPlayers]
  );
  const collectiveGradientPalette = useMemo(
    () => getCollectiveGradientPalette(
      (collectiveGradientPlayers.length ? collectiveGradientPlayers : displayPlayers)
        .map((player, index) => player?.skin ?? resolvedPlayerColors[index] ?? 'groen')
    ),
    [collectiveGradientPlayers, displayPlayers, resolvedPlayerColors]
  );
  const usesSharedBoard = isCollectiveMode || isClaimMode || actieveRegels.sharedCards;
  const itemOptions = useMemo(() => ({
    nederlands: nederlands !== false,
    recentItemIds: usesSharedBoard ? [] : readCachedRecentBingoItemIds(),
  }), [nederlands, usesSharedBoard]);
  const [sharedItems] = useState(() => getRandomItems(resolvedTheme, boardCellCount, resolvedSeed, itemOptions));
  const sharedIcons = useMemo(() => sharedItems.map((item) => item.icon), [sharedItems]);
  const [playerItemEntries] = useState(() =>
    usesSharedBoard
      ? Array.from({ length: resolvedPlayerCount }, () => sharedItems)
      : kaartOpzet === 'ander-thema'
        ? derivedThemes.map((playerTheme, index) => getRandomItems(playerTheme, boardCellCount, resolvedSeed + index, itemOptions))
        : Array.from({ length: resolvedPlayerCount }, (_, index) => getRandomItems(resolvedTheme, boardCellCount, resolvedSeed + index, itemOptions))
  );
  const playerIcons = useMemo(
    () => playerItemEntries.map((boardItems) => boardItems.map((item) => item.icon)),
    [playerItemEntries]
  );
  useEffect(() => {
    void loadRecentBingoItemIds();
  }, []);
  useEffect(() => {
    void rememberRecentBingoItems(playerItemEntries);
  }, [playerItemEntries]);
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(boardCellCount).fill(false))
  );
  const [playerClaimOwners, setPlayerClaimOwners] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(boardCellCount).fill(null))
  );
  const [playerWinLines, setPlayerWinLines] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => [])
  );
  const [middleCarFeedbackKeys, setMiddleCarFeedbackKeys] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => 0)
  );

  useEffect(() => {
    setPlayerChecked((current) => Array.from({ length: resolvedPlayerCount }, (_, index) => (
      current[index] ?? Array(boardCellCount).fill(false)
    )));
    setPlayerClaimOwners((current) => Array.from({ length: resolvedPlayerCount }, (_, index) => (
      current[index] ?? Array(boardCellCount).fill(null)
    )));
    setPlayerWinLines((current) => Array.from({ length: resolvedPlayerCount }, (_, index) => (
      current[index] ?? []
    )));
    setMiddleCarFeedbackKeys((current) => Array.from({ length: resolvedPlayerCount }, (_, index) => (
      current[index] ?? 0
    )));
  }, [boardCellCount, resolvedPlayerCount]);

  const [winnerColor, setWinnerColor] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerIsRemote, setWinnerIsRemote] = useState(false);
  const [winnerRouteReveal, setWinnerRouteReveal] = useState({
    color: '#E03030',
    origin: { x: screenWidth / 2, y: screenHeight / 2 },
    key: 0,
  });
  const [lineCelebrations, setLineCelebrations] = useState([]);
  const [celebrationConfettiVisible, setCelebrationConfettiVisible] = useState(false);
  const [celebrationSplashVisible, setCelebrationSplashVisible] = useState(false);
  const [pendingWinnerModalKey, setPendingWinnerModalKey] = useState(null);
  const [pendingSkinUnlockAnnouncements, setPendingSkinUnlockAnnouncements] = useState([]);
  const [skinUnlockAnnouncement, setSkinUnlockAnnouncement] = useState(null);
  const [progressSavePromptVisible, setProgressSavePromptVisible] = useState(false);
  const [inspectedCell, setInspectedCell] = useState(null);
  const [backConfirmVisible, setBackConfirmVisible] = useState(false);
  const [homeConfirmVisible, setHomeConfirmVisible] = useState(false);
  const [pendingHomeOrigin, setPendingHomeOrigin] = useState(null);
  const [suppressedCheckPulseKeys, setSuppressedCheckPulseKeys] = useState({});
  const [collectiveGradientTick, setCollectiveGradientTick] = useState(0);
  const nearBingoSpin = useRef(new Animated.Value(0)).current;
  const showNearBingoHints = !isClaimMode;
  const nearBingoHints = useMemo(
    () => (
      showNearBingoHints
        ? playerChecked.map((checked) => getNearBingoCellIndexes(checked, actieveRegels, boardGridSize))
        : Array.from({ length: resolvedPlayerCount }, () => new Set())
    ),
    [actieveRegels, boardGridSize, playerChecked, resolvedPlayerCount, showNearBingoHints]
  );
  const hasNearBingoHints = nearBingoHints.some((cellIndexes) => cellIndexes.size > 0);
  const inspectProgress = useRef(new Animated.Value(0)).current;
  const inspectAnimationRef = useRef(null);
  const playerCheckedRef = useRef(playerChecked);
  const finishedGameRecordedRef = useRef(false);
  const localGameStartedAtRef = useRef(Date.now());
  const pendingLocalBoardCellsRef = useRef(new Map());
  const celebrationTimeoutsRef = useRef([]);
  const activeCelebrationKeysRef = useRef(new Set());
  const announcedLiveWinnerKeyRef = useRef(null);
  const suppressWinnerCelebrationRestartRef = useRef(false);
  const winnerRouteRevealRef = useRef(null);
  const pendingWinnerRouteActionRef = useRef(null);
  const winnerRouteRevealBusyRef = useRef(false);
  const progressSavePromptQueuedRef = useRef(false);
  const boardAreaRef = useRef(null);
  const tutorialRemoteMarksPlayedRef = useRef(false);
  const winnerInfoTutorialStepActive = [
    'game-winner-play-info',
    'game-winner-lobby-info',
    'game-winner-home-info',
  ].includes(tutorialStep?.id);
  const winnerHomeTutorialStepActive = tutorialStep?.id === 'game-winner-home-action';
  const winnerTutorialActionLocks = {
    replay: winnerInfoTutorialStepActive || winnerHomeTutorialStepActive,
    settings: winnerInfoTutorialStepActive || winnerHomeTutorialStepActive,
    menu: winnerInfoTutorialStepActive,
  };
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;
  const claimChecked = playerChecked[0] ?? Array(boardCellCount).fill(false);
  const claimOwners = playerClaimOwners[0] ?? Array(boardCellCount).fill(null);
  const bingoInputLocked = !isClaimMode && (
    winnerModalVisible
    || Boolean(winnerColor)
    || Boolean(pendingWinnerModalKey)
    || celebrationSplashVisible
    || celebrationConfettiVisible
  );

  useEffect(() => {
    if (!tutorialActive || tutorialStep?.target !== 'game.boardArea' || !onTutorialTargetLayout) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        boardAreaRef.current?.measureInWindow?.((x, y, width, height) => {
          onTutorialTargetLayout('game.boardArea', { x, y, width, height });
        });
      });
    });
  }, [
    compactTwoPlayerLayout,
    onTutorialTargetLayout,
    screenHeight,
    screenWidth,
    tutorialActive,
    tutorialStep?.target,
    winnerModalVisible,
  ]);

  useEffect(() => {
    if (!tutorialActive || tutorialStep?.id !== 'host-game-other-player' || !tutorialMode || !isCollectiveMode) {
      tutorialRemoteMarksPlayedRef.current = false;
      return undefined;
    }

    if (tutorialRemoteMarksPlayedRef.current) {
      return undefined;
    }

    tutorialRemoteMarksPlayedRef.current = true;
    const markIndexes = [
      boardGridSize,
      boardCellCount - 1,
      boardGridSize + 2,
    ]
      .filter((index, itemIndex, list) => index > 0 && list.indexOf(index) === itemIndex);
    const timeoutIds = markIndexes.map((cellIndex, stepIndex) => (
      setTimeout(() => {
        setPlayerChecked((current) => current.map((cells, playerIndex) => {
          if (playerIndex !== 0 || cells[cellIndex]) {
            return cells;
          }

          const nextCells = [...cells];
          nextCells[cellIndex] = true;
          return nextCells;
        }));
        triggerMiddleCarFeedback(1);
      }, 620 + stepIndex * 520)
    ));

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [
    boardCellCount,
    boardGridSize,
    isCollectiveMode,
    tutorialActive,
    tutorialMode,
    tutorialStep?.id,
  ]);

  const claimScores = useMemo(() => {
    const scoreMap = new Map(displayPlayers.map((player) => [player.playerId, 0]));

    claimOwners.forEach((ownerPlayerId) => {
      if (!ownerPlayerId) {
        return;
      }

      scoreMap.set(ownerPlayerId, (scoreMap.get(ownerPlayerId) ?? 0) + 1);
    });

    return displayPlayers.map((player, index) => ({
      ...player,
      originalIndex: index,
      tileCount: scoreMap.get(player.playerId) ?? 0,
      isLocal: localPlayerIds.has(player.playerId),
    }));
  }, [claimOwners, displayPlayers, localPlayerIds]);
  const rankedClaimPlayers = useMemo(
    () => buildClaimLeaderboard(claimScores),
    [claimScores]
  );
  const claimedTileCount = useMemo(
    () => claimOwners.filter(Boolean).length,
    [claimOwners]
  );
  const claimTargetTileCount = Math.min(CLAIM_TARGET_TILE_COUNT, boardCellCount);
  const claimGameFinished = isClaimMode && claimedTileCount >= claimTargetTileCount;
  const activeClaimPlayer = resolvedPlayers[0] ?? null;
  const screenBingoSplashSkin = (winnerIsRemote || compactTwoPlayerLayout) && celebrationSplashVisible && (winnerIndex != null || winnerColor)
    ? winnerColor ?? resolvedPlayerColors[winnerIndex] ?? 'groen'
    : null;
  const screenBingoSplashLayout = screenBingoSplashSkin
    ? getBingoBoardImageLayout(boardGridSize, false, screenBingoSplashSkin, boardViewport)
    : null;
  useEffect(() => {
    const splashAssets = resolvedPlayerColors
      .map((skin) => BINGO_SPLASH_BY_SKIN[skin])
      .filter(Boolean);

    if (splashAssets.length) {
      preloadImageAssets(splashAssets).catch(() => {});
    }
  }, [resolvedPlayerColors]);

  function getGameElapsedMs() {
    const parsedStartedAt = typeof startedAt === 'string' ? Date.parse(startedAt) : Number.NaN;
    const startTime = Number.isFinite(parsedStartedAt) ? parsedStartedAt : localGameStartedAtRef.current;
    return Math.max(0, Date.now() - startTime);
  }

  async function queueProgressSavePromptAfterSkinUnlock() {
    const supportsNativeProgressSavePrompt = Platform.OS === 'ios' || Platform.OS === 'android';

    if (!supportsNativeProgressSavePrompt || tutorialMode || accountLoading || user || progressSavePromptQueuedRef.current) {
      return;
    }

    try {
      const seenPrompt = await AsyncStorage.getItem(PROGRESS_SAVE_AFTER_SKIN_UNLOCK_PROMPT_STORAGE_KEY);

      if (seenPrompt || user || progressSavePromptQueuedRef.current) {
        return;
      }

      await AsyncStorage.setItem(PROGRESS_SAVE_AFTER_SKIN_UNLOCK_PROMPT_STORAGE_KEY, 'true');
      progressSavePromptQueuedRef.current = true;
    } catch (_error) {
      progressSavePromptQueuedRef.current = true;
    }
  }

  function recordFinishedChallengeProgress(completedBingos = []) {
    if (tutorialMode) {
      return;
    }

    if (finishedGameRecordedRef.current) {
      return;
    }

    finishedGameRecordedRef.current = true;

    const boards = isClaimMode
      ? [{
          checked: claimChecked,
          icons: sharedIcons,
          itemIds: sharedItems.map((item) => item.id),
        }]
      : playerChecked.map((checked, index) => ({
          checked,
          icons: playerIcons[index] ?? sharedIcons,
          itemIds: (playerItemEntries[index] ?? sharedItems).map((item) => item.id),
        }));
    const claimWinner = isClaimMode
      ? rankedClaimPlayers.find((player) => player.rank === 1 && player.tileCount > 0)
      : null;

    void recordFinishedGameForSkinChallenges({
      players: displayPlayers.length ? displayPlayers : resolvedPlayers,
      boards,
      completedBingos,
      elapsedMs: getGameElapsedMs(),
      syncType,
      theme: resolvedTheme,
      mode: normalizedMode,
      wincondition,
      isPremium,
      hostedOnline: syncType === 'live' && isLiveLobbyHost,
      claimWon: Boolean(claimWinner?.isLocal),
      finishedAt: Date.now(),
    }).then(async (result) => {
      const unlockedSkins = Array.isArray(result?.unlockedSkins) ? result.unlockedSkins : [];
      if (unlockedSkins.length > 0) {
        await queueProgressSavePromptAfterSkinUnlock();
        setPendingSkinUnlockAnnouncements(unlockedSkins);
      }
    });
  }

  function clearCelebrationTimeouts() {
    celebrationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    celebrationTimeoutsRef.current = [];
  }

  function resetWinnerCelebrationState() {
    clearCelebrationTimeouts();
    activeCelebrationKeysRef.current.clear();
    announcedLiveWinnerKeyRef.current = null;
    setCelebrationConfettiVisible(false);
    setCelebrationSplashVisible(false);
    setLineCelebrations([]);
    setPendingWinnerModalKey(null);
    setWinnerModalVisible(false);
    setWinnerColor(null);
    setWinnerIndex(null);
    setWinnerIsRemote(false);
    setPendingSkinUnlockAnnouncements([]);
    setSkinUnlockAnnouncement(null);
    progressSavePromptQueuedRef.current = false;
    setProgressSavePromptVisible(false);
    setSuppressedCheckPulseKeys({});
  }

  function stopWinnerCelebrationForAction() {
    suppressWinnerCelebrationRestartRef.current = true;
    resetWinnerCelebrationState();
  }

  function keepWinnerOverlayForRouteAction() {
    suppressWinnerCelebrationRestartRef.current = true;
  }

  function startWinnerRouteReveal(action, origin = {}, color = '#E03030') {
    if (winnerRouteRevealBusyRef.current) {
      return;
    }

    const revealOrigin = {
      x: origin.x ?? screenWidth / 2,
      y: origin.y ?? screenHeight / 2,
    };

    winnerRouteRevealBusyRef.current = true;
    pendingWinnerRouteActionRef.current = () => action?.(revealOrigin);
    setWinnerRouteReveal({
      color,
      origin: revealOrigin,
      key: Date.now(),
    });
  }

  useEffect(() => {
    if (!winnerRouteReveal.key) {
      return;
    }

    requestAnimationFrame(() => {
      winnerRouteRevealRef.current?.reveal();
    });
  }, [winnerRouteReveal.key]);

  function getPressOrigin(event) {
    return {
      x: event?.nativeEvent?.pageX ?? screenWidth / 2,
      y: event?.nativeEvent?.pageY ?? screenHeight / 2,
    };
  }

  function handleGameBack(event) {
    setBackConfirmVisible(true);
  }

  function confirmGameBack(event) {
    const origin = getPressOrigin(event);
    setBackConfirmVisible(false);
    startWinnerRouteReveal((revealOrigin) => {
      onGameBack?.({ ...revealOrigin, color: GAME_BACK_CONFIRM_REVEAL_COLOR });
    }, origin, GAME_BACK_CONFIRM_REVEAL_COLOR);
  }

  function shouldConfirmHostHomeMenu() {
    return liveSyncEnabled && isLiveLobbyHost && !tutorialMode;
  }

  async function requestWinnerHomeMenu(origin = {}) {
    if (shouldConfirmHostHomeMenu()) {
      setPendingHomeOrigin(origin);
      setHomeConfirmVisible(true);
      return;
    }

    await onBeforeWinnerMenu?.();
    keepWinnerOverlayForRouteAction();
    startWinnerRouteReveal((revealOrigin) => {
      onMenu?.(revealOrigin);
    }, origin, '#F5C400');
  }

  async function confirmWinnerHomeMenu(event) {
    const origin = pendingHomeOrigin ?? getPressOrigin(event);
    setHomeConfirmVisible(false);
    setPendingHomeOrigin(null);
    await onBeforeWinnerMenu?.();
    keepWinnerOverlayForRouteAction();
    startWinnerRouteReveal((revealOrigin) => {
      onMenu?.(revealOrigin);
    }, origin, '#F5C400');
  }

  function openCellInspect(cell) {
    inspectAnimationRef.current?.stop();
    inspectProgress.setValue(0);
    setInspectedCell(cell);
    inspectAnimationRef.current = Animated.timing(inspectProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    inspectAnimationRef.current.start(() => {
      inspectAnimationRef.current = null;
    });
  }

  function closeCellInspect() {
    if (!inspectedCell) {
      return;
    }

    inspectAnimationRef.current?.stop();
    inspectAnimationRef.current = Animated.timing(inspectProgress, {
      toValue: 0,
      duration: 230,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    inspectAnimationRef.current.start(({ finished }) => {
      if (finished) {
        setInspectedCell(null);
      }
      inspectAnimationRef.current = null;
    });
  }

  function setPlayerLineOverlay(playerIndex, line) {
    const orderedLine = orderWinningLineForDraw(line, boardGridSize);
    const lineKey = getLineKey(orderedLine, boardGridSize);

    setPlayerWinLines((current) => current.map((currentLines, currentIndex) => {
      if (currentIndex !== playerIndex || !orderedLine.length) {
        return currentLines;
      }

      const lines = Array.isArray(currentLines) ? currentLines : [];
      if (lines.some((existingLine) => getLineKey(existingLine, boardGridSize) === lineKey)) {
        return lines;
      }

      return [...lines, orderedLine];
    }));
  }

  function clearPlayerLineOverlay(playerIndex, celebrationId) {
    setLineCelebrations((current) => current.filter((celebration) => celebration.id !== celebrationId));
  }

  function triggerBingoFinalHaptic() {
    const hapticSteps = [
      { delay: 0, type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
      { delay: 85, type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
      { delay: 175, type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
      { delay: 285, type: 'notification', style: Haptics.NotificationFeedbackType.Success },
    ];

    hapticSteps.forEach((step) => {
      const timeoutId = setTimeout(() => {
        if (step.type === 'notification') {
          Haptics.notificationAsync(step.style);
        } else {
          Haptics.impactAsync(step.style);
        }
      }, step.delay);
      celebrationTimeoutsRef.current.push(timeoutId);
    });
  }

  function setPendingLocalBoardCell(pendingKey, value) {
    const expiresAt = Date.now() + 1500;
    pendingLocalBoardCellsRef.current.set(pendingKey, {
      ...value,
      expiresAt,
    });

    setTimeout(() => {
      const pendingCell = pendingLocalBoardCellsRef.current.get(pendingKey);
      if (pendingCell?.expiresAt === expiresAt) {
        pendingLocalBoardCellsRef.current.delete(pendingKey);
      }
    }, 1500);
  }

  function clearPendingLocalBoardCell(pendingKey) {
    pendingLocalBoardCellsRef.current.delete(pendingKey);
  }

  function detectLiveWinnerFromBoardState(boardState) {
    if (!liveBingoPlayers.length || winnerColor || winnerModalVisible || pendingWinnerModalKey) {
      return;
    }

    const localWinnerIndex = playerCheckedRef.current.findIndex((checked) => (
      findBingo(checked, actieveRegels, boardGridSize)
    ));

    if (localWinnerIndex >= 0) {
      return;
    }

    const remoteWinner = liveBingoPlayers
      .map((player, liveIndex) => {
        const playerId = getLocalPlayerKey(player, liveIndex);
        const entries = boardState[playerId];
        const checkedCells = Array.isArray(entries)
          ? entries.map((entry) => Boolean(entry?.checked))
          : null;
        const winningLine = checkedCells ? findBingo(checkedCells, actieveRegels, boardGridSize) : null;

        return {
          player,
          playerId,
          checkedCells,
          winningLine,
          isLocal: localPlayerIds.has(playerId),
        };
      })
      .find((candidate) => candidate.winningLine && !candidate.isLocal);

    if (!remoteWinner?.checkedCells) {
      return;
    }

    const winnerKey = `${remoteWinner.playerId}:${getLineKey(remoteWinner.winningLine, boardGridSize)}`;
    if (announcedLiveWinnerKeyRef.current === winnerKey) {
      return;
    }

    announcedLiveWinnerKeyRef.current = winnerKey;
    startWinnerCelebration(-1, remoteWinner.checkedCells, remoteWinner.winningLine, true, {
      remote: true,
      winnerSkin: remoteWinner.player?.skin ?? 'groen',
    });
  }

  function startWinnerCelebration(playerIndex, checkedCells, completedLine = null, isFinalBingo = true, options = {}) {
    const winnerSkin = options.winnerSkin ?? resolvedPlayerColors[playerIndex] ?? 'groen';
    const winnerSplashAsset = BINGO_SPLASH_BY_SKIN[winnerSkin];
    if (winnerSplashAsset) {
      preloadImageAssets([winnerSplashAsset]).catch(() => {});
    }
    const winningSequence = orderWinningLineForDraw(completedLine, boardGridSize).length
      ? orderWinningLineForDraw(completedLine, boardGridSize)
      : getPrimaryWinningSequence(checkedCells, actieveRegels, boardGridSize);

    if (!winningSequence.length) {
      if (isFinalBingo) {
        setWinnerColor(winnerSkin);
        setWinnerIndex(playerIndex);
        setWinnerIsRemote(Boolean(options.remote));
        setWinnerModalVisible(true);
      }
      return;
    }

    const celebrationSequence = winningSequence;
    const lineKey = getLineKey(celebrationSequence, boardGridSize);
    const activeCelebrationKey = `${playerIndex}:${lineKey}:${isFinalBingo ? 'win' : 'line'}`;

    if (activeCelebrationKeysRef.current.has(activeCelebrationKey)) {
      return;
    }

    activeCelebrationKeysRef.current.add(activeCelebrationKey);
    const winnerKey = `${playerIndex}:${lineKey}:${isFinalBingo ? 'win' : 'line'}:${Date.now()}`;
    const drawProgress = new Animated.Value(0);

    setPlayerLineOverlay(playerIndex, celebrationSequence);
    if (isFinalBingo) {
      setWinnerColor(winnerSkin);
      setWinnerIndex(playerIndex);
      setWinnerIsRemote(Boolean(options.remote));
      setWinnerModalVisible(false);
      setCelebrationConfettiVisible(false);
      setCelebrationSplashVisible(false);
      setPendingWinnerModalKey(winnerKey);
    }

    setLineCelebrations((current) => [...current, {
      id: winnerKey,
      playerIndex,
      sequence: celebrationSequence,
      activeStep: -1,
      progress: drawProgress,
    }]);

    Animated.timing(drawProgress, {
      toValue: 1,
      duration: BINGO_LINE_DRAW_DURATION_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();

    const stepDelay = celebrationSequence.length > 1
      ? BINGO_LINE_DRAW_DURATION_MS / (celebrationSequence.length - 1)
      : 0;

    celebrationSequence.forEach((_, stepIndex) => {
      const timeoutId = setTimeout(() => {
        const isFinalStep = stepIndex === celebrationSequence.length - 1;

        setLineCelebrations((current) => current.map((celebration) => (
          celebration.id === winnerKey
            ? { ...celebration, activeStep: stepIndex }
            : celebration
        )));
        playBingoLineStepSound(stepIndex);

        if (isFinalStep && isFinalBingo) {
          setCelebrationSplashVisible(true);
          setCelebrationConfettiVisible(true);
          playBingoCheerSound();
          triggerBingoFinalHaptic();
        }
      }, 70 + stepIndex * stepDelay);
      celebrationTimeoutsRef.current.push(timeoutId);
    });

    const celebrationTimeoutId = setTimeout(() => {
      activeCelebrationKeysRef.current.delete(activeCelebrationKey);
      clearPlayerLineOverlay(playerIndex, winnerKey);
    }, BINGO_LINE_DRAW_DURATION_MS + 360);
    celebrationTimeoutsRef.current.push(celebrationTimeoutId);
  }

  function applyLiveBoardState(boardState) {
    setPlayerChecked((current) => boardKeys.map((boardKey, index) => {
      const entries = boardState[boardKey];
      const cells = current[index] ?? Array(boardCellCount).fill(false);
      if (!entries) {
        return cells;
      }

      return entries.map((entry, entryIndex) => {
        const pendingKey = `${boardKey}:${entryIndex}`;
        const pendingCell = pendingLocalBoardCellsRef.current.get(pendingKey);
        const remoteChecked = Boolean(entry?.checked);

        if (pendingCell && pendingCell.expiresAt <= Date.now()) {
          pendingLocalBoardCellsRef.current.delete(pendingKey);
        }

        if (pendingLocalBoardCellsRef.current.has(pendingKey)) {
          return pendingCell.checked;
        }

        return remoteChecked;
      });
    }));

    setPlayerClaimOwners((current) => boardKeys.map((boardKey, index) => {
      const entries = boardState[boardKey];
      const owners = current[index] ?? Array(boardCellCount).fill(null);
      if (!entries) {
        return owners;
      }

      return entries.map((entry, entryIndex) => {
        const pendingKey = `${boardKey}:${entryIndex}`;
        const pendingCell = pendingLocalBoardCellsRef.current.get(pendingKey);
        const remoteChecked = Boolean(entry?.checked);

        if (pendingCell && pendingCell.expiresAt > Date.now()) {
          return pendingCell.checked ? pendingCell.playerId : null;
        }

        return remoteChecked ? (entry?.playerId ?? null) : null;
      });
    }));

    detectLiveWinnerFromBoardState(boardState);
  }

  useEffect(() => {
    if (!liveSyncEnabled) {
      return undefined;
    }

    void getBoardState(lobbyCode, boardCellCount).then((boardState) => {
      applyLiveBoardState(boardState);
    });

    return subscribeToBoardState(lobbyCode, (boardState) => {
      applyLiveBoardState(boardState);
    }, boardCellCount);
  }, [boardCellCount, boardKeys, liveSyncEnabled, lobbyCode]);

  useEffect(() => {
    playerCheckedRef.current = playerChecked;
  }, [playerChecked]);

  useEffect(() => {
    preloadPooledSoundEffect(BINGO_ITEM_CHECK_SOUND, BINGO_ITEM_CHECK_SOUND_POOL_SIZE);
    BINGO_LINE_STEP_SOUNDS.forEach((soundName) => {
      preloadPooledSoundEffect(soundName, BINGO_ITEM_CHECK_SOUND_POOL_SIZE);
    });
    preloadSoundEffect(BINGO_CHEER_SOUND);
    preloadSoundEffect(SKIN_UNLOCK_BELL_SOUND);
  }, []);

  useEffect(() => {
    if (!isCollectiveMode) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCollectiveGradientTick((current) => current + 1);
    }, 80);

    return () => {
      clearInterval(interval);
    };
  }, [isCollectiveMode]);

  useEffect(() => {
    if (!hasNearBingoHints) {
      nearBingoSpin.stopAnimation();
      nearBingoSpin.setValue(0);
      return undefined;
    }

    nearBingoSpin.setValue(0);
    const spin = Animated.loop(
      Animated.timing(nearBingoSpin, {
        toValue: 1,
        duration: 4600,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    spin.start();

    return () => {
      spin.stop();
    };
  }, [hasNearBingoHints, nearBingoSpin]);

  useEffect(() => {
    if (isClaimMode) {
      setPlayerWinLines(Array.from({ length: resolvedPlayerCount }, () => []));
      resetWinnerCelebrationState();
      return;
    }

    const nextWins = playerChecked.map((checked) => findBingo(checked, actieveRegels, boardGridSize));

    setPlayerWinLines(playerChecked.map((checked) =>
      getCompletedLines(checked, actieveRegels, boardGridSize)
        .map((line) => orderWinningLineForDraw(line, boardGridSize))
    ));

    const firstWinnerIndex = nextWins.findIndex(Boolean);
    if (firstWinnerIndex >= 0) {
      recordFinishedChallengeProgress([{
        playerIndex: firstWinnerIndex,
        skin: resolvedPlayerColors[firstWinnerIndex] ?? boardPlayers[firstWinnerIndex]?.skin,
      }]);

      if (suppressWinnerCelebrationRestartRef.current) {
        return;
      }

      if (!winnerModalVisible && !winnerColor) {
        startWinnerCelebration(firstWinnerIndex, playerChecked[firstWinnerIndex]);
      }
      return;
    }

    if (winnerIsRemote) {
      return;
    }

    suppressWinnerCelebrationRestartRef.current = false;

    if (winnerColor || winnerModalVisible) {
      resetWinnerCelebrationState();
    }
  }, [actieveRegels, boardGridSize, isClaimMode, playerChecked, resolvedPlayerColors, resolvedPlayerCount, winnerColor, winnerIsRemote, winnerModalVisible]);

  useEffect(() => {
    if (claimGameFinished) {
      recordFinishedChallengeProgress([]);
    }
  }, [claimGameFinished]);

  useEffect(() => {
    if (
      pendingSkinUnlockAnnouncements.length === 0
      || skinUnlockAnnouncement
      || !winnerModalVisible
      || isClaimMode
    ) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const [nextUnlock, ...remainingUnlocks] = pendingSkinUnlockAnnouncements;
      setSkinUnlockAnnouncement(nextUnlock);
      setPendingSkinUnlockAnnouncements(remainingUnlocks);
    }, WINNER_SKIN_UNLOCK_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isClaimMode, pendingSkinUnlockAnnouncements, skinUnlockAnnouncement, winnerModalVisible]);

  useEffect(() => {
    if (
      !tutorialActive
      || tutorialStep?.advanceOnAction !== 'game.bingoShown'
      || !winnerModalVisible
      || isClaimMode
    ) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onTutorialAction?.('game.bingoShown');
    }, 1350);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    isClaimMode,
    onTutorialAction,
    tutorialActive,
    tutorialStep?.advanceOnAction,
    winnerModalVisible,
  ]);

  useEffect(() => () => {
    clearCelebrationTimeouts();
  }, []);

  function playItemCheckSound() {
    void playPooledSoundEffect(BINGO_ITEM_CHECK_SOUND, settings, BINGO_ITEM_CHECK_SOUND_POOL_SIZE);
  }

  function playBingoLineStepSound(stepIndex) {
    const soundName = BINGO_LINE_STEP_SOUNDS[Math.min(stepIndex, BINGO_LINE_STEP_SOUNDS.length - 1)]
      ?? BINGO_ITEM_CHECK_SOUND;
    void playPooledSoundEffect(soundName, settings, BINGO_ITEM_CHECK_SOUND_POOL_SIZE);
  }

  function playBingoCheerSound() {
    void stopGameBackgroundMusicForBingo();
    void playSoundEffect(BINGO_CHEER_SOUND, settings);
  }

  function triggerMiddleCarFeedback(playerIndex) {
    if (!compactTwoPlayerLayout) {
      return;
    }

    setMiddleCarFeedbackKeys((current) => current.map((key, index) => (
      index === playerIndex ? key + 1 : key
    )));
  }

  async function handlePress(playerIndex, index) {
    if (liveSyncEnabled && liveConnectionOffline) {
      return;
    }

    if (isClaimMode) {
      if (claimGameFinished || claimChecked[index] || !activeClaimPlayer) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playItemCheckSound();
      const claimBoardKey = boardKeys[0];
      const claimPendingKey = `${claimBoardKey}:${index}`;

      setPlayerChecked((current) => {
        const next = current.map((cells) => [...cells]);
        next.forEach((cells) => {
          cells[index] = true;
        });
        playerCheckedRef.current = next;
        return next;
      });

      setPlayerClaimOwners((current) => current.map((owners) => {
        const nextOwners = [...owners];
        nextOwners[index] = activeClaimPlayer.playerId ?? null;
        return nextOwners;
      }));

      if (liveSyncEnabled && !liveConnectionOffline) {
        setPendingLocalBoardCell(claimPendingKey, {
          checked: true,
          playerId: activeClaimPlayer.playerId ?? null,
        });

        void setBoardCell({
          code: lobbyCode,
          boardKey: claimBoardKey,
          cellIndex: index,
          checked: true,
          playerId: activeClaimPlayer.playerId,
          boardSize: boardCellCount,
        }).then((syncedBoardState) => {
          if (syncedBoardState) {
            applyLiveBoardState(syncedBoardState);
          } else {
            clearPendingLocalBoardCell(claimPendingKey);
          }
        });
      }
      return;
    }

    if (bingoInputLocked) return;

    const activeBoardPlayer = boardPlayers[playerIndex] ?? resolvedPlayers[playerIndex];
    const canEditClassicBoard = !liveSyncEnabled
      || isCollectiveMode
      || localPlayerIds.has(getLocalPlayerKey(activeBoardPlayer, playerIndex));

    if (!canEditClassicBoard) {
      return;
    }

    const sharedPlayerIndex = isCollectiveMode ? 0 : playerIndex;
    const currentBoardState = playerCheckedRef.current?.[sharedPlayerIndex] ?? [];
    if (findBingo(currentBoardState, actieveRegels, boardGridSize)) return;

    const nextCheckedValue = !Boolean(currentBoardState?.[index]);
    const nextBoardState = [...currentBoardState];
    nextBoardState[index] = nextCheckedValue;
    const liveBoardKey = boardKeys[playerIndex];
    const pendingBoardKey = `${liveBoardKey}:${index}`;
    const nextOwnerPlayerId = nextCheckedValue
      ? getLocalPlayerKey(activeBoardPlayer, playerIndex)
      : null;
    const nextWinningLine = findBingo(nextBoardState, actieveRegels, boardGridSize);
    const newlyCompletedLines = nextCheckedValue
      ? getNewCompletedLines(currentBoardState, nextBoardState, actieveRegels, boardGridSize, index)
      : [];
    const createsBingoLine = nextCheckedValue && (newlyCompletedLines.length > 0 || Boolean(nextWinningLine));
    const suppressPulseBoardKey = `${sharedPlayerIndex}:${index}`;

    if (createsBingoLine) {
      setSuppressedCheckPulseKeys((current) => ({
        ...current,
        [suppressPulseBoardKey]: `${suppressPulseBoardKey}:${Date.now()}`,
      }));
    } else if (nextCheckedValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setSuppressedCheckPulseKeys((current) => {
        if (!current[suppressPulseBoardKey]) {
          return current;
        }

        const next = { ...current };
        delete next[suppressPulseBoardKey];
        return next;
      });
    }

    if (nextCheckedValue && !createsBingoLine) {
      playItemCheckSound();
    }

    if (nextCheckedValue) {
      triggerMiddleCarFeedback(playerIndex);
    }

    setPlayerChecked((current) => {
      const next = current.map((cells, currentIndex) => {
        if (!isCollectiveMode && currentIndex !== playerIndex) {
          return cells;
        }

        const nextCells = [...cells];
        nextCells[index] = nextCheckedValue;
        return nextCells;
      });
      playerCheckedRef.current = next;
      return next;
    });

    setPlayerClaimOwners((current) => current.map((owners, currentIndex) => {
      if (!isCollectiveMode && currentIndex !== playerIndex) {
        return owners;
      }

      const nextOwners = [...owners];
      nextOwners[index] = nextOwnerPlayerId;
      return nextOwners;
    }));

    if (liveSyncEnabled && !liveConnectionOffline) {
      setPendingLocalBoardCell(pendingBoardKey, {
        checked: nextCheckedValue,
        playerId: nextOwnerPlayerId,
      });

      void setBoardCell({
        code: lobbyCode,
        boardKey: liveBoardKey,
          cellIndex: index,
          checked: nextCheckedValue,
          playerId: activeBoardPlayer?.playerId,
          boardSize: boardCellCount,
        }).then((syncedBoardState) => {
        if (syncedBoardState) {
          applyLiveBoardState(syncedBoardState);
        } else {
          clearPendingLocalBoardCell(pendingBoardKey);
        }
      });
    }

    if (nextCheckedValue && newlyCompletedLines.length) {
      newlyCompletedLines.forEach((newlyCompletedLine, lineIndex) => {
        startWinnerCelebration(
          playerIndex,
          nextBoardState,
          newlyCompletedLine,
          Boolean(nextWinningLine) && lineIndex === newlyCompletedLines.length - 1
        );
      });
    } else if (nextCheckedValue && nextWinningLine) {
      startWinnerCelebration(playerIndex, nextBoardState, null, true);
    }
  }

	  function handleUndo(playerIndex, index) {
    if (bingoInputLocked) {
      return;
    }
    if (liveSyncEnabled && liveConnectionOffline) {
      return;
    }

    if (isClaimMode) {
      if (claimGameFinished || !claimChecked[index]) {
        return;
      }

      const ownerPlayerId = claimOwners[index];
      if (ownerPlayerId && activeClaimPlayer?.playerId && ownerPlayerId !== activeClaimPlayer.playerId) {
        return;
      }

      const claimBoardKey = boardKeys[0];
      const claimPendingKey = `${claimBoardKey}:${index}`;

      setPlayerChecked((current) => {
        const next = current.map((cells) => {
          const nextCells = [...cells];
          nextCells[index] = false;
          return nextCells;
        });
        playerCheckedRef.current = next;
        return next;
      });

      setPlayerClaimOwners((current) => current.map((owners) => {
        const nextOwners = [...owners];
        nextOwners[index] = null;
        return nextOwners;
      }));

      if (liveSyncEnabled && !liveConnectionOffline) {
        setPendingLocalBoardCell(claimPendingKey, {
          checked: false,
          playerId: null,
        });

        void setBoardCell({
          code: lobbyCode,
          boardKey: claimBoardKey,
          cellIndex: index,
          checked: false,
          playerId: null,
          boardSize: boardCellCount,
        }).then((syncedBoardState) => {
          if (syncedBoardState) {
            applyLiveBoardState(syncedBoardState);
          } else {
            clearPendingLocalBoardCell(claimPendingKey);
          }
        });
      }
      return;
    }

    const activeBoardPlayer = boardPlayers[playerIndex] ?? resolvedPlayers[playerIndex];
    const canEditClassicBoard = !liveSyncEnabled
      || isCollectiveMode
      || localPlayerIds.has(getLocalPlayerKey(activeBoardPlayer, playerIndex));

    if (!canEditClassicBoard) {
      return;
    }

    const sharedPlayerIndex = isCollectiveMode ? 0 : playerIndex;
    const currentBoardState = playerCheckedRef.current?.[sharedPlayerIndex] ?? [];
    if (!currentBoardState[index]) {
      return;
    }

    const liveBoardKey = boardKeys[playerIndex];
    const pendingBoardKey = `${liveBoardKey}:${index}`;
    const suppressPulseBoardKey = `${sharedPlayerIndex}:${index}`;

    setSuppressedCheckPulseKeys((current) => {
      if (!current[suppressPulseBoardKey]) {
        return current;
      }

      const next = { ...current };
      delete next[suppressPulseBoardKey];
      return next;
    });

    setPlayerChecked((current) => {
      const next = current.map((cells, currentIndex) => {
        if (!isCollectiveMode && currentIndex !== playerIndex) {
          return cells;
        }

        const nextCells = [...cells];
        nextCells[index] = false;
        return nextCells;
      });
      playerCheckedRef.current = next;
      return next;
    });

    setPlayerClaimOwners((current) => current.map((owners, currentIndex) => {
      if (!isCollectiveMode && currentIndex !== playerIndex) {
        return owners;
      }

      const nextOwners = [...owners];
      nextOwners[index] = null;
      return nextOwners;
    }));

    if (liveSyncEnabled && !liveConnectionOffline) {
      setPendingLocalBoardCell(pendingBoardKey, {
        checked: false,
        playerId: null,
      });

      void setBoardCell({
        code: lobbyCode,
        boardKey: liveBoardKey,
        cellIndex: index,
        checked: false,
        playerId: null,
        boardSize: boardCellCount,
      }).then((syncedBoardState) => {
        if (syncedBoardState) {
          applyLiveBoardState(syncedBoardState);
        } else {
          clearPendingLocalBoardCell(pendingBoardKey);
        }
      });
    }
  }

  function renderBoard(playerIndex) {
    const kleur = resolvedPlayerColors[playerIndex] ?? 'groen';
    const checked = playerChecked[playerIndex];
    const claimOwnersForBoard = playerClaimOwners[playerIndex];
    const icons = playerIcons[playerIndex] ?? sharedIcons;
    const winLines = Array.isArray(playerWinLines[playerIndex]) ? playerWinLines[playerIndex] : [];
    const checkedColor = PLAYER_HEX[kleur] ?? '#2E8B3F';
    const boardSkin = isCollectiveMode ? 'neutral' : kleur;
    const boardImage = BINGO_BOARD_IMAGES[boardSkin] ?? BINGO_BOARD_IMAGES.groen;
    const boardLayout = getBingoBoardImageLayout(boardGridSize, compactTwoPlayerLayout, boardSkin, boardViewport);
    const nearBingoCells = nearBingoHints[playerIndex] ?? new Set();
    const collectiveBoardGradient = isCollectiveMode
      ? getCollectiveBoardGradient(collectiveGradientPalette, boardGridSize, startedAt, collectiveGradientTick)
      : null;

    const lineOverlay = winLines.map((winLine) => {
      const orderedWinLine = orderWinningLineForDraw(winLine, boardGridSize);
      if (!orderedWinLine.length) {
        return null;
      }

      const lineKey = getLineKey(orderedWinLine, boardGridSize);
      const lineStartIndex = orderedWinLine[0] ?? winLine[0];
      const lineEndIndex = orderedWinLine[orderedWinLine.length - 1] ?? winLine[1];
      const a = {
        x: boardLayout.padding + (lineStartIndex % boardGridSize) * (boardLayout.cellSize + boardLayout.gap) + boardLayout.cellSize / 2,
        y: boardLayout.padding + Math.floor(lineStartIndex / boardGridSize) * (boardLayout.cellSize + boardLayout.gap) + boardLayout.cellSize / 2,
      };
      const b = {
        x: boardLayout.padding + (lineEndIndex % boardGridSize) * (boardLayout.cellSize + boardLayout.gap) + boardLayout.cellSize / 2,
        y: boardLayout.padding + Math.floor(lineEndIndex / boardGridSize) * (boardLayout.cellSize + boardLayout.gap) + boardLayout.cellSize / 2,
      };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const lineColors = getBingoLineColors(checkedColor);
      const activeLineCelebration = lineCelebrations.find((celebration) => (
        celebration.playerIndex === playerIndex
        && getLineKey(celebration.sequence, boardGridSize) === lineKey
      ));
      const trackLength = length + 16;
      const lineTrackHeight = Math.round(Math.max(18, Math.min(30, boardLayout.cellSize * 0.18)));
      const lineEdgeHeight = Math.round(lineTrackHeight * 0.78);
      const lineCoreHeight = Math.round(Math.max(6, lineTrackHeight * 0.28));
      const startScale = 16 / trackLength;
      const drawScale = activeLineCelebration
        ? activeLineCelebration.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [startScale, 1],
          })
        : 1;
      const drawTranslateX = activeLineCelebration
        ? activeLineCelebration.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-(trackLength - 16) / 2, 0],
          })
        : 0;
      const drawTransform = [
        { translateX: drawTranslateX },
        { scaleX: drawScale },
      ];
      return (
        <Animated.View
          key={lineKey}
          pointerEvents="none"
          style={[styles.lineTrack, {
            width: trackLength,
            height: lineTrackHeight,
            left: midX - trackLength / 2,
            top: midY - lineTrackHeight / 2,
            transform: [{ rotate: `${angle}deg` }],
          }]}
        >
          <Animated.View
            style={[
              styles.lineGlow,
              {
                width: trackLength,
                height: lineTrackHeight,
                backgroundColor: lineColors.glow,
                transform: drawTransform,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.lineEdge,
              {
                width: trackLength,
                top: Math.round((lineTrackHeight - lineEdgeHeight) / 2),
                height: lineEdgeHeight,
                backgroundColor: lineColors.edge,
                transform: drawTransform,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.lineCore,
              {
                width: trackLength,
                top: Math.round((lineTrackHeight - lineCoreHeight) / 2),
                height: lineCoreHeight,
                backgroundColor: lineColors.core,
                transform: drawTransform,
              },
            ]}
          />
        </Animated.View>
      );
    });
    const boardGridContent = (
      <>
        {icons.map((icon, iconIndex) => {
          const ownerPlayerId = claimOwnersForBoard?.[iconIndex];
          const ownerSkin = ownerPlayerId ? allKnownPlayers.get(ownerPlayerId)?.skin : null;
          const cellCheckedColor = isClaimMode && ownerSkin
            ? (PLAYER_HEX[ownerSkin] ?? checkedColor)
            : checkedColor;
          const ownerColor = ownerSkin ? PLAYER_HEX[ownerSkin] : null;
          const row = Math.floor(iconIndex / boardGridSize);
          const col = iconIndex % boardGridSize;
          const checkedGradient = isCollectiveMode
            ? {
                ...collectiveBoardGradient,
                board: {
                  size: boardLayout.gridPixelSize,
                  cellSize: boardLayout.cellSize,
                  cellIndex: iconIndex,
                  cellLeft: boardLayout.padding + col * (boardLayout.cellSize + boardLayout.gap),
                  cellTop: boardLayout.padding + row * (boardLayout.cellSize + boardLayout.gap),
                },
              }
            : null;
          const checkPulseBoardIndex = isCollectiveMode ? 0 : playerIndex;

          return (
            <BingoCell
              key={iconIndex}
              checked={checked[iconIndex]}
              checkedColor={cellCheckedColor}
              checkedGradient={checkedGradient}
              checkedBorderColor={isCollectiveMode && ownerColor ? ownerColor : undefined}
              icon={icon}
              nearBingoHighlight={nearBingoCells.has(iconIndex)}
              nearBingoProgress={nearBingoSpin}
              nearBingoGradient={isCollectiveMode ? checkedGradient : null}
              suppressCheckPulseKey={suppressedCheckPulseKeys[`${checkPulseBoardIndex}:${iconIndex}`]}
              celebrationPulseKey={
                lineCelebrations.find((celebration) => (
                  celebration.playerIndex === playerIndex
                  && celebration.sequence[celebration.activeStep] === iconIndex
                ))
                  ? `${lineCelebrations
                      .filter((celebration) => (
                        celebration.playerIndex === playerIndex
                        && celebration.sequence[celebration.activeStep] === iconIndex
                      ))
                      .map((celebration) => `${celebration.id}:${celebration.activeStep}`)
                      .join('|')}:${iconIndex}`
                  : null
              }
              onPress={() => {
                void handlePress(playerIndex, iconIndex);
              }}
              onUndo={() => {
                handleUndo(playerIndex, iconIndex);
              }}
              cellSize={boardLayout.cellSize}
              checkedFillInset={isCollectiveMode ? 1.5 : 0}
              tutorialTargetKey={tutorialActive && playerIndex === 0 && iconIndex === 0 ? 'game.cell.0' : null}
              onTutorialTargetLayout={onTutorialTargetLayout}
              onTutorialAction={tutorialStep?.target === 'game.cell.0' ? onTutorialAction : null}
            />
          );
        })}
        {lineOverlay}
      </>
    );

	    return (
	      <View
	        key={`${playerIndex}:${kleur}:${boardGridSize}`}
	        style={[
	          styles.playerSection,
          compactTwoPlayerLayout && styles.playerSectionCompact,
        ]}
      >
        {!isClaimMode && !compactTwoPlayerLayout && winLines.length > 0 && celebrationSplashVisible && winnerIndex === playerIndex && (
          <BingoSplash
            color={checkedColor}
            fontFamily={fredoka}
            skin={kleur}
            visibleKey={`${playerIndex}:${winLines.map((line) => getLineKey(line, boardGridSize)).join('|') || 'full'}`}
            width={boardLayout.gridPixelSize}
            compact={compactTwoPlayerLayout}
          />
        )}

        <View
          ref={playerIndex === 0 ? boardAreaRef : null}
          collapsable={playerIndex !== 0}
          style={styles.boardShell}
        >
          <ImageBackground
            source={boardImage}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.bingoBoardImageFrame,
              {
                width: boardLayout.boardSize,
                height: boardLayout.boardSize,
              },
            ]}
          >
            <View
              style={[
                styles.gridWrapper,
                styles.bingoBoardGridOverlay,
                {
                  left: boardLayout.gridLeft,
                  top: boardLayout.gridTop,
                  width: boardLayout.gridPixelSize,
                  height: boardLayout.gridPixelSize,
                  padding: boardLayout.padding,
                  gap: boardLayout.gap,
                },
              ]}
            >
              {boardGridContent}
            </View>
          </ImageBackground>
        </View>
      </View>
    );
  }

  function renderClaimBoard() {
    const fallbackSkin = activeClaimPlayer?.skin ?? resolvedPlayerColors[0] ?? 'groen';
    const fallbackColor = PLAYER_HEX[fallbackSkin] ?? '#2E8B3F';
    const boardImage = BINGO_BOARD_IMAGES.neutral;
    const boardLayout = getClaimBingoBoardImageLayout(boardGridSize, boardViewport);
    let remainingProgressTiles = claimTargetTileCount;
    const claimProgressSegments = claimScores
      .map((player) => {
        const tileCount = Math.min(Math.max(0, player.tileCount), remainingProgressTiles);
        remainingProgressTiles -= tileCount;

        return {
          playerId: player.playerId,
          tileCount,
          color: PLAYER_HEX[player.skin] ?? fallbackColor,
        };
      })
      .filter((segment) => segment.tileCount > 0);

    return (
      <View style={styles.claimContent}>
        <View style={styles.claimProgressCounter}>
          <Text
            style={[
              styles.claimProgressCounterText,
              { fontFamily: fredoka },
            ]}
          >
            {Math.min(claimedTileCount, claimTargetTileCount)} / {claimTargetTileCount}
          </Text>
          <View style={styles.claimProgressTrack}>
            {claimProgressSegments.map((segment) => (
              <View
                key={segment.playerId}
                style={[
                  styles.claimProgressSegment,
                  {
                    width: `${(segment.tileCount / claimTargetTileCount) * 100}%`,
                    backgroundColor: segment.color,
                  },
                ]}
              />
            ))}
          </View>
        </View>

	        <View key={`claim:${fallbackSkin}:${boardGridSize}`} style={styles.claimBoardWrap}>
          <ImageBackground
            source={boardImage}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.bingoBoardImageFrame,
              styles.claimBoardImageFrame,
              {
                width: boardLayout.boardSize,
                height: boardLayout.boardSize,
              },
            ]}
          >
            <View
              style={[
                styles.gridWrapper,
                styles.bingoBoardGridOverlay,
                {
                  left: boardLayout.gridLeft,
                  top: boardLayout.gridTop,
                  width: boardLayout.gridPixelSize,
                  height: boardLayout.gridPixelSize,
                  padding: boardLayout.padding,
                  gap: boardLayout.gap,
                },
              ]}
            >
              {sharedIcons.map((icon, iconIndex) => {
                const ownerPlayerId = claimOwners?.[iconIndex];
                const ownerSkin = ownerPlayerId ? allKnownPlayers.get(ownerPlayerId)?.skin : null;
                const canUndoClaimCell = !ownerPlayerId || ownerPlayerId === activeClaimPlayer?.playerId;
                const cellColor = ownerSkin
                  ? (PLAYER_HEX[ownerSkin] ?? fallbackColor)
                  : fallbackColor;

                return (
                  <BingoCell
                    key={iconIndex}
                    checked={claimChecked[iconIndex]}
                    checkedColor={cellColor}
                    icon={icon}
                    celebrationPulseKey={null}
                    onPress={() => {
                      void handlePress(0, iconIndex);
                    }}
                    onUndo={() => {
                      handleUndo(0, iconIndex);
                    }}
                    canUndo={canUndoClaimCell}
                    cellSize={boardLayout.cellSize}
                    checkedFillInset={0}
                    tutorialTargetKey={tutorialActive && iconIndex === 0 ? 'game.cell.0' : null}
                    onTutorialTargetLayout={onTutorialTargetLayout}
                    onTutorialAction={tutorialStep?.target === 'game.cell.0' ? onTutorialAction : null}
                  />
                );
              })}
            </View>
          </ImageBackground>
        </View>

      </View>
    );
  }

  const liveInspectedCell = useMemo(() => {
    if (!inspectedCell?.checkedGradient || !isCollectiveMode) {
      return inspectedCell;
    }

    return {
      ...inspectedCell,
      checkedGradient: {
        ...getCollectiveBoardGradient(collectiveGradientPalette, boardGridSize, startedAt, collectiveGradientTick),
        board: inspectedCell.checkedGradient.board,
      },
    };
  }, [
    boardGridSize,
    collectiveGradientPalette,
    collectiveGradientTick,
    inspectedCell,
    isCollectiveMode,
    startedAt,
  ]);

  return (
    <ImageBackground
      source={require('../assets/images/backgrounds/bingo-original-background.png')}
      resizeMode="cover"
      fadeDuration={0}
      style={styles.container}
    >
      <View style={styles.backgroundWash} />
      <GameBackButton onPress={handleGameBack} />
      <ClaimConfettiOverlay
        visible={celebrationConfettiVisible}
        winnerColor={PLAYER_HEX[winnerColor] ?? '#2E8B3F'}
        onAnimationEnd={() => {
          setCelebrationConfettiVisible(false);
          if (pendingWinnerModalKey) {
            setWinnerModalVisible(true);
            setPendingWinnerModalKey(null);
          }
        }}
      />
      <Modal
        visible={isClaimMode && claimGameFinished}
        transparent
        animationType="fade"
      >
        <View style={[styles.modalBackdrop, styles.claimResultBackdrop]}>
          <ClaimResultsPodium
            players={rankedClaimPlayers}
            fredoka={fredoka}
            canReplay={canReplay}
            settingsLabel={settingsLabel}
            confirmHomeMenu={shouldConfirmHostHomeMenu()}
            onBeforeWinnerMenu={onBeforeWinnerMenu}
            onMenu={requestWinnerHomeMenu}
            onReplay={onReplay}
            onSettings={onSettings}
          />
        </View>
      </Modal>
      <Modal
        visible={backConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBackConfirmVisible(false)}
      >
        <View style={[styles.modalBackdrop, styles.backConfirmBackdrop]}>
          <PopupPanel
            title={liveSyncEnabled && !isLiveLobbyHost ? 'Game verlaten?' : 'Spel stoppen?'}
            fontFamily={fredoka}
            actionsStyle={liveSyncEnabled && !isLiveLobbyHost ? styles.backConfirmActionsLifted : null}
            actions={(
              <>
                <View style={styles.backConfirmButtonWrap}>
                  <GlossyButton
                    label="Nee"
                    variant="red"
                    size="normal"
                    heightOverride={gameResponsiveMetrics.s(58, 52, gameResponsiveMetrics.isTablet ? 86 : 64)}
                    horizontalPadding={gameResponsiveMetrics.s(20, 18, gameResponsiveMetrics.isTablet ? 40 : 24)}
                    labelFontScale={gameResponsiveMetrics.isTablet ? 1.18 : 1}
                    onPress={() => setBackConfirmVisible(false)}
                  />
                </View>
                <View style={styles.backConfirmButtonWrap}>
                  <GlossyButton
                    label="Ja"
                    variant="green"
                    size="normal"
                    heightOverride={gameResponsiveMetrics.s(58, 52, gameResponsiveMetrics.isTablet ? 86 : 64)}
                    horizontalPadding={gameResponsiveMetrics.s(22, 18, gameResponsiveMetrics.isTablet ? 42 : 26)}
                    labelFontScale={gameResponsiveMetrics.isTablet ? 1.18 : 1}
                    onPress={confirmGameBack}
                  />
                </View>
              </>
            )}
          >
            {liveSyncEnabled && !isLiveLobbyHost
                ? 'Weet je zeker dat je deze game wilt verlaten? Je verlaat dan ook de lobby en gaat terug naar het hoofdmenu.'
                : liveSyncEnabled
                  ? 'Weet je zeker dat je terug wilt? Je huidige spel stopt dan en iedereen gaat terug naar de lobby.'
                  : 'Weet je zeker dat je deze bingo-sessie wilt stoppen?'}
          </PopupPanel>
        </View>
      </Modal>
      <Modal
        visible={homeConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setHomeConfirmVisible(false);
          setPendingHomeOrigin(null);
        }}
      >
        <View style={[styles.modalBackdrop, styles.backConfirmBackdrop]}>
          <PopupPanel
            title="Hoofdmenu?"
            fontFamily={fredoka}
            actions={(
              <>
                <View style={styles.backConfirmButtonWrap}>
                  <GlossyButton
                    label="Nee"
                    variant="red"
                    size="normal"
                    heightOverride={gameResponsiveMetrics.s(58, 52, gameResponsiveMetrics.isTablet ? 86 : 64)}
                    horizontalPadding={gameResponsiveMetrics.s(20, 18, gameResponsiveMetrics.isTablet ? 40 : 24)}
                    labelFontScale={gameResponsiveMetrics.isTablet ? 1.18 : 1}
                    onPress={() => {
                      setHomeConfirmVisible(false);
                      setPendingHomeOrigin(null);
                    }}
                  />
                </View>
                <View style={styles.backConfirmButtonWrap}>
                  <GlossyButton
                    label="Ja"
                    variant="green"
                    size="normal"
                    heightOverride={gameResponsiveMetrics.s(58, 52, gameResponsiveMetrics.isTablet ? 86 : 64)}
                    horizontalPadding={gameResponsiveMetrics.s(22, 18, gameResponsiveMetrics.isTablet ? 42 : 26)}
                    labelFontScale={gameResponsiveMetrics.isTablet ? 1.18 : 1}
                    onPress={confirmWinnerHomeMenu}
                  />
                </View>
              </>
            )}
          >
            Weet je zeker dat je naar het hoofdmenu wilt? De lobby wordt dan gestopt.
          </PopupPanel>
        </View>
      </Modal>

      <View style={styles.topControls} />

      <View style={styles.cardsColumn}>
        {isClaimMode ? renderClaimBoard() : compactTwoPlayerLayout ? (
          <View style={styles.twoPlayerStack}>
            {renderBoard(0)}
            <View style={styles.middleControlRow}>
              <MiddlePlayerCar
                skin={resolvedPlayerColors[0] ?? 'groen'}
                mirrored
                feedbackKey={middleCarFeedbackKeys[0] ?? 0}
              />
              <MiddlePlayerCar
                skin={resolvedPlayerColors[1] ?? 'blauw'}
                feedbackKey={middleCarFeedbackKeys[1] ?? 0}
              />
            </View>
            {renderBoard(1)}
          </View>
        ) : (
          <View style={styles.singlePlayerStack}>
            {Array.from({ length: resolvedPlayerCount }, (_, playerIndex) => renderBoard(playerIndex))}
          </View>
        )}
      </View>
      {screenBingoSplashSkin && screenBingoSplashLayout ? (
        <View pointerEvents="none" style={styles.twoPlayerBingoSplashLayer}>
          <BingoSplash
            color={PLAYER_HEX[screenBingoSplashSkin] ?? '#2E8B3F'}
            fontFamily={fredoka}
            skin={screenBingoSplashSkin}
            visibleKey={`screen:${winnerIndex}:${screenBingoSplashSkin}`}
            width={screenBingoSplashLayout.gridPixelSize}
            screenOverlay
          />
        </View>
      ) : null}
      {winnerModalVisible && !isClaimMode ? (
        <WinnerFocusBackdrop />
      ) : null}
      <ConnectionWarningOverlay
        visible={liveConnectionOffline}
        width={screenWidth}
        height={screenHeight}
      />
      {winnerModalVisible && !isClaimMode ? (
        <View pointerEvents="box-none" style={styles.winnerControlsLayer}>
          <WinnerActionOverlay
            skin={winnerColor}
            playerIndex={winnerIndex}
            fontFamily={fredoka}
            canReplay={canReplay}
            settingsLabel={settingsLabel}
            disabledActions={winnerTutorialActionLocks}
            onReplay={() => {
              if (tutorialStep?.id === 'game-winner-actions') {
                onTutorialAction?.('game.winnerMenuSelected');
              }
              if (tutorialStep?.id === 'game-winner-home-action') {
                return;
              }
              keepWinnerOverlayForRouteAction();
              startWinnerRouteReveal((revealOrigin) => {
                onReplay?.(revealOrigin);
              }, { x: screenWidth / 2, y: screenHeight / 2 }, GAME_BACK_CONFIRM_REVEAL_COLOR);
            }}
            onSettings={(origin) => {
              if (tutorialStep?.id === 'game-winner-actions') {
                onTutorialAction?.('game.winnerMenuSelected');
              }
              if (tutorialStep?.id === 'game-winner-home-action') {
                return;
              }
              keepWinnerOverlayForRouteAction();
              startWinnerRouteReveal((revealOrigin) => {
                onSettings?.(revealOrigin);
              }, origin, '#1A7BD4');
            }}
            onMenu={(origin) => {
              if (tutorialStep?.id === 'game-winner-actions' || tutorialStep?.id === 'game-winner-home-action') {
                onTutorialAction?.('game.winnerMenuSelected');
              }
              void requestWinnerHomeMenu(origin);
            }}
          />
        </View>
      ) : null}
      {skinUnlockAnnouncement ? (
        <SkinUnlockAnnouncement
          unlock={skinUnlockAnnouncement}
          fontFamily={fredoka}
          settings={settings}
          onDismiss={() => {
            setSkinUnlockAnnouncement(null);

            if (pendingSkinUnlockAnnouncements.length > 0) {
              return;
            }

            if (progressSavePromptQueuedRef.current) {
              progressSavePromptQueuedRef.current = false;
              setProgressSavePromptVisible(true);
            }
          }}
        />
      ) : null}
      <ProgressSaveAfterSkinUnlockPrompt
        visible={progressSavePromptVisible}
        fontFamily={fredoka}
        onClose={() => setProgressSavePromptVisible(false)}
      />
      <CellInspectOverlay
        cell={liveInspectedCell}
        progress={inspectProgress}
        onClose={closeCellInspect}
      />
      <CircularReveal
        key={`winner-route-cover-${winnerRouteReveal.key}`}
        ref={winnerRouteRevealRef}
        color={winnerRouteReveal.color}
        originX={winnerRouteReveal.origin.x}
        originY={winnerRouteReveal.origin.y}
        onComplete={() => {
          const pendingAction = pendingWinnerRouteActionRef.current;
          pendingWinnerRouteActionRef.current = null;
          winnerRouteRevealBusyRef.current = false;
          pendingAction?.();
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF4E8' },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 250, 242, 0.28)',
  },
  gameBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    elevation: 90,
  },
  gameBackButtonImage: {
    width: 52,
    height: 52,
  },
  gameBackButtonShadow: {
    position: 'absolute',
    tintColor: 'rgba(0, 0, 0, 0.32)',
    transform: [{ translateX: 2 }, { translateY: 3 }, { scale: 0.96 }],
    opacity: 0.34,
  },
  topControls: {
    height: TOP_CONTROLS_HEIGHT + 18,
  },
  cardsColumn: {
    flex: 1,
    paddingHorizontal: OUTER_PADDING,
    paddingBottom: OUTER_PADDING,
    paddingTop: 8,
    justifyContent: 'center',
  },
  twoPlayerStack: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 4,
  },
  singlePlayerStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  claimScoreboard: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 14,
  },
  claimScoreCard: {
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 2,
    borderRadius: 22,
  },
  claimScoreCardName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 2,
  },
  claimCarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
  },
  claimScoreCar: {
  },
  claimSparkLayer: {
    position: 'absolute',
  },
  claimSpark: {
    position: 'absolute',
    borderRadius: 999,
  },
  claimScoreValue: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -4,
  },
  claimBadgeDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    flexShrink: 0,
  },
  claimBoardWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBoardImageFrame: {
    marginBottom: 8,
  },
  claimProgressCounter: {
    minWidth: 136,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: 8,
  },
  claimProgressCounterText: {
    fontSize: 30,
    lineHeight: 34,
    color: '#FFFDF7',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(39, 57, 75, 0.52)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  claimProgressTrack: {
    width: 172,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 5,
    backgroundColor: 'rgba(255, 253, 247, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    flexDirection: 'row',
  },
  claimProgressSegment: {
    height: '100%',
  },
  playerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerSectionCompact: {
    justifyContent: 'center',
    marginBottom: -4,
  },
  boardShell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    position: 'relative',
  },
  bingoBoardImageFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  bingoBoardGridOverlay: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 3,
  },
  bingoSplashOverlay: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: -6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
    elevation: 8,
  },
  bingoSplashOverlayCompact: {
    marginBottom: -4,
  },
  bingoLogoBanner: {
    position: 'absolute',
    bottom: '100%',
    height: IS_TABLET_GAME ? Math.round(430 * Math.min(GAME_TABLET_SCALE, 1.18)) : 354,
    marginBottom: IS_TABLET_GAME ? -92 : -62,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 40,
    elevation: 40,
  },
  bingoLogoBannerScreen: {
    height: IS_TABLET_GAME ? Math.round(430 * Math.min(GAME_TABLET_SCALE, 1.18)) : 354,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 40,
    elevation: 40,
  },
  bingoLogoBannerCompact: {
    position: 'absolute',
    top: IS_TABLET_GAME ? -34 : -24,
    height: IS_TABLET_GAME ? 248 : 192,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 40,
    elevation: 40,
  },
  bingoLogoPulseWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bingoLogoLight: {
    position: 'absolute',
    width: '104%',
    height: '104%',
    top: '18%',
    opacity: 0.92,
  },
  bingoLogoLightCompact: {
    width: '98%',
    height: '98%',
    top: '20%',
  },
  bingoLogoLightRaised: {
    top: '10%',
  },
  bingoLogoLightRaisedCompact: {
    top: '12%',
  },
  bingoLogoImage: {
    width: '100%',
    height: '100%',
  },
  bingoBanner: {
    height: 60,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bingoBannerCompact: {
    height: 42,
    marginBottom: -2,
  },
  bingoBannerText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: 0,
  },
  bingoBannerTextCompact: {
    fontSize: 35,
    lineHeight: 42,
  },
  twoPlayerBingoSplashLayer: {
    position: 'absolute',
    top: IS_TABLET_GAME ? 40 : 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 34,
    elevation: 34,
  },
  middleControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    height: TWO_PLAYER_MIDDLE_ROW_HEIGHT,
    marginTop: 3,
    marginBottom: 3,
  },
  middlePlayerCarWrap: {
    width: 170,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    transform: [{ translateY: 7 }],
  },
  middlePlayerCar: {
    width: 170,
    height: 114,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellBorderOverlay: {
    position: 'absolute',
    borderWidth: 1.75,
    zIndex: 20,
  },
  cellMotionWrap: {
    zIndex: 4,
    overflow: 'visible',
  },
  nearBingoCellBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 24,
    elevation: 24,
  },
  checkedFillClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  checkedFillCircle: {
    position: 'absolute',
    overflow: 'hidden',
  },
  activeCollectiveCellGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  undoHoldClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 6,
    elevation: 6,
  },
  undoHoldCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFDF7',
  },
  inspectLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    elevation: 25,
  },
  inspectBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#07131C',
  },
  inspectCell: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 26,
  },
  inspectCellLabel: {
    position: 'absolute',
    color: '#FFFDF7',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    zIndex: 27,
    elevation: 27,
  },
  inspectGradientFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  inspectBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    zIndex: 20,
    elevation: 20,
  },
  spark: {
    position: 'absolute',
    width: 3,
    borderRadius: 999,
  },
  cellFlash: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 999,
  },
  cellIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cellIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 8,
  },
  lineTrack: {
    position: 'absolute',
    height: IS_TABLET_GAME ? 28 : 22,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 999,
    zIndex: 4,
    elevation: 4,
  },
  lineGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: IS_TABLET_GAME ? 28 : 22,
    borderRadius: 999,
    opacity: 0.32,
  },
  lineEdge: {
    position: 'absolute',
    left: 0,
    top: IS_TABLET_GAME ? 3 : 2,
    height: IS_TABLET_GAME ? 22 : 17,
    borderRadius: 999,
    opacity: 0.92,
  },
  lineCore: {
    position: 'absolute',
    left: 0,
    top: IS_TABLET_GAME ? 10 : 8,
    height: IS_TABLET_GAME ? 8 : 6,
    borderRadius: 999,
  },
  winnerFocusBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    elevation: 12,
    backgroundColor: 'rgba(7, 12, 18, 0.78)',
  },
  winnerControlsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32,
    elevation: 32,
  },
  skinUnlockLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 58,
    elevation: 58,
  },
  skinUnlockBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 18, 38, 0.76)',
  },
  skinUnlockDismissArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  skinUnlockContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinUnlockStage: {
    width: Math.min(width * (IS_TABLET_GAME ? 0.86 : 1.08), IS_TABLET_GAME ? 680 : 470),
    height: Math.min(width * (IS_TABLET_GAME ? 0.86 : 1.08), IS_TABLET_GAME ? 680 : 470) * 0.58,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginBottom: -8,
  },
  skinUnlockStar: {
    position: 'absolute',
  },
  skinUnlockCar: {
    width: '92%',
    height: '100%',
  },
  skinUnlockClosedLock: {
    position: 'absolute',
    width: IS_TABLET_GAME ? 152 : 120,
    height: IS_TABLET_GAME ? 152 : 120,
    top: '34%',
    left: '50%',
    marginLeft: IS_TABLET_GAME ? -76 : -60,
    marginTop: IS_TABLET_GAME ? -76 : -60,
    zIndex: 5,
  },
  skinUnlockOpenLock: {
    position: 'absolute',
    width: IS_TABLET_GAME ? 152 : 120,
    height: IS_TABLET_GAME ? 152 : 120,
    top: '34%',
    left: '50%',
    marginLeft: IS_TABLET_GAME ? -76 : -60,
    marginTop: IS_TABLET_GAME ? -76 : -60,
    zIndex: 6,
  },
  skinUnlockChallengeTextBlock: {
    width: Math.min(width - 22, IS_TABLET_GAME ? 650 : 620),
    minHeight: IS_TABLET_GAME ? 142 : 122,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 32, 52, 0.86)',
    borderWidth: 2,
    borderColor: 'rgba(136, 221, 255, 0.74)',
  },
  skinUnlockChallengeName: {
    width: '100%',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skinUnlockChallengeText: {
    width: '100%',
    marginTop: 4,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#BDEFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skinUnlockChallengeProgressRow: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skinUnlockChallengeProgressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  skinUnlockChallengeProgressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F5C400',
  },
  skinUnlockChallengeProgressText: {
    minWidth: 46,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#FFF7DD',
    textAlign: 'right',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 12, 18, 0.62)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
  },
  claimResultBackdrop: {
    paddingHorizontal: IS_TABLET_GAME ? 40 : 18,
  },
  backConfirmBackdrop: {
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(7, 12, 18, 0.68)',
  },
  progressSavePromptBackdrop: {
    justifyContent: 'center',
    padding: 0,
    backgroundColor: 'rgba(7, 12, 18, 0.68)',
  },
  progressSavePromptPanel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#032B72',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 18,
  },
  progressSavePromptPanelImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressSavePromptContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  progressSavePromptTitle: {
    width: '100%',
    color: '#17364A',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    marginBottom: 12,
  },
  progressSavePromptBody: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressSavePromptText: {
    width: '100%',
    color: '#315266',
    textAlign: 'center',
    letterSpacing: 0,
  },
  progressSavePromptError: {
    marginTop: 8,
    color: '#B83232',
    textAlign: 'center',
    letterSpacing: 0,
  },
  progressSavePromptFootnote: {
    color: '#6F8796',
    textAlign: 'center',
    letterSpacing: 0,
  },
  progressSavePromptActions: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressSavePromptButtonWrap: {
    width: '100%',
    maxWidth: 282,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSavePromptNoButtonWrap: {
    width: '58%',
  },
  backConfirmCard: {
    maxWidth: 360,
    paddingTop: 24,
    paddingBottom: 22,
  },
  backConfirmTitle: {
    marginBottom: 10,
    color: '#17364A',
  },
  backConfirmText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#315266',
    textAlign: 'center',
    marginBottom: 20,
  },
  backConfirmActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  backConfirmButtonWrap: {
    flex: 1,
    maxWidth: 132,
  },
  backConfirmActionsLifted: {
    transform: [{ translateY: -10 }],
  },
  winnerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Math.max(IS_TABLET_GAME ? 270 : 230, height * (IS_TABLET_GAME ? 0.34 : 0.31)),
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    zIndex: 14,
    elevation: 14,
  },
  winnerHero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: IS_TABLET_GAME ? 268 : 220,
    marginTop: IS_TABLET_GAME ? -2 : -8,
  },
  winnerHeroCar: {
    width: Math.min(width * (IS_TABLET_GAME ? 0.74 : 0.9), IS_TABLET_GAME ? 560 : 430),
    height: Math.min(width * (IS_TABLET_GAME ? 0.48 : 0.56), IS_TABLET_GAME ? 360 : 270),
  },
  winnerDetails: {
    width: '100%',
    alignItems: 'center',
    marginTop: -8,
  },
  winnerButtonStack: {
    width: '100%',
    alignItems: 'center',
    gap: IS_TABLET_GAME ? 22 : 16,
  },
  winnerMenuButtonWrap: {
    width: Math.min(width * (IS_TABLET_GAME ? 0.52 : 0.62), IS_TABLET_GAME ? 360 : 282),
    alignSelf: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFDF7',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 30,
    color: '#2D2B55',
    marginBottom: 18,
  },
  claimResultModalCard: {
    maxWidth: 640,
    marginTop: Math.max(44, height * 0.08),
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  claimWinnerHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 2,
  },
  claimResultTitle: {
    fontSize: 26,
    marginBottom: 0,
    color: '#111827',
  },
  claimWinnerNameWrap: {
    width: '100%',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  claimWinnerDots: {
    position: 'absolute',
    fontSize: 34,
    lineHeight: 40,
    color: '#7B8794',
    letterSpacing: 2,
    textAlign: 'center',
  },
  claimWinnerName: {
    width: '100%',
    fontSize: 32,
    lineHeight: 38,
    color: '#111827',
    textAlign: 'center',
  },
  claimWinnerNameJoiner: {
    color: '#111827',
  },
  claimResultStage: {
    width: '100%',
    minHeight: 300,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 6,
    marginBottom: 4,
    overflow: 'visible',
  },
  claimResultStageCrowded: {
    gap: 0,
    paddingHorizontal: 8,
    marginTop: -6,
  },
  claimConfettiForeground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    zIndex: 30,
    elevation: 30,
  },
  claimPodiumLane: {
    flex: 1,
    maxWidth: 132,
    alignItems: 'center',
  },
  claimPodiumLaneMedium: {
    maxWidth: 148,
  },
  claimPodiumLaneCrowded: {
    maxWidth: 86,
    minWidth: 0,
  },
  claimPodiumName: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  claimPodiumStage: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  claimPodiumAssetClip: {
    position: 'absolute',
    width: '96%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  claimPodiumAssetClipMedium: {
    width: '110%',
  },
  claimPodiumAssetImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 232,
  },
  claimPodiumAssetScore: {
    position: 'absolute',
    bottom: 0,
    fontSize: 20,
    lineHeight: 24,
  },
  claimPodiumScoreBlock: {
    width: 92,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    backgroundColor: '#F7EEDC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C99B57',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  claimPodiumGrowBlock: {
    position: 'absolute',
    bottom: 54,
    width: '68%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  claimPodiumGrowBlockMedium: {
    width: '78%',
  },
  claimPodiumShaftGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  claimPodiumTopCap: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: 0,
    height: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    opacity: 0.8,
  },
  claimPodiumGrowGloss: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: 5,
    height: 10,
    borderRadius: 999,
    opacity: 0.38,
  },
  claimPodiumShaftHighlight: {
    position: 'absolute',
    left: '29%',
    top: 20,
    bottom: 8,
    width: 7,
    borderRadius: 999,
    opacity: 0.22,
  },
  claimPodiumShaftGroove: {
    position: 'absolute',
    top: 22,
    bottom: 8,
    width: 3,
    borderRadius: 999,
    opacity: 0.18,
  },
  claimPodiumShaftGrooveLeft: {
    left: '18%',
  },
  claimPodiumShaftGrooveRight: {
    right: '18%',
  },
  claimPodiumScore: {
    fontSize: 28,
    color: '#111111',
    zIndex: 2,
    elevation: 2,
  },
  claimPodiumStack: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  claimPodiumCar: {
    width: 176,
    height: 128,
    marginBottom: -24,
  },
  claimPodiumCarMedium: {
    width: 126,
    height: 92,
    marginBottom: -14,
  },
  claimPodiumCarCrowded: {
    width: 76,
    height: 60,
    marginBottom: -8,
  },
  claimResultActions: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  claimResultGlossyButtonWrap: {
    flex: 1,
    maxWidth: 150,
  },
  claimModalCard: {
    maxWidth: 360,
  },
  claimModalTitle: {
    marginBottom: 8,
    color: '#163243',
  },
  claimModalSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#315266',
    textAlign: 'center',
    marginBottom: 18,
  },
  claimLeaderboard: {
    width: '100%',
    gap: 8,
  },
  claimLeaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F7F2E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  claimLeaderboardRowWinner: {
    backgroundColor: '#FFF3CD',
  },
  claimLeaderboardRank: {
    width: 42,
    fontSize: 18,
    color: '#163243',
  },
  claimLeaderboardPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  claimLeaderboardName: {
    flex: 1,
    fontSize: 16,
    color: '#163243',
  },
  claimLeaderboardCount: {
    minWidth: 32,
    fontSize: 22,
    textAlign: 'right',
  },
  waitForHostText: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(17, 40, 60, 0.78)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  winnerCarImage: {
    width: 360,
    height: 260,
    marginBottom: 18,
  },
  winnerCarImageMirrored: {
    transform: [{ scaleX: -1 }],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 6,
  },
  iconActionButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  homeActionButton: {
    backgroundColor: '#d91f16',
    borderColor: '#0f2b3c',
  },
  replayActionButton: {
    backgroundColor: '#15c255',
    borderColor: '#0f2b3c',
  },
  iconActionSymbol: {
    fontSize: 48,
    lineHeight: 50,
    color: '#000000',
    fontWeight: '700',
  },
});
