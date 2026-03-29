import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { useFonts as useNunito, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import * as Haptics from 'expo-haptics';
import BingoCardScreen from './BingoCardScreen';

const { width: W } = Dimensions.get('window');
const BUTTON_W = W - 48;

const FREE_THEMES = [
  { id: 'snelweg',    label: 'Snelweg',        emoji: '🛣️',  bg: '#D93B2B', textColor: '#FFFDF7' },
  { id: 'stad',       label: 'Stad',            emoji: '🏙️',  bg: '#1A5EA8', textColor: '#FFFDF7' },
  { id: 'platteland', label: 'Platteland',      emoji: '🌾',  bg: '#2E8B3F', textColor: '#FFFDF7' },
  { id: 'vakantie',   label: 'Vakantie',        emoji: '🌴',  bg: '#E8622A', textColor: '#FFFDF7' },
];

const PREMIUM_THEMES = [
  { id: 'winter',         label: 'Winter',          emoji: '❄️',  bg: '#6EB5FF', textColor: '#2D2B55' },
  { id: 'dieren',         label: 'Dieren & Natuur',  emoji: '🦎', bg: '#2E8B3F', textColor: '#FFFDF7' },
  { id: 'voertuigen',     label: 'Voertuigen',       emoji: '🚗', bg: '#2D2B55', textColor: '#F5C400' },
  { id: 'verkeersborden', label: 'Verkeersborden',   emoji: '⚠️', bg: '#FFFDF7', textColor: '#2D2B55', border: '#D93B2B' },
];

export default function ThemeSelectScreen({ playerCount, playerColors, onSelect, onBack }) {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [nunitoLoaded]  = useNunito({ Nunito_600SemiBold });
  const [selectedTheme, setSelectedTheme] = useState(null);

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (selectedTheme) {
    return (
      <BingoCardScreen
        theme={selectedTheme}
        playerCount={playerCount}
        playerColors={playerColors}
        onBack={() => setSelectedTheme(null)}
      />
    );
  }

  const fredoka = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;
  const nunito  = nunitoLoaded  ? 'Nunito_600SemiBold'    : undefined;

  const renderButton = (theme) => (
    <TouchableOpacity
      key={theme.id}
      activeOpacity={0.82}
      style={[
        styles.button,
        { backgroundColor: theme.bg },
        theme.border && { borderWidth: 2.5, borderColor: theme.border },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTheme(theme.id);
      }}
    >
      <Text style={styles.buttonEmoji}>{theme.emoji}</Text>
      <Text style={[styles.buttonText, { color: theme.textColor, fontFamily: fredoka }]}>
        {theme.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: fredoka }]}>Kies een thema</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { fontFamily: nunito }]}>Gratis</Text>
        <View style={styles.lijst}>
          {FREE_THEMES.map(renderButton)}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLijn} />
          <Text style={[styles.dividerTekst, { fontFamily: nunito }]}>Premium</Text>
          <View style={styles.dividerLijn} />
        </View>

        <View style={styles.lijst}>
          {PREMIUM_THEMES.map(renderButton)}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#2D2B55',
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  lijst: {
    gap: 16,
  },
  button: {
    width: BUTTON_W,
    height: 80,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonEmoji: {
    fontSize: 28,
  },
  buttonText: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLijn: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E8D5B0',
    borderRadius: 1,
  },
  dividerTekst: {
    fontSize: 13,
    color: '#2D2B55',
    letterSpacing: 1,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
});
