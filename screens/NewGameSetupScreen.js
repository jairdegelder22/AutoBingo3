import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { useFonts as useNunito, Nunito_700Bold } from '@expo-google-fonts/nunito';
import * as Haptics from 'expo-haptics';
import { PLAYER_IMAGES, ALLE_KLEUREN } from '../assets/images/players/playerImages';
import { THEMES } from './themeCatalog';

const PLAYER_SILHOUETTE = require('../assets/images/players/player-silhouette.png');
const COLOR_SELECTOR_ICON = require('../assets/images/players/color-selector.png');
const PANEL_BG = '#F4F7EE';
const NOTCH_BG = 'rgba(244, 247, 238, 0.72)';
const TARGET_TOP = 44;
const COMPACT_PANEL_PADDING_X = 16;
const COMPACT_PANEL_PADDING_Y = 14;

const THEMAS = THEMES;

function getExpandedCarSize(playerCount) {
  if (playerCount === 1) return { width: 150, height: 118 };
  if (playerCount === 2) return { width: 122, height: 96 };
  if (playerCount === 3) return { width: 108, height: 84 };
  return { width: 94, height: 74 };
}

function getExpandedRowStart(index, playerCount) {
  const presets = {
    1: [{ x: -88, y: -170 }],
    2: [
      { x: -88, y: -128 },
      { x: 88, y: -82 },
    ],
    3: [
      { x: -88, y: -128 },
      { x: 88, y: -100 },
      { x: -88, y: -52 },
    ],
    4: [
      { x: -88, y: -132 },
      { x: 88, y: -132 },
      { x: -88, y: -72 },
      { x: 88, y: -72 },
    ],
  };

  return presets[playerCount]?.[index] ?? { x: 0, y: -80 };
}

function getCompactCenter(index, width, slotLayouts) {
  if (slotLayouts?.[index]) {
    const slot = slotLayouts[index];
    return {
      x: COMPACT_PANEL_PADDING_X + slot.x + slot.width / 2,
      y: COMPACT_PANEL_PADDING_Y + slot.y + slot.height / 2,
    };
  }

  const centers = [
    { x: width * 0.27, y: 136 },
    { x: width * 0.73, y: 136 },
    { x: width * 0.27, y: 242 },
    { x: width * 0.73, y: 242 },
  ];

  return centers[index] ?? centers[0];
}

function getExpandedCenter(index, playerCount, width, height) {
  const usableTop = 112;
  const usableBottom = Math.max(usableTop + 140, height - 104);
  const span = usableBottom - usableTop;
  const step = playerCount > 1 ? span / (playerCount - 1) : 0;

  return {
    x: width / 2,
    y: playerCount === 1 ? usableTop + span * 0.5 : usableTop + step * index,
  };
}

