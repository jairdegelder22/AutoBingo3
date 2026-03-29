import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import ColorSelectScreen from './ColorSelectScreen';
import ThemeSelectScreen from './ThemeSelectScreen';
import { PLAYER_IMAGES } from '../assets/images/players/playerImages';

const OPTIONS = [
  { count: 1, label: '1 speler' },
  { count: 2, label: '2 spelers' },
  { count: 3, label: '3 spelers' },
  { count: 4, label: '4 spelers' },
];

export default function PlayerSelectScreen({ onSelect, onBack }) {
  const [playerCount, setPlayerCount] = useState(null);
  const [playerColors, setPlayerColors] = useState(null);

  if (playerCount !== null && playerColors !== null) {
    return (
      <ThemeSelectScreen
        playerCount={playerCount}
        playerColors={playerColors}
        onSelect={(theme) => onSelect(playerCount, theme, playerColors)}
        onBack={() => setPlayerColors(null)}
      />
    );
  }

  if (playerCount !== null) {
    return (
      <ColorSelectScreen
        playerCount={playerCount}
        onDone={(kleuren) => setPlayerColors(kleuren)}
        onBack={() => setPlayerCount(null)}
      />
    );
  }
  // Vaste preview-kleuren per kaart
  const PREVIEW = [
    ['groen'],
    ['rood', 'blauw'],
    ['rood', 'blauw', 'geel'],
    ['rood', 'blauw', 'geel', 'groen'],
  ];

  const renderCard = (option) => (
    <TouchableOpacity key={option.count} style={styles.card} onPress={() => setPlayerCount(option.count)}>
      <View style={styles.iconBox}>
        {PREVIEW[option.count - 1].map((kleur, i) => (
          <Image
            key={i}
            source={PLAYER_IMAGES[kleur]}
            style={styles.icon}
            resizeMode="contain"
          />
        ))}
      </View>
      <Text style={styles.label}>{option.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Aantal spelers kiezen</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.grid}>
          {OPTIONS.map(renderCard)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F5C400',
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    minHeight: 72,
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
