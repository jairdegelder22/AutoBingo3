import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions, Animated,
} from 'react-native';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import { getRandomIcons } from './themeIcons';
import { PLAYER_IMAGES, PLAYER_HEX } from '../assets/images/players/playerImages';

const SIZE = 4;
const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 8;
const CELL_SIZE = (width - PADDING * 2 - GAP * (SIZE - 1)) / SIZE;
const GRID_HEIGHT = SIZE * CELL_SIZE + (SIZE - 1) * GAP + PADDING * 2;

const CELL_COLORS = ['#2E8B3F', '#6EB5FF', '#F5C400', '#D93B2B'];

const THEME_LABELS = {
  snelweg: 'Snelweg', stad: 'Stad', platteland: 'Platteland', vakantie: 'Vakantie',
  winter: 'Winter', dieren: 'Dieren & Natuur', voertuigen: 'Voertuigen', verkeersborden: 'Verkeersborden',
};

const THEME_COLORS = {
  snelweg: '#D93B2B', stad: '#1A5EA8', platteland: '#2E8B3F', vakantie: '#E8622A',
  winter: '#6EB5FF', dieren: '#2E8B3F', voertuigen: '#2D2B55', verkeersborden: '#D93B2B',
};

function randomColors() {
  return Array.from({ length: SIZE * SIZE }, (_, i) => CELL_COLORS[i % CELL_COLORS.length])
    .sort(() => Math.random() - 0.5);
}

function findBingo(checked) {
  const lines = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],
    [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],
    [0,5,10,15], [3,6,9,12],
  ];
  for (const line of lines) {
    if (line.every(i => checked[i])) return [line[0], line[3]];
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
function BingoCell({ color, checked, icon, onPress }) {
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
            ? { backgroundColor: '#F5C400', borderColor: '#D4A800' }
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
export default function BingoCardScreen({ theme, playerCount, playerColors, onBack }) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const [icons]  = useState(() => getRandomIcons(theme));
  const [colors] = useState(randomColors);
  const [activePlayer, setActivePlayer] = useState(0);
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: playerCount }, () => Array(SIZE * SIZE).fill(false))
  );
  const [playerWinLines, setPlayerWinLines] = useState(Array(playerCount).fill(null));

  const checked = playerChecked[activePlayer];
  const winLine = playerWinLines[activePlayer];
  const headerKleur = THEME_COLORS[theme] ?? '#D93B2B';
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;

  function handlePress(index) {
    if (winLine) return;
    const next = playerChecked.map((c, p) => p === activePlayer ? [...c] : c);
    next[activePlayer][index] = !next[activePlayer][index];
    setPlayerChecked(next);
    const win = findBingo(next[activePlayer]);
    if (win) {
      const nextWins = [...playerWinLines];
      nextWins[activePlayer] = win;
      setPlayerWinLines(nextWins);
    }
  }

  let lineOverlay = null;
  if (winLine) {
    const a = cellCenter(winLine[0]);
    const b = cellCenter(winLine[1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
    const midX   = (a.x + b.x) / 2;
    const midY   = (a.y + b.y) / 2;
    lineOverlay = (
      <View
        pointerEvents="none"
        style={[styles.line, {
          width: length,
          left: midX - length / 2,
          top:  midY - 4,
          transform: [{ rotate: `${angle}deg` }],
        }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerKleur }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: fredoka }]}>
          {THEME_LABELS[theme] ?? theme}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Spelersbar */}
      {playerCount > 1 && (
        <View style={styles.playerBar}>
          {Array.from({ length: playerCount }, (_, i) => {
            const kleur = playerColors?.[i] ?? 'groen';
            const actief = i === activePlayer;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setActivePlayer(i)}
                style={[styles.playerButton, actief && { borderBottomColor: PLAYER_HEX[kleur], borderBottomWidth: 3 }]}
                activeOpacity={0.7}
              >
                <Image
                  source={PLAYER_IMAGES[kleur]}
                  style={[styles.playerImg, { opacity: actief ? 1 : 0.3 }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Grid */}
      <View style={styles.body}>
        <View style={styles.gridWrapper}>
          {colors.map((color, i) => (
            <BingoCell
              key={i}
              color={color}
              checked={checked[i]}
              icon={icons[i]}
              onPress={() => handlePress(i)}
            />
          ))}
          {lineOverlay}
        </View>

        {winLine && (
          <Text style={[styles.bingoText, { fontFamily: fredoka }]}>BINGO!</Text>
        )}
      </View>
    </View>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#EBF4E8' },
  header:     { paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  headerText: { fontSize: 24, color: '#FFFDF7', letterSpacing: 0.5 },
  backButton: { width: 40 },
  backText:   { fontSize: 24, color: '#FFFDF7', fontWeight: 'bold' },

  playerBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF7',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8D5B0',
  },
  playerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  playerImg: {
    width: 52,
    height: 52,
  },

  body:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrapper: { width, height: GRID_HEIGHT, flexDirection: 'row', flexWrap: 'wrap', padding: PADDING, gap: GAP, position: 'relative' },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIcon: {
    width: CELL_SIZE * 0.65,
    height: CELL_SIZE * 0.65,
  },

  line:      { position: 'absolute', height: 8, borderRadius: 4, backgroundColor: '#2E8B3F' },
  bingoText: { marginTop: 24, fontSize: 60, color: '#2E8B3F', letterSpacing: 1 },
});
