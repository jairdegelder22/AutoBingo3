import { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Pressable, Animated, Easing,
  Image, Dimensions, ImageBackground,
} from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import PlayerSelectScreen from './screens/PlayerSelectScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScreenTransitionLayer, {
  CENTER_CIRCLE,
  getCoverCircleFromRect,
  getCircleFromRect,
  getBigHoleRect,
  measureNodeRect,
} from './components/ScreenTransitionLayer';
import {
  preloadHomeAssets,
  preloadPlayerSelectAssets,
} from './utils/preloadAssets';

const { width: W, height: H } = Dimensions.get('window');

// ─── Knop met scale animatie ──────────────────────────────────────────────────
function Knop({ label, kleur, tekstKleur, onPress, stijl, tekstStijl, targetRef }) {
  const scale = useRef(new Animated.Value(1)).current;
  const gestart = useRef(false);

  const indukken = () =>
    Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }).start();
  const loslaten = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start(() => {
      gestart.current = false;
    });

  return (
    <Animated.View
      ref={targetRef}
      collapsable={false}
      style={{ transform: [{ scale }] }}
    >
      <Pressable
        style={[styles.knopBase, { backgroundColor: kleur }, stijl]}
        onPress={() => {}}
        onPressIn={() => {
          indukken();
          if (gestart.current) return;
          gestart.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressOut={loslaten}
      >
        <Text style={[styles.knopTekst, { color: tekstKleur ?? '#FFFDF7' }, tekstStijl]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PulseLogo() {
  const idleScale = useRef(new Animated.Value(1)).current;
  const tapBoost = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animatie = Animated.loop(
      Animated.sequence([
        Animated.timing(idleScale, {
          toValue: 1.025,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleScale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animatie.start();

    return () => {
      animatie.stop();
    };
  }, [idleScale]);

  const combinedScale = Animated.multiply(
    idleScale,
    tapBoost.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08],
    })
  );

  function handlePress() {
    tapBoost.stopAnimation();
    tapBoost.setValue(0);

    Animated.sequence([
      Animated.timing(tapBoost, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tapBoost, {
        toValue: 0,
        friction: 4,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale: combinedScale }] }}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Hoofdscherm ─────────────────────────────────────────────────────────────
export default function App() {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [scherm, setScherm] = useState('home');
  const [transitionState, setTransitionState] = useState({
    zichtbaar: false,
    kleur: '#D93B2B',
    vanRect: getBigHoleRect(),
    naarRect: CENTER_CIRCLE,
  });

  const transitionProgress = useRef(new Animated.Value(0)).current;
  const transitionBusy = useRef(false);

  const startButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);

  async function startTransition(targetRef, kleur, actie, preload = async () => {}) {
    if (transitionBusy.current) return;

    transitionBusy.current = true;
    setTransitionState({
      zichtbaar: true,
      kleur,
      vanRect: getBigHoleRect(),
      naarRect: CENTER_CIRCLE,
    });

    const doelRect = await measureNodeRect(targetRef, CENTER_CIRCLE);

    setTransitionState({
      zichtbaar: true,
      kleur,
      vanRect: getBigHoleRect(),
      naarRect: doelRect,
    });

    transitionProgress.stopAnimation();
    transitionProgress.setValue(0);

    Animated.timing(transitionProgress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(async () => {
      setTransitionState((vorige) => ({
        ...vorige,
        vanRect: null,
        naarRect: null,
      }));

      actie();

      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      await preload();

      setTransitionState({
        zichtbaar: true,
        kleur,
        vanRect: getCircleFromRect(doelRect),
        naarRect: getCoverCircleFromRect(doelRect),
      });

      transitionProgress.setValue(0);

      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        transitionBusy.current = false;
        setTransitionState((vorige) => ({ ...vorige, zichtbaar: false }));
      });
    });
  }

  const fredoka = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;
  let content = null;

  if (scherm === 'playerSelect') {
    content = (
      <PlayerSelectScreen
        onBack={() => setScherm('home')}
      />
    );
  } else if (scherm === 'settings') {
    content = (
      <SettingsScreen
        onBack={() => setScherm('home')}
      />
    );
  } else {
    content = (
      <ImageBackground
        source={require('./assets/homepage.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar style="dark" />

        <View style={styles.content}>
          {/* Logo in het lucht-gedeelte */}
          <View style={styles.logoArea}>
            <PulseLogo />
          </View>

          {/* Knoppen over het weg/gras-gedeelte */}
          <View style={styles.knoppen}>
            <Knop
              label="Start Spel"
              kleur="#D93B2B"
              onPress={() =>
                startTransition(
                  startButtonRef,
                  '#D93B2B',
                  () => setScherm('playerSelect'),
                  preloadPlayerSelectAssets
                )
              }
              stijl={styles.startKnop}
              tekstStijl={{ fontFamily: fredoka, fontSize: 24, letterSpacing: 0.5 }}
              targetRef={startButtonRef}
            />
            <Knop
              label="Instellingen"
              kleur="#F5C400"
              tekstKleur="#2D2B55"
              onPress={() => startTransition(settingsButtonRef, '#F5C400', () => setScherm('settings'))}
              stijl={styles.instellingenKnop}
              tekstStijl={{ fontFamily: fredoka, fontSize: 18, letterSpacing: 0.5 }}
              targetRef={settingsButtonRef}
            />
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.root}>
      {content}
      {transitionState.zichtbaar && (
        <ScreenTransitionLayer
          progress={transitionProgress}
          color={transitionState.kleur}
          fromRect={transitionState.vanRect}
          toRect={transitionState.naarRect}
        />
      )}
    </View>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
