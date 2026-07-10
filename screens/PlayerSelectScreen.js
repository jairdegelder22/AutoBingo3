import { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from '../src/settings/haptics';
import ColorSelectScreen from './ColorSelectScreen';
import ThemeSelectScreen from './ThemeSelectScreen';
import { PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ScreenTransitionLayer, {
  CENTER_CIRCLE,
  getCoverCircleFromRect,
  getCircleFromRect,
  getBigHoleRect,
  measureNodeRect,
} from '../components/ScreenTransitionLayer';
import {
  preloadColorSelectAssets,
  preloadThemeSelectAssets,
} from '../utils/preloadAssets';

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
  const [transitionState, setTransitionState] = useState({
    zichtbaar: false,
    kleur: '#1A5EA8',
    vanRect: getBigHoleRect(),
    naarRect: CENTER_CIRCLE,
  });

  const transitionProgress = useRef(new Animated.Value(0)).current;
  const transitionBusy = useRef(false);
  const optionRefs = useRef({});

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

  const renderCard = (option) => (
    <View
      key={option.count}
      ref={(node) => {
        optionRefs.current[option.count] = node;
      }}
      collapsable={false}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.card}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          startTransition(
            optionRefs.current[option.count],
            '#1A5EA8',
            () => setPlayerCount(option.count),
            preloadColorSelectAssets
          );
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
    </View>
  );

  let content = null;

  if (playerCount !== null && playerColors !== null) {
    content = (
      <ThemeSelectScreen
        playerCount={playerCount}
        playerColors={playerColors}
        onBack={() => setPlayerColors(null)}
      />
    );
  } else if (playerCount !== null) {
    content = (
      <ColorSelectScreen
        playerCount={playerCount}
        onDone={(targetRef, kleuren) =>
          startTransition(
            targetRef,
            '#D93B2B',
            () => setPlayerColors(kleuren),
            preloadThemeSelectAssets
          )
        }
        onBack={() => setPlayerCount(null)}
      />
    );
  } else {
    content = (
      <>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerText, { fontFamily: fredoka }]}>Aantal spelers</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.body}>
          <View style={styles.grid}>
            {OPTIONS.map(renderCard)}
          </View>
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  headerText: {
    fontSize: 22,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 52,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  backSpacer: { width: 44 },
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
  cardWrapper: {
    width: '46%',
  },
  card: {
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
