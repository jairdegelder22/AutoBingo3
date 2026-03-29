import { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { useFonts as useNunito, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import * as Haptics from 'expo-haptics';
import BingoCardScreen from './BingoCardScreen';
import ScreenTransitionLayer, {
  CENTER_CIRCLE,
  getCoverCircleFromRect,
  getCircleFromRect,
  getBigHoleRect,
  measureNodeRect,
} from '../components/ScreenTransitionLayer';
import {
  preloadBingoAssets,
  preloadColorSelectAssets,
} from '../utils/preloadAssets';

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

export default function ThemeSelectScreen({ playerCount, playerColors, onBack }) {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [nunitoLoaded]  = useNunito({ Nunito_600SemiBold });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [transitionState, setTransitionState] = useState({
    zichtbaar: false,
    kleur: '#1A5EA8',
    vanRect: getBigHoleRect(),
    naarRect: CENTER_CIRCLE,
  });

  const transitionProgress = useRef(new Animated.Value(0)).current;
  const transitionBusy = useRef(false);
  const themeRefs = useRef({});

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
  const nunito  = nunitoLoaded  ? 'Nunito_600SemiBold'    : undefined;

  const renderButton = (theme) => (
    <View
      key={theme.id}
      ref={(node) => {
        themeRefs.current[theme.id] = node;
      }}
      collapsable={false}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        style={[
          styles.button,
          { backgroundColor: theme.bg },
          theme.border && { borderWidth: 2.5, borderColor: theme.border },
        ]}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          startTransition(
            themeRefs.current[theme.id],
            theme.bg,
            () => setSelectedTheme(theme.id),
            () => preloadBingoAssets(theme.id, playerColors)
          );
        }}
      >
        <Text style={styles.buttonEmoji}>{theme.emoji}</Text>
        <Text style={[styles.buttonText, { color: theme.textColor, fontFamily: fredoka }]}>
          {theme.label}
        </Text>
      </TouchableOpacity>
    </View>
  );

  let content = null;

  if (selectedTheme) {
    content = (
      <BingoCardScreen
        theme={selectedTheme}
        playerCount={playerCount}
        playerColors={playerColors}
        onBack={() => setSelectedTheme(null)}
      />
    );
  } else {
    content = (
      <>
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
