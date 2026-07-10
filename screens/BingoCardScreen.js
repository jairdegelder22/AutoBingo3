import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, StyleSheet, Text, View, Pressable,
  Image, ImageBackground, Dimensions,
} from 'react-native';
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
import { getRandomIcons } from './themeIcons';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getPlayerThemes, withDefaultPlayerNames } from './gameFlowConfig';
import { getBoardState, setBoardCell, subscribeToBoardState } from '../src/services/liveLobbyService';
import { getResponsiveMetrics } from '../src/utils/responsive';
import useOnlineConnectionStatus from '../src/hooks/useOnlineConnectionStatus';
import ConnectionWarningOverlay from '../src/components/ConnectionWarningOverlay';

const STANDARD_GRID_SIZE = 4;
const CLAIM_GRID_SIZE = 4;
const { width, height } = Dimensions.get('window');
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
  neutral: require('../assets/images/bingo-boards/board-neutral.png'),
};
const GAME_BACK_CONFIRM_REVEAL_COLOR = '#159B3B';
const OUTER_PADDING = 12;
const TOP_CONTROLS_HEIGHT = 12;
const SECTION_GAP = 12;
const BINGO_LINE_DRAW_DURATION_MS = 1450;
const UNCHECK_HOLD_DURATION_MS = 3000;
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
  gridScale: IS_TABLET_GAME ? 0.94 : 0.98,
  boardScale: 1.14,
};
const BINGO_BOARD_SCALE_BY_SKIN = {
  rood: 1.14,
  groen: 1.14,
  default: 1.09,
};

function getBingoBoardImageLayout(gridSize, compact = false, skin = 'default') {
  const availableWidth = width - (compact ? OUTER_PADDING * 2 : 4);
  const availableHeight = compact
    ? ((height - TOP_CONTROLS_HEIGHT - SECTION_GAP - OUTER_PADDING * 2) / 2) - 12
    : height - TOP_CONTROLS_HEIGHT - 4;
  const boardSize = Math.floor(Math.max(240, Math.min(availableWidth, availableHeight)));
  const boardPlayArea = BINGO_BOARD_PLAY_AREA;
  const boardScale = BINGO_BOARD_SCALE_BY_SKIN[skin] ?? BINGO_BOARD_SCALE_BY_SKIN.default;
  const displayBoardSize = Math.floor(boardSize * boardScale);
  const playArea = {
    left: displayBoardSize * boardPlayArea.left,
    top: displayBoardSize * boardPlayArea.top,
    width: displayBoardSize * boardPlayArea.width,
    height: displayBoardSize * boardPlayArea.height,
  };
  const gap = boardPlayArea.gap ?? (compact ? 5 : 6);
  const padding = boardPlayArea.padding ?? (compact ? 7 : 9);
  const targetGridSize = Math.floor(Math.min(playArea.width, playArea.height) * (boardPlayArea.gridScale ?? 0.96));
  const cellSize = Math.floor((targetGridSize - padding * 2 - gap * (gridSize - 1)) / gridSize);
  const gridPixelSize = gridSize * cellSize + (gridSize - 1) * gap + padding * 2;

  return {
    boardSize: displayBoardSize,
    cellSize,
    gap,
    padding,
    gridPixelSize,
    gridLeft: playArea.left + (playArea.width - gridPixelSize) / 2,
    gridTop: playArea.top + (playArea.height - gridPixelSize) / 2,
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
  const sparkCount = 12;
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
  onPress,
  onUndo,
  canUndo = true,
  cellSize,
  celebrationPulseKey,
  suppressCheckPulseKey,
  checkedFillInset = 1.5,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const sparkProgress = useRef(new Animated.Value(0)).current;
  const fillRevealProgress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const undoProgress = useRef(new Animated.Value(0)).current;
  const [sparksVisible, setSparksVisible] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const previousChecked = useRef(checked);
  const previousCelebrationPulseKey = useRef(null);
  const previousSuppressCheckPulseKey = useRef(null);
  const pulseAnimationRef = useRef(null);
  const undoAnimationRef = useRef(null);
  const undoShakeAnimationRef = useRef(null);
  const undoPulseIntervalRef = useRef(null);
  const suppressNextPressRef = useRef(false);

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
      fillRevealProgress.stopAnimation();
      fillRevealProgress.setValue(0);
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
    scale.setValue(1);
    rotate.setValue(0);
    fillRevealProgress.stopAnimation();
    undoProgress.stopAnimation();
  }, [fillRevealProgress, rotate, scale, undoProgress]);

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

    if (reset) {
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

      if (!finished) {
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUndoVisible(false);
      undoProgress.setValue(0);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: true,
        }),
      ]).start();
      rotate.setValue(0);
      suppressNextPressRef.current = true;
      onUndo?.();
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
      style={[
        styles.cellMotionWrap,
        {
          transform: [{ scale }, { rotate: rotateDeg }],
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
                backgroundColor: checkedGradient ? 'transparent' : '#FFFDF7',
                borderColor: 'transparent',
              }
            : { backgroundColor: '#FFFDF7', borderColor: 'transparent' },
        ]}
        delayLongPress={320}
        onLongPress={handleLongPress}
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
          visible={checked && !checkedGradient}
        />
        <ActiveCollectiveCellGradient
          gradient={checkedGradient}
          cellSize={cellSize}
          borderRadius={cellBorderRadius}
          visible={Boolean(checked && checkedGradient)}
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
        <Image
          source={icon}
          style={[
            styles.cellIcon,
            {
              width: cellSize * 0.82,
              height: cellSize * 0.82,
            },
          ]}
          resizeMode="contain"
        />
        <CellFlash
          progress={sparkProgress}
          color={flashColor}
          cellSize={cellSize}
          visible={sparksVisible}
        />
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
  if (!cell) {
    return null;
  }

  const startSize = cell.rect.width || cell.cellSize;
  const targetSize = Math.min(
    Math.max(cell.cellSize * 2.82, 197),
    width - 48,
    height - 170
  );
  const targetLeft = (width - targetSize) / 2;
  const targetTop = (height - targetSize) / 2;
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
const BINGO_LIGHT_LOTTIE = require('../assets/animations/bingo-light.json');
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
};

