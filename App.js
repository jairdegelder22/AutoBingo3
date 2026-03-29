import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Pressable, Animated,
  Image, Dimensions,
} from 'react-native';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import PlayerSelectScreen from './screens/PlayerSelectScreen';
import SettingsScreen from './screens/SettingsScreen';

const { width: W, height: H } = Dimensions.get('window');

const BALK_HOOGTE  = 118;   // gele knoppenbalk
const GROND_HOOGTE = H * 0.09; // zichtbare groene grond boven balk
const HORIZON_Y    = H - BALK_HOOGTE - GROND_HOOGTE; // y-positie horizon

// ─── Lucht (gesimuleerde gradiënt via gestapelde vlakken) ────────────────────
function LuchtAchtergrond() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Diepe lucht bovenaan */}
      <View style={{ flex: 0.18, backgroundColor: '#1756A0' }} />
      {/* Middenlucht */}
      <View style={{ flex: 0.32, backgroundColor: '#2E87D4' }} />
      {/* Lichte lucht */}
      <View style={{ flex: 0.27, backgroundColor: '#6DB8E8' }} />
      {/* Horizon waas */}
      <View style={{ flex: 0.14, backgroundColor: '#A8D8F2' }} />
      {/* Grond */}
      <View style={{ flex: 0.09, backgroundColor: '#4A9A3C' }} />
    </View>
  );
}

// ─── Gras pluisjes langs de horizon ─────────────────────────────────────────
const TUFTS = [
  { l:  '1%', h: 18, k: '#2E7A28' }, { l:  '5%', h: 13, k: '#3E8A32' },
  { l:  '9%', h: 20, k: '#5AAD45' }, { l: '13%', h: 11, k: '#2E7A28' },
  { l: '18%', h: 17, k: '#4A9A3C' }, { l: '22%', h: 14, k: '#3E8A32' },
  { l: '27%', h: 22, k: '#2E7A28' }, { l: '31%', h: 10, k: '#5AAD45' },
  { l: '36%', h: 19, k: '#3E8A32' }, { l: '41%', h: 15, k: '#2E7A28' },
  { l: '46%', h: 12, k: '#4A9A3C' }, { l: '50%', h: 20, k: '#3E8A32' },
  { l: '55%', h: 16, k: '#2E7A28' }, { l: '59%', h: 23, k: '#5AAD45' },
  { l: '64%', h: 11, k: '#4A9A3C' }, { l: '68%', h: 18, k: '#2E7A28' },
  { l: '73%', h: 14, k: '#3E8A32' }, { l: '77%', h: 21, k: '#5AAD45' },
  { l: '82%', h: 13, k: '#2E7A28' }, { l: '86%', h: 17, k: '#4A9A3C' },
  { l: '91%', h: 19, k: '#3E8A32' }, { l: '95%', h: 12, k: '#2E7A28' },
  { l: '98%', h: 16, k: '#5AAD45' },
];

