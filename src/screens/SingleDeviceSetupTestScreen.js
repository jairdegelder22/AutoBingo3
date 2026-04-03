import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeCarousel from '../components/ThemeCarousel';
import GlossyButton from '../components/GlossyButton';
import { PLAYER_IMAGES } from '../../assets/images/players/playerImages';
import { getThemeCardImage } from '../../assets/images/theme-cards/themeCardImages';
import { createGameConfig, WINCONDITION_OPTIONS } from '../../screens/gameFlowConfig';
import { THEMES } from '../../screens/themeCatalog';

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  premium: theme.premium,
}));

export default function SingleDeviceSetupTestScreen({ navigation }) {
  const { height: screenHeight } = useWindowDimensions();
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [playerCount, setPlayerCount] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wincondition, setWincondition] = useState('1rij');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');

  const collapsedPanelHeight = 58;
  const expandedPanelHeight = Math.min(360, screenHeight * 0.42);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const selectedTheme = THEME_CARDS[selectedThemeIndex] ?? THEME_CARDS[0];

  const canStart = useMemo(
    () => Boolean(selectedTheme?.id && playerCount && !selectedTheme?.premium),
    [playerCount, selectedTheme?.id, selectedTheme?.premium]
  );

  function animateSettings(open) {
    setSettingsOpen(open);

    Animated.parallel([
      Animated.timing(panelHeight, {
        toValue: open ? expandedPanelHeight : collapsedPanelHeight,
        duration: open ? 280 : 220,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 220 : 180,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function openSettings() {
    void Haptics.selectionAsync();
    animateSettings(true);
  }

  function closeSettings() {
    animateSettings(false);
  }

  function handlePlayerCountSelect(nextCount) {
    void Haptics.selectionAsync();
    setPlayerCount(nextCount);
    if (nextCount === 1) {
      setKaartOpzet('zelfde');
    }
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    const config = createGameConfig({
      thema: selectedTheme.id,
      wincondition,
      diagonaal,
      kaartOpzet: playerCount === 2 ? kaartOpzet : 'zelfde',
      modus: 'solo',
      syncType: 'geen',
      aantalSpelersOpDitApparaat: playerCount,
      spelers: [],
    });

    navigation.navigate('Spel', { config });
  }

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={['#f7fbff', '#eef6fd', '#f8fbff']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeAreaContent}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
                <Text style={styles.backText}>Terug</Text>
              </TouchableOpacity>
              <Text style={styles.title}>1 apparaat test</Text>
              <View style={styles.backSpacer} />
            </View>

            <View style={styles.topBlock}>
              <ThemeCarousel
                items={THEME_CARDS}
                itemSpacing={10}
                itemWidth={214}
                keyExtractor={(item) => item.id}
                onSnapToItem={setSelectedThemeIndex}
                renderCard={({ item }) => <ThemeCard item={item} />}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.playerSection}>
              <PlayerCountCard
                label="1 speler"
                selected={playerCount === 1}
                imageSources={[PLAYER_IMAGES.oranje]}
                onPress={() => handlePlayerCountSelect(1)}
              />
              <View style={styles.playerDivider} />
              <PlayerCountCard
                label="2 spelers"
                selected={playerCount === 2}
                imageSources={[PLAYER_IMAGES.oranje, PLAYER_IMAGES.blauw]}
                onPress={() => handlePlayerCountSelect(2)}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.actionStack}>
              <GlossyButton label="Play" variant="blue" size="large" onPress={handleStart} disabled={!canStart} />
            </View>
          </View>

          <View pointerEvents={settingsOpen ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
            </Animated.View>
          </View>
        </SafeAreaView>

        <View
          pointerEvents="box-none"
          style={styles.bottomDock}
        >
          <Animated.View
            style={[
              styles.panelShell,
              settingsOpen ? styles.panelShellOpen : styles.panelShellClosed,
              { height: panelHeight },
            ]}
          >
            <Pressable
              onPress={settingsOpen ? closeSettings : openSettings}
              style={[
                styles.panelHeader,
                settingsOpen ? styles.panelHeaderOpen : styles.panelHeaderClosed,
              ]}
            >
              <Text style={styles.panelHeaderText}>Gameinstellingen</Text>
            </Pressable>

            <Animated.View
              pointerEvents={settingsOpen ? 'auto' : 'none'}
              style={[
                styles.panelContent,
                {
                  opacity: backdropOpacity,
                },
              ]}
            >
              <View style={styles.sheetDivider} />

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Winconditie</Text>
                <View style={styles.choiceRow}>
                  {WINCONDITION_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.id}
                      label={option.label}
                      selected={wincondition === option.id}
                      onPress={() => setWincondition(option.id)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Diagonaal</Text>
                <View style={styles.choiceRow}>
                  <ChoiceChip label="Aan" selected={diagonaal} onPress={() => setDiagonaal(true)} />
                  <ChoiceChip label="Uit" selected={!diagonaal} onPress={() => setDiagonaal(false)} />
                </View>
              </View>

              {playerCount === 2 ? (
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Kaartopzet</Text>
                  <View style={styles.choiceRow}>
                    <ChoiceChip
                      label="Zelfde kaart"
                      selected={kaartOpzet === 'zelfde'}
                      onPress={() => setKaartOpzet('zelfde')}
                    />
                    <ChoiceChip
                      label="Andere kaart"
                      selected={kaartOpzet === 'anders'}
                      onPress={() => setKaartOpzet('anders')}
                    />
                  </View>
                </View>
              ) : null}
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

function ThemeCard({ item }) {
  const themeImage = getThemeCardImage(item.id);

  return (
    <View style={[styles.carouselCardShell, { shadowColor: item.border }]}>
      <View style={[styles.carouselCardOutline, { backgroundColor: item.border }]}>
        {themeImage ? (
          <ImageBackground
            source={themeImage}
            resizeMode="cover"
            imageStyle={styles.carouselCardImage}
            style={styles.carouselCardBody}
          >
            <View style={styles.carouselCardOverlay} />
            {item.premium ? (
              <View style={styles.carouselCardPremiumBadge}>
                <Text style={styles.carouselCardPremiumText}>Locked</Text>
              </View>
            ) : null}
            <View style={styles.carouselCardLabelWrap}>
              <Text style={[styles.carouselCardTitle, item.id === 'winter' && styles.carouselCardTitleDark]}>{item.title}</Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.carouselCardBody, { backgroundColor: item.surface }]}>
            {item.premium ? (
              <View style={styles.carouselCardPremiumBadge}>
                <Text style={styles.carouselCardPremiumText}>Locked</Text>
              </View>
            ) : null}
            <Text style={[styles.carouselCardTitle, item.id === 'winter' && styles.carouselCardTitleDark]}>{item.title}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PlayerCountCard({ label, selected, imageSources, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.playerCard, selected && styles.playerCardSelected]}>
      <View style={styles.playerImageRow}>
        {imageSources.map((source, index) => (
          <Image
            key={`${label}-${index}`}
            source={source}
            resizeMode="contain"
            style={[styles.playerImage, index > 0 && styles.playerImageOverlap]}
          />
        ))}
      </View>
      <Text style={[styles.playerLabel, selected && styles.playerLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function ChoiceChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  background: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    minWidth: 50,
  },
  backText: {
    fontSize: 16,
    color: '#1f5572',
    fontWeight: '600',
  },
  backSpacer: {
    minWidth: 50,
  },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    color: '#144766',
  },
  topBlock: {
    marginTop: 8,
    marginHorizontal: -24,
  },
  separator: {
    height: 3,
    backgroundColor: '#2f6d8e',
    opacity: 0.85,
    marginTop: 18,
    marginBottom: 18,
    marginHorizontal: 20,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
  },
  playerDivider: {
    width: 3,
    backgroundColor: '#2f6d8e',
    opacity: 0.85,
    borderRadius: 2,
    marginVertical: 20,
  },
  playerCard: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#123d51',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    minHeight: 124,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playerCardSelected: {
    backgroundColor: '#eaf6ff',
    transform: [{ scale: 1.02 }],
  },
  playerImageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 58,
  },
  playerImage: {
    width: 74,
    height: 52,
  },
  playerImageOverlap: {
    marginLeft: -10,
  },
  playerLabel: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#144766',
  },
  playerLabelSelected: {
    color: '#0e5f8f',
  },
  actionStack: {
    gap: 20,
    marginTop: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.32)',
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelShell: {
    overflow: 'hidden',
    backgroundColor: '#fbfdff',
    borderWidth: 1,
    borderColor: '#aebfcb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
  panelShellClosed: {
    borderRadius: 22,
  },
  panelShellOpen: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeader: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfdff',
  },
  panelHeaderClosed: {
    borderRadius: 22,
  },
  panelHeaderOpen: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeaderText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 17,
    color: '#1b3242',
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: '#fbfdff',
  },
  sheetDivider: {
    height: 2,
    backgroundColor: '#243744',
    opacity: 0.9,
    marginBottom: 18,
  },
  sheetSection: {
    gap: 10,
    marginBottom: 18,
  },
  sheetSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#486172',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#eef4f8',
    borderWidth: 1,
    borderColor: '#cad7e0',
  },
  choiceChipSelected: {
    backgroundColor: '#d8eefc',
    borderColor: '#2d7fb2',
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#355366',
  },
  choiceChipTextSelected: {
    color: '#13567f',
  },
  carouselCardShell: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  carouselCardOutline: {
    padding: 3,
    borderRadius: 26,
  },
  carouselCardBody: {
    width: 214,
    height: 250,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  carouselCardImage: {
    borderRadius: 23,
  },
  carouselCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 38, 0.18)',
  },
  carouselCardPremiumBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(12, 25, 35, 0.78)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 2,
  },
  carouselCardPremiumText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  carouselCardLabelWrap: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 28, 42, 0.28)',
  },
  carouselCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  carouselCardTitleDark: {
    color: '#223549',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
  },
});