function BingoSplash({ color, fontFamily, skin, visibleKey, width, compact = false }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const logoSplash = BINGO_SPLASH_BY_SKIN[skin] ?? null;

  useEffect(() => {
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
  }, [entrance, pulse, visibleKey]);

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
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bingoLogoBanner,
          compact && styles.bingoLogoBannerCompact,
          {
            width: width * (compact ? 3.36 : 3.96),
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <LottieView
          key={`bingo-light:${visibleKey}`}
          source={BINGO_LIGHT_LOTTIE}
          autoPlay
          loop={false}
          resizeMode="contain"
          style={[
            styles.bingoLogoLight,
            compact && styles.bingoLogoLightCompact,
          ]}
        />
        <Animated.View style={[styles.bingoLogoPulseWrap, { transform: [{ scale: pulse }] }]}>
          <Image
            source={logoSplash}
            resizeMode="contain"
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
  onReplay,
  onSettings,
  onMenu,
}) {
  const latestPressPointRef = useRef({ x: width / 2, y: height / 2 });
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
    <View style={styles.winnerOverlay}>
      <Animated.View
        style={[
          styles.winnerHero,
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
            mirrorCar && styles.winnerCarImageMirrored,
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.winnerDetails}>
        <View style={styles.winnerButtonStack}>
          <WinnerMenuButton
            progress={playButtonProgress}
            disabled={!canReplay}
            variant="green"
            onPress={onReplay}
            fontFamily={fontFamily}
            label="Play"
          />
          <WinnerMenuButton
            progress={settingsButtonProgress}
            variant="blue"
            onPress={onSettings}
            onPressIn={rememberPressPoint}
            fontFamily={fontFamily}
            label={settingsLabel}
            getPressOrigin={() => latestPressPointRef.current}
          />
          <WinnerMenuButton
            progress={homeButtonProgress}
            variant="yellow"
            onPress={onMenu}
            onPressIn={rememberPressPoint}
            fontFamily={fontFamily}
            label="Home"
            getPressOrigin={() => latestPressPointRef.current}
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
  getPressOrigin,
}) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  return (
    <Animated.View
      style={[
        styles.winnerMenuButtonWrap,
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
        heightOverride={IS_TABLET_GAME ? 108 : 84}
        horizontalPadding={IS_TABLET_GAME ? (label.length > 8 ? 30 : 44) : (label.length > 8 ? 18 : 30)}
        labelFontScale={IS_TABLET_GAME ? 1.12 : 1}
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

const ClaimConfettiOverlay = memo(function ClaimConfettiOverlay({
  visible,
  winnerColor,
  winnerColors,
  onAnimationEnd,
}) {
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
        origin={{ x: width / 2, y: 12 }}
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

function ClaimResultsPodium({ players, fredoka, canReplay, settingsLabel = 'Instellingen', onMenu, onReplay, onSettings }) {
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
  const latestPressPointRef = useRef({ x: width / 2, y: height / 2 });
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
    origin: { x: width / 2, y: height / 2 },
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
      x: origin.x ?? width / 2,
      y: origin.y ?? height / 2,
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
              )) : 'Speler'}
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
                      <View style={[
                        styles.claimPodiumScoreBlock,
                        isMediumPodium && styles.claimPodiumScoreBlockMedium,
                      ]}>
                        <LinearGradient
                          pointerEvents="none"
                          colors={[
                            mixHex(playerColor, '#ffffff', 0.46),
                            playerColor,
                            darkenHex(playerColor, 0.68),
                          ]}
                          locations={[0, 0.48, 1]}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={[
                            styles.claimPodiumGlossyBase,
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.claimPodiumGlossyFace,
                            { backgroundColor: playerColor },
                          ]}
                        />
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
          label="Play"
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
          label="Home"
          onPressIn={rememberPressPoint}
          getPressOrigin={() => latestPressPointRef.current}
          onPress={() => {
              startClaimRouteReveal((revealOrigin) => {
                setShowConfetti(false);
                onMenu?.(revealOrigin);
              }, latestPressPointRef.current, '#F5C400');
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

function isBotPlayer(player) {
  return typeof player?.playerId === 'string' && player.playerId.startsWith('bot-');
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
  aantalSpelersOpDitApparaat,
  kaartOpzet,
  onGameBack,
  onMenu,
  onReplay,
  onSettings,
  settingsLabel = 'Instellingen',
  canReplay = true,
  isLiveLobbyHost = true,
}) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const normalizedMode = typeof modus === 'string' ? modus.toLowerCase() : '';
  const isCollectiveMode = normalizedMode === 'collectief';
  const isClaimMode = normalizedMode === 'claim';
  const boardGridSize = isClaimMode ? CLAIM_GRID_SIZE : STANDARD_GRID_SIZE;
  const boardCellCount = boardGridSize * boardGridSize;
  const resolvedTheme = thema ?? theme ?? 'snelweg';
  const resolvedPlayers = useMemo(
    () => withDefaultPlayerNames(
      spelers?.length
        ? spelers
        : Array.from({ length: aantalSpelersOpDitApparaat ?? playerCount ?? 1 }, (_, index) => ({
            naam: playerNames?.[index] ?? `Speler ${index + 1}`,
            skin: playerColors?.[index] ?? 'groen',
          }))
    ),
    [aantalSpelersOpDitApparaat, playerColors, playerCount, playerNames, spelers]
  );
  const resolvedPlayerCount = resolvedPlayers.length || aantalSpelersOpDitApparaat || playerCount || 1;
  const resolvedPlayerColors = useMemo(
    () => resolvedPlayers.map((player, index) => player.skin ?? playerColors?.[index] ?? 'groen'),
    [playerColors, resolvedPlayers]
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
  const liveSyncEnabled = syncType === 'live' && Boolean(lobbyCode);
  const connectionStatus = useOnlineConnectionStatus(liveSyncEnabled);
  const liveConnectionOffline = liveSyncEnabled && connectionStatus.isOffline;
  const compactTwoPlayerLayout = !isClaimMode && resolvedPlayerCount >= 2;
  const boardKeys = useMemo(
    () => resolvedPlayers.map((player, index) => {
      if (isCollectiveMode || isClaimMode) {
        return 'shared:0';
      }

      return player.playerId ?? `local:${index}`;
    }),
    [isClaimMode, isCollectiveMode, resolvedPlayers]
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
  const [sharedIcons] = useState(() => getRandomIcons(resolvedTheme, boardCellCount, resolvedSeed));
  const [playerIcons] = useState(() =>
    kaartOpzet === 'ander-thema'
      ? derivedThemes.map((playerTheme, index) => getRandomIcons(playerTheme, boardCellCount, resolvedSeed + index))
      : actieveRegels.sharedCards
        ? Array.from({ length: resolvedPlayerCount }, () => sharedIcons)
        : Array.from({ length: resolvedPlayerCount }, (_, index) => getRandomIcons(resolvedTheme, boardCellCount, resolvedSeed + index))
  );
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(boardCellCount).fill(false))
  );
  const [playerClaimOwners, setPlayerClaimOwners] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(boardCellCount).fill(null))
  );
  const [playerWinLines, setPlayerWinLines] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => [])
  );
  const [winnerColor, setWinnerColor] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerRouteReveal, setWinnerRouteReveal] = useState({
    color: '#E03030',
    origin: { x: width / 2, y: height / 2 },
    key: 0,
  });
  const [lineCelebrations, setLineCelebrations] = useState([]);
  const [celebrationConfettiVisible, setCelebrationConfettiVisible] = useState(false);
  const [celebrationSplashVisible, setCelebrationSplashVisible] = useState(false);
  const [pendingWinnerModalKey, setPendingWinnerModalKey] = useState(null);
  const [inspectedCell, setInspectedCell] = useState(null);
  const [backConfirmVisible, setBackConfirmVisible] = useState(false);
  const [suppressedCheckPulseKeys, setSuppressedCheckPulseKeys] = useState({});
  const [collectiveGradientTick, setCollectiveGradientTick] = useState(0);
  const inspectProgress = useRef(new Animated.Value(0)).current;
  const inspectAnimationRef = useRef(null);
  const playerCheckedRef = useRef(playerChecked);
  const pendingLocalBoardCellsRef = useRef(new Map());
  const celebrationTimeoutsRef = useRef([]);
  const activeCelebrationKeysRef = useRef(new Set());
  const winnerRouteRevealRef = useRef(null);
  const pendingWinnerRouteActionRef = useRef(null);
  const winnerRouteRevealBusyRef = useRef(false);
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;
  const claimChecked = playerChecked[0] ?? Array(boardCellCount).fill(false);
  const claimOwners = playerClaimOwners[0] ?? Array(boardCellCount).fill(null);
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
      isLocal: resolvedPlayers.some((localPlayer) => localPlayer.playerId === player.playerId),
    }));
  }, [claimOwners, displayPlayers, resolvedPlayers]);
  const rankedClaimPlayers = useMemo(
    () => buildClaimLeaderboard(claimScores),
    [claimScores]
  );
  const claimedTileCount = useMemo(
    () => claimOwners.filter(Boolean).length,
    [claimOwners]
  );
  const claimGameFinished = isClaimMode && claimedTileCount === boardCellCount;
  const activeClaimPlayer = resolvedPlayers[0] ?? null;
  const botClaimPlayers = useMemo(
    () => claimScores.filter((player) => isBotPlayer(player)),
    [claimScores]
  );
  const showBotScoreControls = __DEV__ && isClaimMode && botClaimPlayers.length > 0 && !claimGameFinished;

  function clearCelebrationTimeouts() {
    celebrationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    celebrationTimeoutsRef.current = [];
  }

  function resetWinnerCelebrationState() {
    clearCelebrationTimeouts();
    activeCelebrationKeysRef.current.clear();
    setCelebrationConfettiVisible(false);
    setCelebrationSplashVisible(false);
    setLineCelebrations([]);
    setPendingWinnerModalKey(null);
    setWinnerModalVisible(false);
    setWinnerColor(null);
    setWinnerIndex(null);
    setSuppressedCheckPulseKeys({});
  }

  function startWinnerRouteReveal(action, origin = {}, color = '#E03030') {
    if (winnerRouteRevealBusyRef.current) {
      return;
    }

    const revealOrigin = {
      x: origin.x ?? width / 2,
      y: origin.y ?? height / 2,
    };

    winnerRouteRevealBusyRef.current = true;
    pendingWinnerRouteActionRef.current = () => action?.(revealOrigin);
    setWinnerRouteReveal({
      color,
      origin: revealOrigin,
      key: Date.now(),
    });
  }

  function boostClaimScores(targetPlayers, amountPerPlayer = 1) {
    if (!isClaimMode || claimGameFinished || !targetPlayers.length) {
      return;
    }
    if (liveSyncEnabled && liveConnectionOffline) {
      return;
    }

    const freeIndexes = claimOwners
      .map((ownerPlayerId, index) => (ownerPlayerId ? -1 : index))
      .filter((index) => index >= 0);
    const boosts = [];

    targetPlayers.forEach((player) => {
      if (!player?.playerId) {
        return;
      }

      for (let boostIndex = 0; boostIndex < amountPerPlayer && freeIndexes.length > 0; boostIndex += 1) {
        const randomFreeIndex = Math.floor(Math.random() * freeIndexes.length);
        const [cellIndex] = freeIndexes.splice(randomFreeIndex, 1);
        boosts.push({
          cellIndex,
          playerId: player.playerId,
        });
      }
    });

    if (!boosts.length) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPlayerChecked((current) => {
      const next = current.map((cells) => {
        const nextCells = [...cells];
        boosts.forEach(({ cellIndex }) => {
          nextCells[cellIndex] = true;
        });
        return nextCells;
      });
      playerCheckedRef.current = next;
      return next;
    });

    setPlayerClaimOwners((current) => {
      const sourceOwners = current[0] ?? Array(boardCellCount).fill(null);
      const nextOwners = [...sourceOwners];

      boosts.forEach(({ cellIndex, playerId }) => {
        if (!nextOwners[cellIndex]) {
          nextOwners[cellIndex] = playerId;
        }
      });

      return current.map(() => [...nextOwners]);
    });

    if (liveSyncEnabled && !liveConnectionOffline) {
      const claimBoardKey = boardKeys[0];

      boosts.forEach(({ cellIndex, playerId }) => {
        const claimPendingKey = `${claimBoardKey}:${cellIndex}`;

        setPendingLocalBoardCell(claimPendingKey, {
          checked: true,
          playerId,
        });

        void setBoardCell({
          code: lobbyCode,
          boardKey: claimBoardKey,
          cellIndex,
          checked: true,
          playerId,
          boardSize: boardCellCount,
        }).then((syncedBoardState) => {
          if (syncedBoardState) {
            applyLiveBoardState(syncedBoardState);
          } else {
            clearPendingLocalBoardCell(claimPendingKey);
          }
        });
      });
    }
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
      x: event?.nativeEvent?.pageX ?? width / 2,
      y: event?.nativeEvent?.pageY ?? height / 2,
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

  function startWinnerCelebration(playerIndex, checkedCells, completedLine = null, isFinalBingo = true) {
    const winnerSkin = resolvedPlayerColors[playerIndex] ?? 'groen';
    const winningSequence = orderWinningLineForDraw(completedLine, boardGridSize).length
      ? orderWinningLineForDraw(completedLine, boardGridSize)
      : getPrimaryWinningSequence(checkedCells, actieveRegels, boardGridSize);

    if (!winningSequence.length) {
      if (isFinalBingo) {
        setWinnerColor(winnerSkin);
        setWinnerIndex(playerIndex);
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

        if (isFinalStep && isFinalBingo) {
          setCelebrationSplashVisible(true);
          setCelebrationConfettiVisible(true);
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
    setPlayerChecked((current) => current.map((cells, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return cells;
      }

      return entries.map((entry, entryIndex) => {
        const pendingKey = `${boardKeys[index]}:${entryIndex}`;
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

    setPlayerClaimOwners((current) => current.map((owners, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return owners;
      }

      return entries.map((entry, entryIndex) => {
        const pendingKey = `${boardKeys[index]}:${entryIndex}`;
        const pendingCell = pendingLocalBoardCellsRef.current.get(pendingKey);
        const remoteChecked = Boolean(entry?.checked);

        if (pendingCell && pendingCell.expiresAt > Date.now()) {
          return pendingCell.checked ? pendingCell.playerId : null;
        }

        return remoteChecked ? (entry?.playerId ?? null) : null;
      });
    }));
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
      if (!winnerModalVisible && !winnerColor) {
        startWinnerCelebration(firstWinnerIndex, playerChecked[firstWinnerIndex]);
      }
      return;
    }

    if (winnerColor || winnerModalVisible) {
      resetWinnerCelebrationState();
    }
  }, [actieveRegels, boardGridSize, isClaimMode, playerChecked, resolvedPlayerColors, resolvedPlayerCount, winnerColor, winnerModalVisible]);

  useEffect(() => () => {
    clearCelebrationTimeouts();
  }, []);

  async function handlePress(playerIndex, index) {
    if (liveSyncEnabled && liveConnectionOffline) {
      return;
    }

    if (isClaimMode) {
      if (claimGameFinished || claimChecked[index] || !activeClaimPlayer) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    if (winnerModalVisible) return;

    const sharedPlayerIndex = isCollectiveMode ? 0 : playerIndex;
    const currentBoardState = playerCheckedRef.current?.[sharedPlayerIndex] ?? [];
    if (findBingo(currentBoardState, actieveRegels, boardGridSize)) return;

    const nextCheckedValue = !Boolean(currentBoardState?.[index]);
    const nextBoardState = [...currentBoardState];
    nextBoardState[index] = nextCheckedValue;
    const liveBoardKey = boardKeys[playerIndex];
    const pendingBoardKey = `${liveBoardKey}:${index}`;
    const nextOwnerPlayerId = nextCheckedValue
      ? getLocalPlayerKey(resolvedPlayers[playerIndex], playerIndex)
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
        playerId: resolvedPlayers[playerIndex]?.playerId,
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
    if (winnerModalVisible) {
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
    const icons = playerIcons[playerIndex];
    const winLines = Array.isArray(playerWinLines[playerIndex]) ? playerWinLines[playerIndex] : [];
    const checkedColor = PLAYER_HEX[kleur] ?? '#2E8B3F';
    const boardSkin = isCollectiveMode ? 'neutral' : kleur;
    const boardImage = BINGO_BOARD_IMAGES[boardSkin] ?? BINGO_BOARD_IMAGES.groen;
    const boardLayout = getBingoBoardImageLayout(boardGridSize, compactTwoPlayerLayout, boardSkin);
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
            left: midX - trackLength / 2,
            top: midY - 9,
            transform: [{ rotate: `${angle}deg` }],
          }]}
        >
          <Animated.View
            style={[
              styles.lineGlow,
              {
                width: trackLength,
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
            />
          );
        })}
        {lineOverlay}
      </>
    );

    return (
      <View
        key={playerIndex}
        style={[
          styles.playerSection,
          compactTwoPlayerLayout && styles.playerSectionCompact,
        ]}
      >
        {!isClaimMode && winLines.length > 0 && celebrationSplashVisible && winnerIndex === playerIndex && (
          <BingoSplash
            color={checkedColor}
            fontFamily={fredoka}
            skin={kleur}
            visibleKey={`${playerIndex}:${winLines.map((line) => getLineKey(line, boardGridSize)).join('|') || 'full'}`}
            width={boardLayout.gridPixelSize}
            compact={compactTwoPlayerLayout}
          />
        )}

        <View style={styles.boardShell}>
          <ImageBackground
            source={boardImage}
            resizeMode="contain"
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
    const boardLayout = getBingoBoardImageLayout(boardGridSize, true, 'neutral');
    const claimPlayerCount = Math.max(1, claimScores.length);
    const claimColumns = claimPlayerCount >= 5 ? 3 : claimPlayerCount >= 3 ? 3 : claimPlayerCount;
    const claimScoreGap = claimPlayerCount >= 5 ? 2 : 8;
    const claimScoreboardWidth = Math.min(width - OUTER_PADDING * 2, 430);
    const claimCardWidth = Math.floor((claimScoreboardWidth - claimScoreGap * (claimColumns - 1)) / claimColumns);
    const claimCarWidth = Math.min(claimPlayerCount >= 5 ? 118 : 154, claimCardWidth + 18);
    const claimCarHeight = Math.round(claimCarWidth * 0.7);
    const claimCarMinHeight = Math.round(claimCarHeight * 0.78);
    const claimNameFontSize = claimPlayerCount >= 5 ? 13 : 15;
    const claimScoreFontSize = claimPlayerCount >= 5 ? 24 : 27;

    return (
      <View style={styles.claimContent}>
        <View
          style={[
            styles.claimScoreboard,
            {
              width: claimScoreboardWidth,
              gap: claimScoreGap,
              columnGap: claimScoreGap,
              rowGap: claimPlayerCount >= 5 ? 0 : 8,
              marginBottom: claimPlayerCount >= 5 ? 4 : 12,
            },
          ]}
        >
          {claimScores.map((player) => (
            <ClaimScoreCard
              key={player.playerId}
              player={player}
              fredoka={fredoka}
              cardWidth={claimCardWidth}
              carWidth={claimCarWidth}
              carHeight={claimCarHeight}
              carMinHeight={claimCarMinHeight}
              nameFontSize={claimNameFontSize}
              scoreFontSize={claimScoreFontSize}
            />
          ))}
        </View>

        <View style={styles.claimBoardWrap}>
          <ImageBackground
            source={boardImage}
            resizeMode="contain"
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
                  />
                );
              })}
            </View>
          </ImageBackground>
        </View>

        {showBotScoreControls && (
          <View style={styles.claimBotScoreControls}>
            <Text style={[styles.claimBotScoreTitle, { fontFamily: fredoka }]}>
              Botpunten
            </Text>
            <View style={styles.claimBotScoreButtonRow}>
              <Pressable
                style={styles.claimBotScoreButton}
                onPress={() => boostClaimScores(botClaimPlayers, 1)}
              >
                <Text style={[styles.claimBotScoreButtonText, { fontFamily: fredoka }]}>
                  Alle +1
                </Text>
              </Pressable>
              {botClaimPlayers.map((botPlayer) => (
                <Pressable
                  key={`bot-boost-${botPlayer.playerId}`}
                  style={styles.claimBotScoreButton}
                  onPress={() => boostClaimScores([botPlayer], 1)}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    style={[styles.claimBotScoreButtonText, { fontFamily: fredoka }]}
                  >
                    {botPlayer.naam} +1
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
        <View style={styles.modalBackdrop}>
          <ClaimResultsPodium
            players={rankedClaimPlayers}
            fredoka={fredoka}
            canReplay={canReplay}
            settingsLabel={settingsLabel}
            onMenu={onMenu}
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
                    heightOverride={IS_TABLET_GAME ? 86 : 58}
                    horizontalPadding={IS_TABLET_GAME ? 40 : 20}
                    labelFontScale={IS_TABLET_GAME ? 1.18 : 1}
                    onPress={() => setBackConfirmVisible(false)}
                  />
                </View>
                <View style={styles.backConfirmButtonWrap}>
                  <GlossyButton
                    label="Ja"
                    variant="green"
                    size="normal"
                    heightOverride={IS_TABLET_GAME ? 86 : 58}
                    horizontalPadding={IS_TABLET_GAME ? 42 : 22}
                    labelFontScale={IS_TABLET_GAME ? 1.18 : 1}
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

      <View style={styles.topControls} />

      <View style={styles.cardsColumn}>
        {isClaimMode ? renderClaimBoard() : compactTwoPlayerLayout ? (
          <View style={styles.twoPlayerStack}>
            {renderBoard(0)}
            <View style={styles.middleControlRow}>
              <Image
                source={PLAYER_IMAGES[resolvedPlayerColors[0]] ?? PLAYER_IMAGES.groen}
                style={[styles.middlePlayerCar, styles.middlePlayerCarMirrored]}
                resizeMode="contain"
              />
              <Image
                source={PLAYER_IMAGES[resolvedPlayerColors[1]] ?? PLAYER_IMAGES.blauw}
                style={styles.middlePlayerCar}
                resizeMode="contain"
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
      {winnerModalVisible && !isClaimMode ? (
        <WinnerFocusBackdrop />
      ) : null}
      <ConnectionWarningOverlay
        visible={liveConnectionOffline}
        width={width}
        height={height}
      />
      {winnerModalVisible && !isClaimMode ? (
        <View pointerEvents="box-none" style={styles.winnerControlsLayer}>
          <WinnerActionOverlay
            skin={winnerColor}
            playerIndex={winnerIndex}
            fontFamily={fredoka}
            canReplay={canReplay}
            settingsLabel={settingsLabel}
            onReplay={() => {
              resetWinnerCelebrationState();
              onReplay?.();
            }}
            onSettings={(origin) => {
              startWinnerRouteReveal((revealOrigin) => {
                resetWinnerCelebrationState();
                onSettings?.(revealOrigin);
              }, origin, '#1A7BD4');
            }}
            onMenu={(origin) => {
              startWinnerRouteReveal((revealOrigin) => {
                resetWinnerCelebrationState();
                onMenu?.(revealOrigin);
              }, origin, '#F5C400');
            }}
          />
        </View>
      ) : null}
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
    top: 18,
    left: 10,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    elevation: 90,
  },
  gameBackButtonImage: {
    width: 56,
    height: 56,
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
    marginBottom: 18,
  },
  claimBotScoreControls: {
    width: '92%',
    maxWidth: 420,
    marginTop: -6,
    alignItems: 'center',
  },
  claimBotScoreTitle: {
    fontSize: 13,
    lineHeight: 16,
    color: '#5C6472',
    marginBottom: 5,
  },
  claimBotScoreButtonRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  claimBotScoreButton: {
    minWidth: 74,
    maxWidth: 118,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  claimBotScoreButtonText: {
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  playerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerSectionCompact: {
    justifyContent: 'center',
    marginBottom: -6,
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
    overflow: 'visible',
    zIndex: 3,
    elevation: 3,
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
  bingoLogoBannerCompact: {
    height: IS_TABLET_GAME ? 292 : 228,
    marginBottom: IS_TABLET_GAME ? -64 : -42,
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
  middleControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    minHeight: 52,
    marginTop: -8,
    marginBottom: -12,
  },
  middlePlayerCar: {
    width: 104,
    height: 76,
    marginTop: 10,
  },
  middlePlayerCarMirrored: {
    transform: [{ scaleX: -1 }],
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cellBorderOverlay: {
    position: 'absolute',
    borderWidth: 2.25,
    zIndex: 20,
    elevation: 20,
  },
  cellMotionWrap: {
    zIndex: 4,
    elevation: 4,
    overflow: 'visible',
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
    zIndex: 8,
    elevation: 8,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 12, 18, 0.62)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
  },
  backConfirmBackdrop: {
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(7, 12, 18, 0.68)',
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
  claimResultTitle: {
    fontSize: 26,
    marginBottom: 0,
    color: '#111827',
  },
  claimWinnerHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 2,
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
    minHeight: 258,
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
    width: '94%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  claimPodiumScoreBlockMedium: {
    width: '104%',
  },
  claimPodiumGlossyBase: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  claimPodiumGlossyFace: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 5,
    height: 12,
    borderRadius: 999,
    opacity: 0.34,
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
