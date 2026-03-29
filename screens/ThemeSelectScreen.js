import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import BingoCardScreen from './BingoCardScreen';

const { width: W } = Dimensions.get('window');
const BUTTON_W = W - 32;

const FREE_THEMES = [
  { id: 'snelweg',    label: 'Snelweg',        emoji: '🛣️',  bg: '#D93B2B', textColor: '#FFFFFF' },
  { id: 'stad',       label: 'Stad',            emoji: '🏙️',  bg: '#2E6B7A', textColor: '#F5A623' },
  { id: 'platteland', label: 'Platteland',      emoji: '🌾',  bg: '#2E5E1E', textColor: '#A8E87A' },
  { id: 'vakantie',   label: 'Vakantie',        emoji: '🌴',  bg: '#1A9BD0', textColor: '#FFFFFF' },
];

const PREMIUM_THEMES = [
  { id: 'winter',         label: 'Winter',         emoji: '❄️',  bg: '#1A5EA8', textColor: '#FFFFFF' },
  { id: 'dieren',         label: 'Dieren & Natuur', emoji: '🦎', bg: '#2E8B3F', textColor: '#FFFFFF' },
  { id: 'voertuigen',     label: 'Voertuigen',      emoji: '🚗', bg: '#2D2B55', textColor: '#F5C400' },
  { id: 'verkeersborden', label: 'Verkeersborden',  emoji: '⚠️', bg: '#F7F7F7', textColor: '#1A1A1A', border: '#E02020' },
];

export default function ThemeSelectScreen({ playerCount, playerColors, onSelect, onBack }) {
  const [selectedTheme, setSelectedTheme] = useState(null);

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

  const renderButton = (theme) => (
    <TouchableOpacity
      key={theme.id}
      activeOpacity={0.82}
      style={[
        styles.button,
        { backgroundColor: theme.bg },
        theme.border && { borderWidth: 3, borderColor: theme.border },
      ]}
      onPress={() => setSelectedTheme(theme.id)}
    >
      <Text style={styles.buttonEmoji}>{theme.emoji}</Text>
      <Text style={[styles.buttonText, { color: theme.textColor }]}>{theme.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Kies een thema</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>GRATIS</Text>
        <View style={styles.lijst}>
          {FREE_THEMES.map(renderButton)}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLijn} />
          <Text style={styles.dividerTekst}>PREMIUM</Text>
          <View style={styles.dividerLijn} />
        </View>

        <View style={styles.lijst}>
          {PREMIUM_THEMES.map(renderButton)}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  backButton: { width: 40 },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  lijst: {
    gap: 12,
  },
  button: {
    width: BUTTON_W,
    height: 80,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonEmoji: {
    fontSize: 28,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 10,
  },
  dividerLijn: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#CCCCCC',
    borderRadius: 1,
  },
  dividerTekst: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 1.2,
  },
});
