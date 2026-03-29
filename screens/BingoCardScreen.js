import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { getRandomIcons } from './themeIcons';
import { PLAYER_IMAGES, PLAYER_HEX } from '../assets/images/players/playerImages';

const CELL_COLORS = ['#2E8B3F', '#6EB5FF', '#F5C400', '#FF6B6B'];
const SIZE = 4;

const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 8;
const CELL_SIZE = (width - PADDING * 2 - GAP * (SIZE - 1)) / SIZE;
const GRID_HEIGHT = SIZE * CELL_SIZE + (SIZE - 1) * GAP + PADDING * 2;

const THEME_LABELS = {
  snelweg: 'Snelweg', stad: 'Stad', platteland: 'Platteland', vakantie: 'Vakantie',
  winter: 'Winter', dieren: 'Dieren & Natuur', voertuigen: 'Voertuigen', verkeersborden: 'Verkeersborden',
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

export default function BingoCardScreen({ theme, playerCount, playerColors, onBack }) {
  const [icons] = useState(() => getRandomIcons(theme));
  const [colors] = useState(randomColors);
  const [activePlayer, setActivePlayer] = useState(0);
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: playerCount }, () => Array(SIZE * SIZE).fill(false))
  );
  const [playerWinLines, setPlayerWinLines] = useState(Array(playerCount).fill(null));

  const checked = playerChecked[activePlayer];
  const winLine = playerWinLines[activePlayer];

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
          transform: [{ rotate: `${angle}deg` }],
        }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{THEME_LABELS[theme] ?? theme}</Text>
        <View style={styles.backButton} />
      </View>

      {playerCount > 1 && (
        <View style={styles.playerBar}>
          {Array.from({ length: playerCount }, (_, i) => {
            const kleur = playerColors?.[i] ?? 'groen';
            const actief = i === activePlayer;
            const hex = PLAYER_HEX[kleur];
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setActivePlayer(i)}
                style={[styles.playerButton, actief && { borderBottomColor: hex, borderBottomWidth: 3 }]}
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

      <View style={styles.body}>
        <View style={styles.gridWrapper}>
          {colors.map((color, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                checked[i]
                  ? { backgroundColor: color + '80', borderWidth: 4, borderColor: color }
                  : { backgroundColor: color },
              ]}
              onPress={() => handlePress(i)}
              activeOpacity={0.8}
            >
              <Image source={icons[i]} style={styles.cellIcon} resizeMode="contain" />
            </TouchableOpacity>
          ))}
          {lineOverlay}
        </View>

        {winLine && <Text style={styles.bingoText}>BINGO</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFFFFF' },
  header:       { backgroundColor: '#D93B2B', paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerText:   { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  backButton:   { width: 40 },
  backText:     { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' },

  playerBar: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  gridWrapper: { width, height: GRID_HEIGHT, flexDirection: 'row', flexWrap: 'wrap', padding: PADDING, gap: GAP },
  cell:        { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cellIcon:    { width: CELL_SIZE * 0.9, height: CELL_SIZE * 0.9 },
  line:        { position: 'absolute', height: 8, borderRadius: 4, backgroundColor: '#00CC00' },
  bingoText:   { marginTop: 24, fontSize: 60, fontWeight: 'bold', color: '#00CC00' },
});
