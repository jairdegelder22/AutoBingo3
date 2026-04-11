import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, StyleSheet, Text, View, TouchableOpacity,
  Image, ImageBackground, Dimensions,
} from 'react-native';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { getRandomIcons } from './themeIcons';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getPlayerThemes } from './gameFlowConfig';
import { getBoardState, setBoardCell, subscribeToBoardState } from '../src/services/liveLobbyService';

const STANDARD_GRID_SIZE = 4;
const CLAIM_GRID_SIZE = 4;
const { width, height } = Dimensions.get('window');
const OUTER_PADDING = 12;
const PADDING = 10;
const GAP = 8;
const TOP_CONTROLS_HEIGHT = 12;
const SECTION_GAP = 12;

function getBoardMetrics(gridSize, compact = false, boardHeightRatio = 2) {
  const availableBoardWidth = width - OUTER_PADDING * 2 - PADDING * 2 - GAP * (gridSize - 1);
  const availableBoardHeight = ((height - TOP_CONTROLS_HEIGHT - SECTION_GAP - OUTER_PADDING * 2) / boardHeightRatio)
    - PADDING * 2
    - GAP * (gridSize - 1);
  const baseCellSize = Math.floor(Math.min(
    availableBoardWidth / gridSize,
    availableBoardHeight / gridSize,
  ));
  const cellSize = compact ? Math.floor(baseCellSize * 0.94) : baseCellSize;
  const gap = compact ? 6 : GAP;
  const padding = compact ? 8 : PADDING;

  return {
    cellSize,
    gap,
    padding,
    gridPixelSize: gridSize * cellSize + (gridSize - 1) * gap + padding * 2,
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

function createSeededRandom(seed = 1) {
  let state = seed >>> 0;

  return function seededRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function ClaimSparkBurst({ progress, color, visible, seed = 1 }) {
  const sparkCount = 11;
  const centerX = 108;
  const centerY = 76;
  const baseRadius = 44;
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
    <View pointerEvents="none" style={styles.claimSparkLayer}>
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

function BingoCell({ checked, checkedColor, icon, onPress, cellSize }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const sparkProgress = useRef(new Animated.Value(0)).current;
  const [sparksVisible, setSparksVisible] = useState(false);
  const previousChecked = useRef(checked);
  const activeTouchIdsRef = useRef(new Set());

  useEffect(() => {
    if (!previousChecked.current && checked) {
      setSparksVisible(true);
      scale.setValue(1);
      rotate.setValue(0);
      sparkProgress.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.12,
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
            toValue: 1,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: -1,
            duration: 110,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0.65,
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
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSparksVisible(false);
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    previousChecked.current = checked;
  }, [checked, rotate, scale, sparkProgress]);

  const rotateDeg = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });
  const sparkColor = mixHex(checkedColor, '#ffffff', 0.28);
  const flashColor = mixHex(checkedColor, '#ffffff', 0.45);

  function handleTouchStart(event) {
    event.nativeEvent.changedTouches.forEach((touch) => {
      const touchId = touch.identifier ?? `${touch.pageX}-${touch.pageY}`;
      if (activeTouchIdsRef.current.has(touchId)) {
        return;
      }

      activeTouchIdsRef.current.add(touchId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    });
  }

  function handleTouchEnd(event) {
    event.nativeEvent.changedTouches.forEach((touch) => {
      const touchId = touch.identifier ?? `${touch.pageX}-${touch.pageY}`;
      activeTouchIdsRef.current.delete(touchId);
    });
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { rotate: rotateDeg }],
      }}
    >
      <View
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderRadius: Math.max(10, Math.round(cellSize * 0.18)),
          },
          checked
            ? { backgroundColor: checkedColor, borderColor: darkenHex(checkedColor) }
            : { backgroundColor: '#FFFDF7', borderColor: withAlpha(darkenHex(checkedColor, 0.88), 0.34) },
        ]}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
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
      </View>
    </Animated.View>
  );
}