function GrasLaag() {
  return (
    <View style={styles.grasLaag} pointerEvents="none">
      {/* Donkere grondlaag */}
      <View style={styles.grondBasis} />
      {/* Lichtere vlekjes op de grond */}
      <View style={[styles.grasVlek, { left: '8%',  width: '14%' }]} />
      <View style={[styles.grasVlek, { left: '30%', width: '10%' }]} />
      <View style={[styles.grasVlek, { left: '52%', width: '16%' }]} />
      <View style={[styles.grasVlek, { left: '75%', width: '12%' }]} />
      {/* Gras tufts (smalle rechthoekjes die boven de grond uitsteken) */}
      {TUFTS.map((t, i) => (
        <View
          key={i}
          style={[
            styles.grasTuft,
            { left: t.l, height: t.h, backgroundColor: t.k },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Wolk (echte afbeelding, begint verspreid, daarna lus) ──────────────────
function Wolk({ bron, top, breedte, duration, startX }) {
  const x = useRef(new Animated.Value(startX)).current;

  useEffect(() => {
    // Eerst naar rechts vanuit startpositie
    const resterende = Math.max((W + breedte * 1.5 - startX) / (W + breedte * 3) * duration, 2000);
    Animated.timing(x, {
      toValue: W + breedte * 1.5,
      duration: resterende,
      useNativeDriver: true,
    }).start(() => {
      // Daarna oneindige lus links → rechts
      const lus = () => {
        x.setValue(-breedte * 1.5);
        Animated.timing(x, {
          toValue: W + breedte * 1.5,
          duration,
          useNativeDriver: true,
        }).start(lus);
      };
      lus();
    });
  }, []);

  return (
    <Animated.Image
      source={bron}
      style={[
        styles.wolk,
        { top, width: breedte, height: breedte * 0.52, transform: [{ translateX: x }] },
      ]}
      resizeMode="contain"
    />
  );
}

// ─── Knop met scale feedback ──────────────────────────────────────────────────
function Knop({ label, kleur, onPress, stijl, tekstStijl }) {
  const scale = useRef(new Animated.Value(1)).current;

  const indukken = () =>
    Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }).start();
  const loslaten = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.knopBase, { backgroundColor: kleur }, stijl]}
        onPress={onPress}
        onPressIn={indukken}
        onPressOut={loslaten}
      >
        <Text style={[styles.knopTekst, tekstStijl]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Hoofdscherm ─────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold });
  const [scherm, setScherm]  = useState('home');

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY       = useRef(new Animated.Value(-50)).current;
  const logoPuls    = useRef(new Animated.Value(1)).current;
  const balkY       = useRef(new Animated.Value(130)).current;
  const balkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(logoY,       { toValue: 0, duration: 650, useNativeDriver: true }),
      Animated.timing(balkY,       { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(balkOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPuls, { toValue: 1.06, duration: 900,  useNativeDriver: true }),
        Animated.timing(logoPuls, { toValue: 1.00, duration: 900,  useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (scherm === 'playerSelect') {
    return <PlayerSelectScreen onSelect={() => setScherm('home')} onBack={() => setScherm('home')} />;
  }
  if (scherm === 'settings') {
    return <SettingsScreen onBack={() => setScherm('home')} />;
  }

  const lettertype = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Lucht + grond achtergrond ── */}
      <LuchtAchtergrond />

      {/* ── Wolken verspreid over het scherm ── */}
      <Wolk bron={require('./assets/images/wolk1.png')} top={55}  breedte={220} duration={14000} startX={-60}      />
      <Wolk bron={require('./assets/images/wolk2.png')} top={120} breedte={180} duration={20000} startX={W * 0.28} />
      <Wolk bron={require('./assets/images/wolk1.png')} top={70}  breedte={200} duration={17000} startX={W * 0.58} />
      <Wolk bron={require('./assets/images/wolk2.png')} top={160} breedte={160} duration={24000} startX={W * 0.12} />
      <Wolk bron={require('./assets/images/wolk1.png')} top={195} breedte={140} duration={19000} startX={W * 0.72} />

      {/* ── Gras laag langs horizon ── */}
      <GrasLaag />

      {/* ── Diagonale weg (3/4 perspectief) ── */}
      <View style={styles.wegWrapper} pointerEvents="none">
        <View style={styles.weg}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={[styles.wegStreepSegment, { left: i * (W * 0.12) }]} />
          ))}
          <View style={styles.randLijnBoven} />
          <View style={styles.randLijnOnder} />
        </View>
      </View>

      {/* ── Logo (volledige breedte, pulserend) ── */}
      <Animated.View style={[
        styles.logoWrapper,
        {
          opacity: logoOpacity,
          transform: [{ translateY: logoY }, { scale: logoPuls }],
        },
      ]}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ── Onderste knoppenbalk ── */}
      <Animated.View style={[
        styles.balk,
        { opacity: balkOpacity, transform: [{ translateY: balkY }] },
      ]}>
        <Knop
          label="⚙️"
          kleur="#1A5EA8"
          onPress={() => setScherm('settings')}
          stijl={styles.zijknop}
          tekstStijl={{ fontSize: 26 }}
        />
        <Knop
          label="▶  SPELEN!"
          kleur="#2E8B3F"
          onPress={() => setScherm('playerSelect')}
          stijl={styles.speelknop}
          tekstStijl={{ fontFamily: lettertype, fontSize: 22 }}
        />
        <Knop
          label="👑"
          kleur="#D93B2B"
          onPress={() => {}}
          stijl={styles.zijknop}
          tekstStijl={{ fontSize: 26 }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Gras
  grasLaag: {
    position: 'absolute',
    bottom: BALK_HOOGTE - 4,
    left: 0,
    right: 0,
    height: GROND_HOOGTE + 24,  // +24 zodat tufts boven rand uitsteken
    overflow: 'visible',
    zIndex: 4,
  },
  grondBasis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 24,                    // onderste deel is donkere grond
    backgroundColor: '#3E8830',
  },
  grasVlek: {
    position: 'absolute',
    bottom: 4,
    height: GROND_HOOGTE - 8,
    backgroundColor: '#5AAD48',
    borderRadius: 6,
    opacity: 0.55,
  },
  grasTuft: {
    position: 'absolute',
    top: 0,
    width: 7,
    borderRadius: 4,
  },

  // Wolken
  wolk: {
    position: 'absolute',
    zIndex: 3,
  },

  // Logo
  logoWrapper: {
    marginTop: H * 0.06,
    width: W,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: W * 1.28,    // iets breder zodat tekst randen raakt
    height: 280,
  },

  // Weg (diagonaal)
  wegWrapper: {
    position: 'absolute',
    bottom: BALK_HOOGTE + GROND_HOOGTE - 20,
    left: -W * 0.28,
    width: W * 1.6,
    height: 80,
    transform: [{ rotate: '-11deg' }],
    zIndex: 5,
  },
  weg: {
    flex: 1,
    backgroundColor: '#333333',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  wegStreepSegment: {
    position: 'absolute',
    width: W * 0.07,
    height: 5,
    backgroundColor: '#F5C400',
    borderRadius: 3,
    top: 37,
  },
  randLijnBoven: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.65,
  },
  randLijnOnder: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.65,
  },

  // Knoppenbalk
  balk: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5C400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 14,
    zIndex: 20,
  },
  speelknop: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 28,
    minWidth: 170,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  zijknop: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
