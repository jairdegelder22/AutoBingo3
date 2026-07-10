import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import AnimatedBackButton from '../src/components/AnimatedBackButton';

const ALL_ITEMS = [
  "Vrachtwagen", "Tankstation", "Stoplicht", "Busje", "Windmolen",
  "Helikopter", "File", "Tunnel", "Vliegtuig", "Hoogspanningsmast",
  "Molen", "Wegenwacht", "Politieauto", "Viaduct", "Paardentrailer",
  "Trein", "Zonnepanelen", "Auto met pech", "Hectometerpaal", "Snelheidsbord",
  "Tankvrachtwagen", "Hijskraan", "Hooibaal", "Ambulance", "Motorrijder",
  "Politiemotor", "Rivier met boot", "Matrixbord", "Graffiti", "Brandweerauto",
  "Touringcar", "Brug", "Auto met fietsendrager", "Dakkoffer", "Sleepauto",
  "Lijkwagen",
];

function getRandomCard() {
  const shuffled = [...ALL_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 25).map((label) => ({ label, checked: false }));
}

function checkBingo(cells) {
  const grid = Array.from({ length: 5 }, (_, r) =>
    cells.slice(r * 5, r * 5 + 5).map((c) => c.checked)
  );

  // rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every(Boolean)) return true;
  }
  // columns
  for (let c = 0; c < 5; c++) {
    if (grid.every((row) => row[c])) return true;
  }
  // diagonals
  if ([0, 1, 2, 3, 4].every((i) => grid[i][i])) return true;
  if ([0, 1, 2, 3, 4].every((i) => grid[i][4 - i])) return true;

  return false;
}

export default function BingoScreen({ onNewGame }) {
  const [cells, setCells] = useState(getRandomCard);
  const [bingo, setBingo] = useState(false);

  const toggle = useCallback((index) => {
    setCells((prev) => {
      const next = prev.map((cell, i) =>
        i === index ? { ...cell, checked: !cell.checked } : cell
      );
      if (checkBingo(next)) setBingo(true);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCells(getRandomCard());
    setBingo(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backButton}>
        <AnimatedBackButton onActivated={onNewGame} size={66} />
      </View>
      <Text style={styles.title}>AutoBingo</Text>

      <View style={styles.grid}>
        {cells.map((cell, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.cell, cell.checked && styles.cellChecked]}
            onPress={() => toggle(index)}
            activeOpacity={0.7}
          >
            {cell.checked && <Text style={styles.checkmark}>✓</Text>}
            <Text
              style={[styles.cellText, cell.checked && styles.cellTextChecked]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {cell.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.resetButton} onPress={reset}>
          <Text style={styles.resetButtonText}>Nieuw Spel</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={bingo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.bingoEmoji}>🎉</Text>
            <Text style={styles.bingoText}>BINGO!</Text>
            <Text style={styles.bingoSub}>5 op een rij!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={reset}>
              <Text style={styles.modalButtonText}>Nieuw Spel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 6,
  },
  cell: {
    width: '18.8%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  cellText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cellTextChecked: {
    color: '#fff',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5C400',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 52,
    zIndex: 20,
    elevation: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#F5C400',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '75%',
  },
  bingoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  bingoText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  bingoSub: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    opacity: 0.7,
  },
  modalButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5C400',
  },
});
