import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions, Animated,
} from 'react-native';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import { getRandomIcons } from './themeIcons';
import { PLAYER_IMAGES, PLAYER_HEX } from '../assets/images/players/playerImages';
import { getPlayerThemes } from './gameFlowConfig';

const SIZE = 4;
const { width, height } = Dimensions.get('window');
const OUTER_PADDING = 12;
const PADDING = 10;
const GAP = 8;
const TOP_CONTROLS_HEIGHT = 72;
const SECTION_GAP = 12;
const SECTION_LABEL_HEIGHT = 30;
const AVAILABLE_BOARD_WIDTH = width - OUTER_PADDING * 2 - PADDING * 2 - GAP * (SIZE - 1);
const AVAILABLE_BOARD_HEIGHT = ((height - TOP_CONTROLS_HEIGHT - SECTION_GAP - OUTER_PADDING * 2) / 2)
  - SECTION_LABEL_HEIGHT
  - PADDING * 2
  - GAP * (SIZE - 1);
const CELL_SIZE = Math.floor(Math.min(
  AVAILABLE_BOARD_WIDTH / SIZE,
  AVAILABLE_BOARD_HEIGHT / SIZE,
));
const GRID_HEIGHT = SIZE * CELL_SIZE + (SIZE - 1) * GAP + PADDING * 2;

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

function getCompletedLines(checked, rules) {
  const lines = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],
    [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],
  ];

  if (rules.allowDiagonal) {
    lines.push([0,5,10,15], [3,6,9,12]);
  }

  return lines.filter((line) => line.every((index) => checked[index]));
}

function findBingo(checked, rules) {
  if (rules.winMode === 'full_card') {
    return checked.every(Boolean) ? 'full_card' : null;
  }

  const completedLines = getCompletedLines(checked, rules);

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

function cellCenter(index) {
  const col = index % SIZE;
  const row = Math.floor(index / SIZE);
  return {
    x: PADDING + col * (CELL_SIZE + GAP) + CELL_SIZE / 2,
    y: PADDING + row * (CELL_SIZE + GAP) + CELL_SIZE / 2,
  };
}

// ─── Cel met bounce animatie ─────────────────────────────────────────────────
function BingoCell({ checked, checkedColor, icon, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.cell,
          checked
            ? { backgroundColor: checkedColor, borderColor: darkenHex(checkedColor) }
            : { backgroundColor: '#FFFDF7', borderColor: '#D4C4A0' },
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Image source={icon} style={styles.cellIcon} resizeMode="contain" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Scherm ──────────────────────────────────────────────────────────────────
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
}) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const resolvedTheme = thema ?? theme ?? 'snelweg';
  const resolvedPlayers = spelers?.length
    ? spelers
    : Array.from({ length: aantalSpelersOpDitApparaat ?? playerCount ?? 1 }, (_, index) => ({
        naam: playerNames?.[index] ?? `Speler ${index + 1}`,
        skin: playerColors?.[index] ?? 'groen',
      }));
  const resolvedPlayerCount = resolvedPlayers.length || aantalSpelersOpDitApparaat || playerCount || 1;
  const resolvedPlayerColors = resolvedPlayers.map((player, index) => player.skin ?? playerColors?.[index] ?? 'groen');
  const resolvedPlayerNames = resolvedPlayers.map((player, index) => player.naam || playerNames?.[index] || `Speler ${index + 1}`);
  const derivedThemes = playerThemes?.length
    ? playerThemes
    : kaartOpzet === 'ander-thema'
      ? getPlayerThemes(resolvedTheme, resolvedPlayerCount)
      : Array.from({ length: resolvedPlayerCount }, () => resolvedTheme);
  const actieveRegels = getRulesFromProps({
    rules,
    wincondition,
    diagonaal,
    kaartOpzet,
  });
  const [sharedIcons] = useState(() => getRandomIcons(resolvedTheme));
  const [playerIcons] = useState(() =>
    kaartOpzet === 'ander-thema'
      ? derivedThemes.map((playerTheme) => getRandomIcons(playerTheme))
      : actieveRegels.sharedCards
      ? Array.from({ length: resolvedPlayerCount }, () => sharedIcons)
      : Array.from({ length: resolvedPlayerCount }, () => getRandomIcons(resolvedTheme))
  );
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(SIZE * SIZE).fill(false))
  );
  const [playerWinLines, setPlayerWinLines] = useState(Array(resolvedPlayerCount).fill(null));
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;

  function handlePress(playerIndex, index) {
    const winLine = playerWinLines[playerIndex];
    if (winLine) return;
    const next = playerChecked.map((cells, currentIndex) =>
      currentIndex === playerIndex ? [...cells] : cells
    );
    next[playerIndex][index] = !next[playerIndex][index];
    setPlayerChecked(next);
    const win = findBingo(next[playerIndex], actieveRegels);
    if (win) {
      const nextWins = [...playerWinLines];
      nextWins[playerIndex] = win;
      setPlayerWinLines(nextWins);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsColumn}>
        {Array.from({ length: resolvedPlayerCount }, (_, playerIndex) => {
          const kleur = resolvedPlayerColors[playerIndex] ?? 'groen';
          const checked = playerChecked[playerIndex];
          const icons = playerIcons[playerIndex];
          const winLine = playerWinLines[playerIndex];
          const checkedColor = PLAYER_HEX[kleur] ?? '#2E8B3F';

          let lineOverlay = null;
          if (Array.isArray(winLine)) {
            const a = cellCenter(winLine[0]);
            const b = cellCenter(winLine[1]);
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
            <View key={playerIndex} style={styles.playerSection}>
              <View style={styles.playerLabelRow}>
                <Image
                  source={PLAYER_IMAGES[kleur]}
                  style={styles.playerImg}
                  resizeMode="contain"
                />
                <Text style={[styles.playerLabel, { fontFamily: fredoka }]}>
                  {resolvedPlayerNames[playerIndex] || `Speler ${playerIndex + 1}`}
                </Text>
              </View>

              <View style={styles.gridWrapper}>
                {icons.map((icon, iconIndex) => (
                  <BingoCell
                    key={iconIndex}
                    checked={checked[iconIndex]}
                    checkedColor={checkedColor}
                    icon={icon}
                    onPress={() => handlePress(playerIndex, iconIndex)}
                  />
                ))}
                {lineOverlay}
              </View>

              {winLine && (
                <Text style={[styles.bingoText, { color: checkedColor, fontFamily: fredoka }]}>
                  BINGO!
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#EBF4E8' },
  topControls: {
    paddingTop: 56,
    paddingHorizontal: 16,
    height: TOP_CONTROLS_HEIGHT,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#D4C4A0',
  },
  backText:   { fontSize: 24, color: '#2D2B55', fontWeight: 'bold' },

  cardsColumn: {
    flex: 1,
    paddingHorizontal: OUTER_PADDING,
    paddingBottom: OUTER_PADDING,
    gap: SECTION_GAP,
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLabelRow: {
    height: SECTION_LABEL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  playerImg: {
    width: 30,
    height: 30,
  },
  playerLabel: {
    fontSize: 20,
    color: '#2D2B55',
    letterSpacing: 0.4,
  },

  gridWrapper: {
    width: SIZE * CELL_SIZE + (SIZE - 1) * GAP + PADDING * 2,
    height: GRID_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: PADDING,
    gap: GAP,
    position: 'relative',
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIcon: {
    width: CELL_SIZE * 0.82,
    height: CELL_SIZE * 0.82,
  },

  line:      { position: 'absolute', height: 8, borderRadius: 4 },
  bingoText: { marginTop: 8, fontSize: 32, letterSpacing: 1 },
});
