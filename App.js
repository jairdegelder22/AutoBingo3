import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Pressable, Animated,
  Image, Dimensions, ImageBackground,
} from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import PlayerSelectScreen from './screens/PlayerSelectScreen';
import SettingsScreen from './screens/SettingsScreen';

const { width: W, height: H } = Dimensions.get('window');

// ─── Knop met scale animatie ──────────────────────────────────────────────────
function Knop({ label, kleur, tekstKleur, onPress, stijl, tekstStijl }) {
  const scale = useRef(new Animated.Value(1)).current;

  const indukken = () =>
    Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }).start();
  const loslaten = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.knopBase, { backgroundColor: kleur }, stijl]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={indukken}
        onPressOut={loslaten}
      >
        <Text style={[styles.knopTekst, { color: tekstKleur ?? '#FFFDF7' }, tekstStijl]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Hoofdscherm ─────────────────────────────────────────────────────────────
export default function App() {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [scherm, setScherm] = useState('home');

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY       = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(contentY,       { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  if (scherm === 'playerSelect') {
    return (
      <PlayerSelectScreen
        onSelect={() => setScherm('home')}
        onBack={() => setScherm('home')}
      />
    );
  }
  if (scherm === 'settings') {
    return <SettingsScreen onBack={() => setScherm('home')} />;
  }

  const fredoka = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;

  return (
    <ImageBackground
      source={require('./assets/homepage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="dark" />

      <Animated.View
        style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}
      >
        {/* Logo in het lucht-gedeelte */}
        <View style={styles.logoArea}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Knoppen over het weg/gras-gedeelte */}
        <View style={styles.knoppen}>
          <Knop
            label="Start Spel"
            kleur="#D93B2B"
            onPress={() => setScherm('playerSelect')}
            stijl={styles.startKnop}
            tekstStijl={{ fontFamily: fredoka, fontSize: 24, letterSpacing: 0.5 }}
          />
          <Knop
            label="Instellingen"
            kleur="#F5C400"
            tekstKleur="#2D2B55"
            onPress={() => setScherm('settings')}
            stijl={styles.instellingenKnop}
            tekstStijl={{ fontFamily: fredoka, fontSize: 18, letterSpacing: 0.5 }}
          />
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  logoArea: {
    height: H * 0.42,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  logo: {
    width: W * 1.2,
    height: H * 0.42,
  },
  knoppen: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  startKnop: {
    width: W * 0.8,
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 7,
  },
  instellingenKnop: {
    width: W * 0.58,
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  knopBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  knopTekst: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});
