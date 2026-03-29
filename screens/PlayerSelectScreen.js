import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated } from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import ColorSelectScreen from './ColorSelectScreen';
import ThemeSelectScreen from './ThemeSelectScreen';
import { PLAYER_IMAGES } from '../assets/images/players/playerImages';

const OPTIONS = [
  { count: 1, label: '1 speler' },
  { count: 2, label: '2 spelers' },
  { count: 3, label: '3 spelers' },
  { count: 4, label: '4 spelers' },
];

const PREVIEW = [
  ['groen'],
  ['rood', 'blauw'],
  ['rood', 'blauw', 'geel'],
  ['rood', 'blauw', 'geel', 'groen'],
];

export default function PlayerSelectScreen({ onSelect, onBack }) {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [playerCount, setPlayerCount] = useState(null);
  const [playerColors, setPlayerColors] = useState(null);

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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

  const fredoka = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;

  const renderCard = (option) => (
    <TouchableOpacity
      key={option.count}
      style={styles.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPlayerCount(option.count);
      }}
      activeOpacity={0.82}
    >
      <View style={styles.iconBox}>
        {PREVIEW[option.count - 1].map((kleur, i) => (
          <Image key={i} source={PLAYER_IMAGES[kleur]} style={styles.icon} resizeMode="contain" />
        ))}
      </View>
      <Text style={[styles.label, { fontFamily: fredoka }]}>{option.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: fredoka }]}>Aantal spelers</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.grid}>
          {OPTIONS.map(renderCard)}
        </View>
      </View>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerText: {
    fontSize: 22,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
  backButton: { width: 40 },
  backText: {
    fontSize: 24,
    color: '#FFFDF7',
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: '46%',
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8D5B0',
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
    fontSize: 18,
    color: '#2D2B55',
    letterSpacing: 0.5,
  },
});