function ClaimScoreCard({ player, fredoka }) {
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
    <View style={styles.claimScoreCard}>
      <Text
        style={[
          styles.claimScoreCardName,
          { fontFamily: fredoka, color: playerColor },
        ]}
        numberOfLines={1}
      >
        {player.naam}
      </Text>
      <View style={styles.claimCarWrap}>
        <Animated.Image
          source={PLAYER_IMAGES[player.skin] ?? PLAYER_IMAGES.groen}
          style={[
            styles.claimScoreCar,
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
        />
      </View>
      <Animated.Text
        style={[
          styles.claimScoreValue,
          {
            color: playerColor,
            fontFamily: fredoka,
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
  onAnimationEnd,
}) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.claimConfettiForeground}>
      <ConfettiCannon
        count={64}
        origin={{ x: width / 2, y: 12 }}
        autoStart
        fadeOut
        fallSpeed={2600}
        explosionSpeed={320}
        colors={[
          winnerColor,
          mixHex(winnerColor, '#ffffff', 0.16),
          mixHex(winnerColor, '#ffffff', 0.3),
          darkenHex(winnerColor, 0.88),
        ]}
        onAnimationEnd={onAnimationEnd}
      />
    </View>
  );
});

function ClaimResultsPodium({ players, fredoka, canReplay, onMenu, onReplay }) {
  const pillarDelay = 500;
  const pillarStagger = 80;
  const pillarDuration = 1380;
  const stageHeight = 250;
  const scoreBlockHeight = 54;
  const maxGrowHeight = 124;
  const podiumLiftStart = -6;
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
  const [showConfetti, setShowConfetti] = useState(false);

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
  }, [resultsKey, barProgressValues, carFloatValues, winnerRotateValues, winnerScaleValues]);

  return (
    <>
      <ClaimConfettiOverlay
        visible={showConfetti}
        winnerColor={winnerColor}
        onAnimationEnd={() => setShowConfetti(false)}
      />
      <View style={[styles.modalCard, styles.claimResultModalCard]}>
      <Text style={[styles.modalTitle, styles.claimResultTitle, { fontFamily: fredoka }]}>
        Bingo uitslag
      </Text>

      <View style={styles.claimResultStage}>
        {players.map((player, index) => {
          const playerColor = PLAYER_HEX[player.skin] ?? '#2E8B3F';
          const growHeight = barProgressValues[index];
          const totalPillarHeight = growHeight.interpolate({
            inputRange: [0, maxGrowHeight],
            outputRange: [scoreBlockHeight, scoreBlockHeight + maxGrowHeight],
            extrapolate: 'clamp',
          });
          const stackBottom = totalPillarHeight.interpolate({
            inputRange: [scoreBlockHeight, scoreBlockHeight + maxGrowHeight],
            outputRange: [scoreBlockHeight + podiumLiftStart, scoreBlockHeight + maxGrowHeight + podiumLiftStart],
            extrapolate: 'clamp',
          });
          return (
            <View key={`${player.playerId}-podium`} style={styles.claimPodiumLane}>
              <View style={[styles.claimPodiumStage, { height: stageHeight }]}>
                <View
                  style={[
                    styles.claimPodiumScoreBlock,
                    {
                      backgroundColor: playerColor,
                    },
                  ]}
                >
                  <ClaimPodiumCounter
                    value={player.tileCount}
                    progress={growHeight}
                    maxGrowHeight={maxGrowHeight}
                    fredoka={fredoka}
                  />
                </View>
                <Animated.View
                  style={[
                    styles.claimPodiumGrowBlock,
                    {
                      backgroundColor: playerColor,
                      height: growHeight,
                    },
                  ]}
                />
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
                  <Text
                    style={[
                      styles.claimPodiumName,
                      { color: playerColor, fontFamily: fredoka },
                    ]}
                    numberOfLines={1}
                  >
                    {player.naam}
                  </Text>
                  <Image
                    source={PLAYER_IMAGES[player.skin] ?? PLAYER_IMAGES.groen}
                    style={styles.claimPodiumCar}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.claimResultActions}>
        <TouchableOpacity
          style={[styles.claimResultButton, styles.claimResultHomeButton]}
          onPress={() => {
            setShowConfetti(false);
            onMenu?.();
          }}
        >
          <Text style={[styles.claimResultButtonText, { fontFamily: fredoka }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.claimResultButton,
            styles.claimResultReplayButton,
            !canReplay && styles.claimResultReplayButtonDisabled,
          ]}
          onPress={() => {
            if (canReplay) {
              setShowConfetti(false);
              onReplay?.();
            }
          }}
          disabled={!canReplay}
          activeOpacity={0.86}
        >
          <Text style={[styles.claimResultButtonText, { fontFamily: fredoka }]}>Opnieuw</Text>
        </TouchableOpacity>
      </View>
      {!canReplay ? (
        <Text style={styles.waitForHostText}>Wacht tot de host opnieuw start.</Text>
      ) : null}
      </View>
    </>
  );
}

function ClaimPodiumCounter({ value, progress, maxGrowHeight, fredoka }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(0);

    const listenerId = progress.addListener(({ value: latest }) => {
      const visibleStart = Math.min(10, Math.max(0, maxGrowHeight * 0.08));
      const adjustedMax = Math.max(1, maxGrowHeight - visibleStart);
      const ratio = maxGrowHeight <= 0
        ? 0
        : Math.max(0, Math.min(1, (latest - visibleStart) / adjustedMax));
      setDisplayValue(Math.round(value * ratio));
    });

    return () => {
      progress.removeListener(listenerId);
    };
  }, [maxGrowHeight, progress, value]);

  return (
    <Text style={[styles.claimPodiumScore, { fontFamily: fredoka }]}>
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

export default function BingoCardScreen({
  theme,
  thema,
  seed,
  syncType,
  modus,
  lobbyCode,
  liveLobbyPlayers,
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
  onBack,
  onMenu,
  onReplay,
  canReplay = true,
}) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const normalizedMode = typeof modus === 'string' ? modus.toLowerCase() : '';
  const isClaimMode = normalizedMode === 'claim';
  const boardGridSize = isClaimMode ? CLAIM_GRID_SIZE : STANDARD_GRID_SIZE;
  const boardCellCount = boardGridSize * boardGridSize;
  const resolvedTheme = thema ?? theme ?? 'snelweg';
  const resolvedPlayers = useMemo(
    () => (
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
  const compactTwoPlayerLayout = !isClaimMode && resolvedPlayerCount >= 2;
  const boardMetrics = useMemo(
    () => getBoardMetrics(boardGridSize, compactTwoPlayerLayout, 2),
    [boardGridSize, compactTwoPlayerLayout, isClaimMode]
  );
  const boardKeys = useMemo(
    () => resolvedPlayers.map((player, index) => {
      if (normalizedMode === 'collectief' || isClaimMode) {
        return 'shared:0';
      }

      return player.playerId ?? `local:${index}`;
    }),
    [isClaimMode, normalizedMode, resolvedPlayers]
  );
  const allKnownPlayers = useMemo(() => {
    const playerMap = new Map();

    [...(liveLobbyPlayers ?? []), ...resolvedPlayers].forEach((player, index) => {
      const playerId = player?.playerId ?? `local:${index}`;
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
  const [playerWinLines, setPlayerWinLines] = useState(Array(resolvedPlayerCount).fill(null));
  const [winnerColor, setWinnerColor] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const playerCheckedRef = useRef(playerChecked);
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;
  const resolvedCellSize = boardMetrics.cellSize;
  const resolvedGap = boardMetrics.gap;
  const resolvedPadding = boardMetrics.padding;
  const resolvedGridSize = boardMetrics.gridPixelSize;
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

  function applyLiveBoardState(boardState) {
    setPlayerChecked((current) => current.map((cells, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return cells;
      }

      return entries.map((entry, entryIndex) => (
        isClaimMode ? Boolean(entry?.checked) || Boolean(cells[entryIndex]) : Boolean(entry?.checked)
      ));
    }));

    setPlayerClaimOwners((current) => current.map((owners, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return owners;
      }

      return entries.map((entry, entryIndex) => (
        isClaimMode ? (entry?.playerId ?? owners[entryIndex] ?? null) : (entry?.playerId ?? null)
      ));
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
    if (isClaimMode) {
      setPlayerWinLines(Array(resolvedPlayerCount).fill(null));
      setWinnerColor(null);
      setWinnerIndex(null);
      return;
    }

    const nextWins = playerChecked.map((checked) => findBingo(checked, actieveRegels, boardGridSize));
    setPlayerWinLines(nextWins);

    const firstWinnerIndex = nextWins.findIndex(Boolean);
    if (firstWinnerIndex >= 0) {
      setWinnerColor(resolvedPlayerColors[firstWinnerIndex] ?? 'groen');
      setWinnerIndex(firstWinnerIndex);
      return;
    }

    setWinnerColor(null);
    setWinnerIndex(null);
  }, [actieveRegels, boardGridSize, isClaimMode, playerChecked, resolvedPlayerColors, resolvedPlayerCount]);

  async function handlePress(playerIndex, index) {
    if (isClaimMode) {
      if (claimGameFinished || claimChecked[index] || !activeClaimPlayer) {
        return;
      }

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

      if (liveSyncEnabled) {
        await setBoardCell({
          code: lobbyCode,
          boardKey: boardKeys[0],
          cellIndex: index,
          checked: true,
          playerId: activeClaimPlayer.playerId,
          boardSize: boardCellCount,
        });
      }
      return;
    }

    if (playerWinLines[playerIndex]) return;

    const nextCheckedValue = !Boolean(playerCheckedRef.current?.[playerIndex]?.[index]);

    setPlayerChecked((current) => {
      const next = current.map((cells, currentIndex) =>
        currentIndex === playerIndex ? [...cells] : cells
      );
      next[playerIndex][index] = nextCheckedValue;
      playerCheckedRef.current = next;
      return next;
    });

    setPlayerClaimOwners((current) => current.map((owners, currentIndex) => {
      if (currentIndex !== playerIndex) {
        return owners;
      }

      const nextOwners = [...owners];
      nextOwners[index] = nextCheckedValue
        ? (resolvedPlayers[playerIndex]?.playerId ?? null)
        : null;
      return nextOwners;
    }));

    if (liveSyncEnabled) {
      await setBoardCell({
        code: lobbyCode,
        boardKey: boardKeys[playerIndex],
        cellIndex: index,
        checked: nextCheckedValue,
        playerId: resolvedPlayers[playerIndex]?.playerId,
        boardSize: boardCellCount,
      });
    }
  }

  function renderBoard(playerIndex) {
    const kleur = resolvedPlayerColors[playerIndex] ?? 'groen';
    const checked = playerChecked[playerIndex];
    const claimOwnersForBoard = playerClaimOwners[playerIndex];
    const icons = playerIcons[playerIndex];
    const winLine = playerWinLines[playerIndex];
    const checkedColor = PLAYER_HEX[kleur] ?? '#2E8B3F';
    const boardFill = withAlpha(mixHex(checkedColor, '#ffffff', 0.86), 0.72);
    const boardBorder = checkedColor;

    let lineOverlay = null;
    if (Array.isArray(winLine)) {
      const a = {
        x: resolvedPadding + (winLine[0] % boardGridSize) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
        y: resolvedPadding + Math.floor(winLine[0] / boardGridSize) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
      };
      const b = {
        x: resolvedPadding + (winLine[1] % boardGridSize) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
        y: resolvedPadding + Math.floor(winLine[1] / boardGridSize) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
      };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      lineOverlay = (
        <View
          pointerEvents="none"
          style={[styles.line, {
            width: length,
            left: midX - length / 2,
            top: midY - 4,
            backgroundColor: checkedColor,
            transform: [{ rotate: `${angle}deg` }],
          }]}
        />
      );
    }

    return (
      <View
        key={playerIndex}
        style={[
          styles.playerSection,
          compactTwoPlayerLayout && styles.playerSectionCompact,
        ]}
      >
        <View style={styles.boardShell}>
          <View
            style={[
              styles.gridShell,
              {
                backgroundColor: boardFill,
                borderColor: boardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.gridWrapper,
                {
                  width: resolvedGridSize,
                  height: resolvedGridSize,
                  padding: resolvedPadding,
                  gap: resolvedGap,
                  backgroundColor: withAlpha(mixHex(checkedColor, '#ffffff', 0.84), 0.16),
                },
              ]}
            >
              {icons.map((icon, iconIndex) => {
                const ownerPlayerId = claimOwnersForBoard?.[iconIndex];
                const ownerSkin = ownerPlayerId ? allKnownPlayers.get(ownerPlayerId)?.skin : null;
                const cellCheckedColor = isClaimMode && ownerSkin
                  ? (PLAYER_HEX[ownerSkin] ?? checkedColor)
                  : checkedColor;

                return (
                  <BingoCell
                    key={iconIndex}
                    checked={checked[iconIndex]}
                    checkedColor={cellCheckedColor}
                    icon={icon}
                    onPress={() => {
                      void handlePress(playerIndex, iconIndex);
                    }}
                    cellSize={resolvedCellSize}
                  />
                );
              })}
              {lineOverlay}
            </View>
          </View>
        </View>

        {!isClaimMode && winLine && (
          <Text style={[styles.bingoText, { color: checkedColor, fontFamily: fredoka }]}>
            BINGO!
          </Text>
        )}
      </View>
    );
  }

  function renderClaimBoard() {
    const fallbackColor = PLAYER_HEX[activeClaimPlayer?.skin ?? resolvedPlayerColors[0] ?? 'groen'] ?? '#2E8B3F';
    const boardFill = withAlpha(mixHex(fallbackColor, '#ffffff', 0.9), 0.8);

    return (
      <View style={styles.claimContent}>
        <View style={styles.claimScoreboard}>
          {claimScores.map((player) => (
            <ClaimScoreCard
              key={player.playerId}
              player={player}
              fredoka={fredoka}
            />
          ))}
        </View>

        <View style={styles.claimBoardWrap}>
          <View
            style={[
              styles.gridShell,
              styles.claimGridShell,
              {
                backgroundColor: boardFill,
                borderColor: fallbackColor,
              },
            ]}
          >
            <View
              style={[
                styles.gridWrapper,
                {
                  width: resolvedGridSize,
                  height: resolvedGridSize,
                  padding: resolvedPadding,
                  gap: resolvedGap,
                  backgroundColor: withAlpha(mixHex(fallbackColor, '#ffffff', 0.9), 0.2),
                },
              ]}
            >
              {sharedIcons.map((icon, iconIndex) => {
                const ownerPlayerId = claimOwners?.[iconIndex];
                const ownerSkin = ownerPlayerId ? allKnownPlayers.get(ownerPlayerId)?.skin : null;
                const cellColor = ownerSkin
                  ? (PLAYER_HEX[ownerSkin] ?? fallbackColor)
                  : fallbackColor;

                return (
                  <BingoCell
                    key={iconIndex}
                    checked={claimChecked[iconIndex]}
                    checkedColor={cellColor}
                    icon={icon}
                    onPress={() => {
                      void handlePress(0, iconIndex);
                    }}
                    cellSize={resolvedCellSize}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.claimFooter}>
          <TouchableOpacity style={styles.middleHomeButton} onPress={() => onMenu?.()}>
            <Text style={[styles.middleHomeText, { fontFamily: fredoka }]}>HOME</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/backgrounds/bingo-original-background.png')}
      resizeMode="cover"
      style={styles.container}
    >
      <View style={styles.backgroundWash} />
      <Modal
        visible={isClaimMode ? claimGameFinished : (Boolean(winnerColor) && !isClaimMode)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isClaimMode) {
            setWinnerColor(null);
            setWinnerIndex(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          {isClaimMode ? (
            <ClaimResultsPodium
              players={rankedClaimPlayers}
              fredoka={fredoka}
              canReplay={canReplay}
              onMenu={onMenu}
              onReplay={onReplay}
            />
          ) : (
            <View style={styles.modalCard}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    fontFamily: fredoka,
                    color: PLAYER_HEX[winnerColor] ?? '#2D2B55',
                  },
                ]}
              >
                BINGO
              </Text>
              <Image
                source={PLAYER_IMAGES[winnerColor] ?? PLAYER_IMAGES.groen}
                style={[
                  styles.winnerCarImage,
                  winnerIndex === 0 && styles.winnerCarImageMirrored,
                ]}
                resizeMode="contain"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.iconActionButton, styles.homeActionButton]}
                  onPress={() => {
                    setWinnerColor(null);
                    setWinnerIndex(null);
                  onMenu?.();
                  }}
                >
                  <Text style={styles.iconActionSymbol}>⌂</Text>
                </TouchableOpacity>
                {canReplay ? (
                  <TouchableOpacity
                    style={[styles.iconActionButton, styles.replayActionButton]}
                    onPress={() => {
                      setWinnerColor(null);
                      setWinnerIndex(null);
                      onReplay?.();
                    }}
                  >
                    <Text style={styles.iconActionSymbol}>↻</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!canReplay ? (
                <Text style={styles.waitForHostText}>Wacht tot de host opnieuw start.</Text>
              ) : null}
            </View>
          )}
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
              <TouchableOpacity style={styles.middleHomeButton} onPress={() => onMenu?.()}>
                <Text style={[styles.middleHomeText, { fontFamily: fredoka }]}>HOME</Text>
              </TouchableOpacity>
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
            <View style={styles.singleHomeRow}>
              <TouchableOpacity style={styles.middleHomeButton} onPress={() => onMenu?.()}>
                <Text style={[styles.middleHomeText, { fontFamily: fredoka }]}>HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF4E8' },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 250, 242, 0.28)',
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
    gap: 12,
    marginBottom: 14,
  },
  claimScoreCard: {
    minWidth: 116,
    maxWidth: 138,
    alignItems: 'center',
    paddingHorizontal: 6,
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
    minHeight: 156,
    marginBottom: -2,
    width: 216,
  },
  claimScoreCar: {
    width: 216,
    height: 152,
  },
  claimSparkLayer: {
    position: 'absolute',
    width: 216,
    height: 152,
  },
  claimSpark: {
    position: 'absolute',
    borderRadius: 999,
  },
  claimScoreValue: {
    fontSize: 28,
    lineHeight: 32,
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
  claimGridShell: {
    marginBottom: 18,
  },
  claimFooter: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSectionCompact: {
    justifyContent: 'center',
    marginBottom: -6,
  },
  boardShell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
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
  singleHomeRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middlePlayerCar: {
    width: 104,
    height: 76,
    marginTop: 10,
  },
  middlePlayerCarMirrored: {
    transform: [{ scaleX: -1 }],
  },
  middleHomeButton: {
    minWidth: 86,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3f6d8d',
    borderWidth: 2,
    borderColor: '#1e3749',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  middleHomeText: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  gridShell: {
    borderWidth: 4,
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
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
  cellIcon: {},
  line: { position: 'absolute', height: 8, borderRadius: 4 },
  bingoText: { marginTop: 8, fontSize: 32, letterSpacing: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 35, 46, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  claimResultTitle: {
    fontSize: 28,
    marginBottom: 10,
    color: '#111827',
  },
  claimResultStage: {
    width: '100%',
    minHeight: 324,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 6,
    marginBottom: 18,
    overflow: 'hidden',
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
  claimPodiumScoreBlock: {
    width: '92%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  claimPodiumGrowBlock: {
    position: 'absolute',
    bottom: 54,
    width: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  claimPodiumScore: {
    fontSize: 28,
    color: '#ffffff',
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
  claimResultActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 4,
  },
  claimResultButton: {
    flex: 1,
    maxWidth: 210,
    minHeight: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  claimResultHomeButton: {
    backgroundColor: '#256B8A',
    borderColor: '#13364A',
  },
  claimResultReplayButton: {
    backgroundColor: '#256B8A',
    borderColor: '#13364A',
  },
  claimResultReplayButtonDisabled: {
    opacity: 0.4,
  },
  claimResultButtonText: {
    fontSize: 22,
    color: '#ffffff',
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
    fontSize: 15,
    color: '#315266',
    textAlign: 'center',
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