export default function NewGameSetupScreen({ onBack, onStart }) {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [nunitoLoaded] = useNunito({ Nunito_700Bold });
  const [themeIndex, setThemeIndex] = useState(0);
  const [playerCount, setPlayerCount] = useState(1);
  const [playerColors, setPlayerColors] = useState(ALLE_KLEUREN.slice(0, 4));
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [contentLayout, setContentLayout] = useState(null);
  const [playersLayout, setPlayersLayout] = useState(null);
  const [playersPanelLayout, setPlayersPanelLayout] = useState(null);
  const [slotLayouts, setSlotLayouts] = useState([]);

  const playButtonRef = useRef(null);
  const colorPickerProgress = useRef(new Animated.Value(0)).current;
  const fredoka = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;
  const nunitoBold = nunitoLoaded ? 'Nunito_700Bold' : undefined;
  const currentTheme = THEMAS[themeIndex];
  const expandedCarSize = getExpandedCarSize(playerCount);

  function changeTheme(direction) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeIndex((prev) => (prev + direction + THEMAS.length) % THEMAS.length);
  }

  function addPlayer(slotIndex) {
    if (slotIndex < playerCount) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextPlayerCount = slotIndex + 1;

    setPlayerColors((prev) => {
      const next = [...prev];
      const usedColors = new Set(next.slice(0, playerCount));

      for (let index = playerCount; index < nextPlayerCount; index += 1) {
        const nextColor = ALLE_KLEUREN.find((color) => !usedColors.has(color)) ?? ALLE_KLEUREN[index % ALLE_KLEUREN.length];
        next[index] = nextColor;
        usedColors.add(nextColor);
      }

      return next;
    });

    setPlayerCount(nextPlayerCount);
  }

  function updatePlayerColor(playerIndex, direction) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerColors((prev) => {
      const next = [...prev];
      const usedColors = new Set(
        next.slice(0, playerCount).filter((_, index) => index !== playerIndex)
      );
      let colorIndex = ALLE_KLEUREN.indexOf(next[playerIndex]);
      let attempts = 0;

      do {
        colorIndex = (colorIndex + direction + ALLE_KLEUREN.length) % ALLE_KLEUREN.length;
        attempts += 1;
      } while (usedColors.has(ALLE_KLEUREN[colorIndex]) && attempts < ALLE_KLEUREN.length);

      next[playerIndex] = ALLE_KLEUREN[colorIndex];
      return next;
    });
  }

  function openColorPicker() {
    if (!contentLayout || !playersLayout || colorPickerOpen) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setColorPickerOpen(true);
    Animated.spring(colorPickerProgress, {
      toValue: 1,
      damping: 18,
      stiffness: 120,
      mass: 0.9,
      useNativeDriver: false,
    }).start();
  }

  function closeColorPicker() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(colorPickerProgress, {
      toValue: 0,
      damping: 18,
      stiffness: 140,
      mass: 0.88,
      useNativeDriver: false,
    }).start(() => {
      setColorPickerOpen(false);
    });
  }

  const compactBottom =
    contentLayout && playersLayout && playersPanelLayout
      ? Math.max(0, contentLayout.height - playersLayout.y - playersPanelLayout.height)
      : 0;
  const shellReady = Boolean(contentLayout && playersLayout && playersPanelLayout);

  const compactHorizontalInset = playersLayout?.x ?? 0;

  const overlayTop = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [playersLayout?.y ?? 0, TARGET_TOP],
  });

  const overlayLeft = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [compactHorizontalInset, 0],
  });

  const overlayRight = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      compactHorizontalInset,
      0,
    ],
  });

  const overlayBottom = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [compactBottom, 0],
  });

  const overlayRadius = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 40],
  });

  const overlayPaddingTop = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const expandedTranslateY = colorPickerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const expandedArrowOpacity = colorPickerProgress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0, 0.08, 1],
  });

  const compactActiveOpacity = colorPickerProgress.interpolate({
    inputRange: [0, 0.08, 0.22],
    outputRange: [1, 0.35, 0],
  });

  const compactGhostOpacity = colorPickerProgress.interpolate({
    inputRange: [0, 0.18, 0.38],
    outputRange: [1, 0.55, 0],
  });

  const overlayNotchOpacity = colorPickerProgress.interpolate({
    inputRange: [0, 0.18, 0.32, 1],
    outputRange: [1, 1, 0, 0],
  });

  const overlayNotchScale = colorPickerProgress.interpolate({
    inputRange: [0, 0.24, 1],
    outputRange: [1, 0.72, 0.16],
  });

  const overlayNotchTranslateY = colorPickerProgress.interpolate({
    inputRange: [0, 0.24, 1],
    outputRange: [0, -6, -18],
  });

  const overlayWidth = contentLayout?.width ?? 0;
  const overlayExpandedHeight = contentLayout ? contentLayout.height - TARGET_TOP : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: fredoka }]}>Nieuw spel</Text>
        <View style={styles.backButton} />
      </View>

      <View
        style={styles.content}
        onLayout={({ nativeEvent }) => setContentLayout(nativeEvent.layout)}
      >
        <View style={styles.topSection}>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => changeTheme(-1)}
              activeOpacity={0.8}
            >
              <Text style={[styles.arrowText, { fontFamily: fredoka }]}>‹</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.themeCard,
                { backgroundColor: currentTheme.bg, borderColor: currentTheme.border ?? '#234D6A' },
              ]}
            >
              <Text
                style={[
                  styles.themeCardText,
                  { color: currentTheme.textColor, fontFamily: fredoka },
                ]}
              >
                {currentTheme.label}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => changeTheme(1)}
              activeOpacity={0.8}
            >
              <Text style={[styles.arrowText, { fontFamily: fredoka }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.playersShell, styles.playersShellPlaceholder]}
            pointerEvents="none"
            onLayout={({ nativeEvent }) => setPlayersLayout(nativeEvent.layout)}
          >
            <View
              style={styles.playersPanel}
              onLayout={({ nativeEvent }) => setPlayersPanelLayout(nativeEvent.layout)}
            >
              <View style={styles.playersGrid}>
                {Array.from({ length: 4 }, (_, index) => {
                  const active = index < playerCount;
                  const color = playerColors[index];

                  return (
                    <TouchableOpacity
                      key={`compact-${color}-${index}`}
                      activeOpacity={0.88}
                      style={styles.playerSlot}
                      onPress={() => addPlayer(index)}
                      onLayout={({ nativeEvent }) => {
                        const nextLayout = nativeEvent.layout;
                        setSlotLayouts((prev) => {
                          const next = [...prev];
                          const current = next[index];

                          if (
                            current &&
                            current.x === nextLayout.x &&
                            current.y === nextLayout.y &&
                            current.width === nextLayout.width &&
                            current.height === nextLayout.height
                          ) {
                            return prev;
                          }

                          next[index] = nextLayout;
                          return next;
                        });
                      }}
                    >
                      <Image
                        source={active ? PLAYER_IMAGES[color] : PLAYER_SILHOUETTE}
                        style={[styles.playerCar, !active && styles.playerCarGhost]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.playersNotch}>
              <TouchableOpacity
                style={styles.colorButton}
                activeOpacity={0.86}
                onPress={openColorPicker}
              >
                <Image source={COLOR_SELECTOR_ICON} style={styles.colorButtonIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          ref={playButtonRef}
          collapsable={false}
          style={styles.playButton}
          activeOpacity={0.86}
          onPressIn={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStart(playButtonRef, {
              theme: currentTheme.id,
              playerCount,
              playerColors: playerColors.slice(0, playerCount),
              rules: {
                sharedCards: true,
                winMode: 'one_line',
                allowDiagonal: true,
              },
            });
          }}
        >
          <Text style={[styles.playButtonText, { fontFamily: nunitoBold }]}>Spelen</Text>
        </TouchableOpacity>

        {shellReady && (
          <>
            <Animated.View
              style={[
                styles.colorOverlay,
                {
                  left: overlayLeft,
                  right: overlayRight,
                  opacity: 1,
                  top: overlayTop,
                  bottom: overlayBottom,
                  borderRadius: overlayRadius,
                  paddingTop: overlayPaddingTop,
                },
              ]}
            >
              <Animated.View
                pointerEvents={colorPickerOpen ? 'none' : 'auto'}
                style={styles.compactHitLayer}
              >
                <View style={styles.playersGrid}>
                  {Array.from({ length: 4 }, (_, index) => {
                    return (
                      <TouchableOpacity
                        key={`hit-compact-${index}`}
                        activeOpacity={0.88}
                        style={styles.playerSlot}
                        onPress={() => addPlayer(index)}
                      />
                    );
                  })}
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.colorOverlayExpanded,
                  {
                    transform: [{ translateY: expandedTranslateY }],
                  },
                ]}
                pointerEvents={colorPickerOpen ? 'auto' : 'none'}
              >
                <View style={styles.overlayMotionStage}>
                  {Array.from({ length: 4 }, (_, index) => {
                    const active = index < playerCount;
                    const color = playerColors[index];

                    if (!active) {
                      const compactCenter = getCompactCenter(index, overlayWidth, slotLayouts);
                      const ghostScale = colorPickerProgress.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 0.22, 0.01],
                      });

                      return (
                        <Animated.View
                          key={`ghost-${index}`}
                          pointerEvents="none"
                          style={[
                            styles.motionGhost,
                            {
                              left: compactCenter.x - 63,
                              top: compactCenter.y - 49,
                              transform: [{ scale: ghostScale }],
                            },
                          ]}
                        >
                          <Image
                            source={PLAYER_SILHOUETTE}
                            style={styles.playerCar}
                            resizeMode="contain"
                          />
                        </Animated.View>
                      );
                    }

                    const compactCenter = getCompactCenter(index, overlayWidth, slotLayouts);
                    const expandedCenter = getExpandedCenter(
                      index,
                      playerCount,
                      overlayWidth,
                      overlayExpandedHeight
                    );

                    const rowWidth = expandedCarSize.width + 120;
                    const rowHeight = expandedCarSize.height;
                    const startScale = 126 / expandedCarSize.width;
                    const startX = compactCenter.x - rowWidth / 2;
                    const startY = compactCenter.y - rowHeight / 2;
                    const endX = expandedCenter.x - rowWidth / 2;
                    const endY = expandedCenter.y - rowHeight / 2;

                    const translateX = colorPickerProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [startX - endX, 0],
                    });

                    const translateY = colorPickerProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [startY - endY, 0],
                    });

                    const scale = colorPickerProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [startScale, 1],
                    });

                    return (
                      <Animated.View
                        key={`expanded-${color}-${index}`}
                        style={[
                          styles.expandedPlayerRow,
                          {
                            width: rowWidth,
                            top: endY,
                            left: endX,
                            transform: [
                              { translateX },
                              { translateY },
                              { scale },
                            ],
                          },
                        ]}
                      >
                        <Animated.View style={{ opacity: expandedArrowOpacity }}>
                          <TouchableOpacity
                            style={styles.expandedArrowButton}
                            activeOpacity={0.8}
                            onPress={() => updatePlayerColor(index, -1)}
                          >
                            <Text style={[styles.expandedArrowText, { fontFamily: fredoka }]}>‹</Text>
                          </TouchableOpacity>
                        </Animated.View>

                        <Image
                          source={PLAYER_IMAGES[color]}
                          style={[
                            styles.expandedPlayerCar,
                            { width: expandedCarSize.width, height: expandedCarSize.height },
                          ]}
                          resizeMode="contain"
                        />

                        <Animated.View style={{ opacity: expandedArrowOpacity }}>
                          <TouchableOpacity
                            style={styles.expandedArrowButton}
                            activeOpacity={0.8}
                            onPress={() => updatePlayerColor(index, 1)}
                          >
                            <Text style={[styles.expandedArrowText, { fontFamily: fredoka }]}>›</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={[
                styles.playersNotch,
                styles.visibleShellNotch,
                {
                  left: (playersLayout?.x ?? 0) + ((playersPanelLayout?.width ?? 0) / 2) - 59,
                  top: playersLayout.y + playersPanelLayout.height - 3,
                  opacity: overlayNotchOpacity,
                  transform: [
                    { translateY: overlayNotchTranslateY },
                    { scale: overlayNotchScale },
                  ],
                },
              ]}
              pointerEvents={colorPickerOpen ? 'none' : 'auto'}
            >
              <TouchableOpacity
                style={styles.colorButton}
                activeOpacity={0.86}
                onPress={openColorPicker}
              >
                <Image source={COLOR_SELECTOR_ICON} style={styles.colorButtonIcon} resizeMode="contain" />
              </TouchableOpacity>
            </Animated.View>

            {colorPickerOpen && (
              <TouchableOpacity style={styles.overlayBackdrop} activeOpacity={1} onPress={closeColorPicker} />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4E8',
  },
  header: {
    backgroundColor: '#1A5EA8',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: '#FFFDF7',
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 22,
    color: '#FFFDF7',
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    gap: 36,
  },
  themeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  arrowButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 72,
    color: '#111111',
    lineHeight: 72,
  },
  themeCard: {
    width: 164,
    height: 220,
    borderRadius: 0,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  themeCardText: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  playersShell: {
    width: '88%',
    alignItems: 'center',
  },
  playersShellPlaceholder: {
    opacity: 0,
  },
  playersPanel: {
    width: '100%',
    borderWidth: 3,
    borderColor: '#123245',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PANEL_BG,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  playerSlot: {
    width: '48%',
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCar: {
    width: 126,
    height: 98,
  },
  playerCarGhost: {
    opacity: 0.92,
    transform: [{ scale: 0.82 }],
  },
  playersNotch: {
    width: 118,
    height: 64,
    marginTop: -3,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#123245',
    backgroundColor: NOTCH_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibleShellNotch: {
    position: 'absolute',
    zIndex: 41,
  },
  colorButton: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  colorButtonIcon: {
    width: 48,
    height: 48,
  },
  playButton: {
    width: 290,
    maxWidth: '92%',
    borderRadius: 24,
    backgroundColor: '#FF1C13',
    borderWidth: 3,
    borderColor: '#123245',
    paddingVertical: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  playButtonText: {
    fontSize: 24,
    color: '#FFFDF7',
  },
  colorOverlay: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#123245',
    backgroundColor: PANEL_BG,
    overflow: 'hidden',
    zIndex: 40,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 39,
    backgroundColor: 'transparent',
  },
  compactHitLayer: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  colorOverlayExpanded: {
    flex: 1,
    position: 'relative',
  },
  overlayMotionStage: {
    flex: 1,
    position: 'relative',
  },
  expandedPlayerRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  motionGhost: {
    position: 'absolute',
    width: 126,
    height: 98,
  },
  expandedArrowButton: {
    width: 54,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedArrowText: {
    fontSize: 92,
    lineHeight: 92,
    color: '#111111',
  },
  expandedPlayerCar: {
    flexShrink: 1,
  },
});
