import { useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import ThemeCarousel from '../src/components/ThemeCarousel';
import GlossyButton from '../src/components/GlossyButton';
import { getThemeCardImage } from '../assets/images/theme-cards/themeCardImages';
import {
  createGameConfig,
  DEFAULT_ZICHTBAARHEID,
  WINCONDITION_OPTIONS,
} from './gameFlowConfig';
import { THEMES } from './themeCatalog';
import { generateLobbyCode } from '../src/utils/lobbyCode';

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  premium: theme.premium,
}));

const GAME_MODE_CARDS = [
  {
    id: 'klassiek',
    title: 'Klassiek',
    subtitle: 'Iedereen speelt een eigen kaart.',
    surface: '#5fd2ff',
    border: '#176fb3',
  },
  {
    id: 'claim',
    title: 'Claim',
    subtitle: 'Claim vakjes live tegen elkaar.',
    surface: '#ff8d76',
    border: '#c44a37',
  },
  {
    id: 'collectief',
    title: 'Collectief',
    subtitle: 'Werk samen op dezelfde voortgang.',
    surface: '#7bdc96',
    border: '#28985a',
  },
  {
    id: 'wegenkaart',
    title: 'Wegenkaart',
    subtitle: 'Gebruik alleen de seed, zonder live sync.',
    surface: '#ffcc6b',
    border: '#cb8a19',
  },
];

export default function HostSetupScreen({ navigation }) {
  const { height: screenHeight } = useWindowDimensions();
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(true);
  const [selectedGameModeIndex, setSelectedGameModeIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wincondition, setWincondition] = useState('1rij');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');

  const collapsedPanelHeight = 58;
  const expandedPanelHeight = Math.min(360, screenHeight * 0.42);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const selectedTheme = THEME_CARDS[selectedThemeIndex] ?? THEME_CARDS[0];
  const selectedGameMode = GAME_MODE_CARDS[selectedGameModeIndex] ?? GAME_MODE_CARDS[0];
  const isSelectedGameModeAllowed = useMemo(
    () => (
      liveSyncEnabled
        ? selectedGameMode?.id !== 'wegenkaart'
        : selectedGameMode?.id === 'wegenkaart'
    ),
    [liveSyncEnabled, selectedGameMode?.id]
  );

  const canGenerate = useMemo(
    () => Boolean(selectedTheme?.id && !selectedTheme?.premium && selectedGameMode?.id && isSelectedGameModeAllowed),
    [selectedTheme?.id, selectedTheme?.premium, selectedGameMode?.id, isSelectedGameModeAllowed]
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

  function toggleLiveSync() {
    void Haptics.selectionAsync();
    setLiveSyncEnabled((current) => !current);
  }

  function handleGenerateCode() {
    if (!canGenerate) {
      return;
    }

    const syncType = liveSyncEnabled ? 'live' : 'geen';
    const seed = Math.floor(Math.random() * 2 ** 16);
    const salt = Math.floor(Math.random() * 2 ** 6);
    const lobbyCode = generateLobbyCode({
      thema: selectedTheme.id,
      gameMode: selectedGameMode.id,
      syncType: syncType === 'live' ? 'live' : 'offline',
      seed,
      salt,
    });

    const config = createGameConfig({
      thema: selectedTheme.id,
      wincondition,
      diagonaal,
      kaartOpzet,
      modus: selectedGameMode.id,
      syncType,
      lobbyCode,
      seed,
      salt,
      aantalSpelersOpDitApparaat: 1,
      zichtbaarheid: liveSyncEnabled
        ? { ...DEFAULT_ZICHTBAARHEID }
        : { eigenVoortgang: false, andermansVoortgang: false },
      spelers: [],
    });

    navigation.navigate('Lobby', { config });
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
              <Text style={styles.title}>Host setup</Text>
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

            <View style={styles.liveSyncWrap}>
              <Pressable onPress={toggleLiveSync} style={styles.liveSyncToggleStack}>
                <View style={[styles.toggleShell, liveSyncEnabled && styles.toggleShellActive]}>
                  <Animated.View style={[styles.toggleKnob, liveSyncEnabled && styles.toggleKnobActive]} />
                </View>
                <Text style={styles.liveSyncTitle}>Live sync</Text>
              </Pressable>
            </View>

            <View style={styles.modeCarouselWrap}>
              <ThemeCarousel
                items={GAME_MODE_CARDS}
                itemSpacing={10}
                itemWidth={190}
                keyExtractor={(item) => item.id}
                onSnapToItem={setSelectedGameModeIndex}
                renderCard={({ item, isFocused }) => (
                  <GameModeCard
                    item={item}
                    isFocused={isFocused}
                    enabled={liveSyncEnabled ? item.id !== 'wegenkaart' : item.id === 'wegenkaart'}
                  />
                )}
              />
            </View>

            <View style={styles.actionStack}>
              <GlossyButton
                label="Genereer code"
                variant="blue"
                size="large"
                onPress={handleGenerateCode}
                disabled={!canGenerate}
              />
            </View>
          </View>

          <View pointerEvents={settingsOpen ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
            </Animated.View>
          </View>
        </SafeAreaView>

        <View pointerEvents="box-none" style={styles.bottomDock}>
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
              <Text style={styles.panelHeaderText}>Game instellingen</Text>
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
                  <ChoiceChip
                    label="Ander thema"
                    selected={kaartOpzet === 'ander-thema'}
                    onPress={() => setKaartOpzet('ander-thema')}
                  />
                </View>
              </View>
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
              <Text style={[styles.carouselCardTitle, item.id === 'winter' && styles.carouselCardTitleDark]}>
                {item.title}
              </Text>
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

function ChoiceChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function GameModeCard({ item, isFocused, enabled }) {
  return (
    <View style={[styles.modeCarouselCardShell, { shadowColor: item.border }, !enabled && styles.modeCarouselCardShellDisabled]}>
      <View style={[styles.modeCarouselCardOutline, { backgroundColor: item.border }]}>
        <LinearGradient
          colors={[item.surface, '#ffffff']}
          locations={[0, 1]}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.88, y: 1 }}
          style={[
            styles.modeCarouselCardBody,
            isFocused && styles.modeCarouselCardBodyFocused,
            !enabled && styles.modeCarouselCardBodyDisabled,
          ]}
        >
          <View style={[styles.modeCarouselCardGlow, { backgroundColor: item.surface }]} />
          <Text style={styles.modeCarouselCardTitle}>{item.title}</Text>
          <Text style={[styles.modeCarouselCardSubtitle, !enabled && styles.modeCarouselCardSubtitleDisabled]}>
            {item.subtitle}
          </Text>
        </LinearGradient>
      </View>
    </View>
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
    paddingBottom: 138,
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
  liveSyncWrap: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSyncToggleStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 112,
  },
  liveSyncTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#144766',
    textAlign: 'center',
  },
  toggleShell: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#9cb5c5',
    backgroundColor: '#d8e4ed',
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  toggleShellActive: {
    backgroundColor: '#74cef7',
    borderColor: '#0f6ca1',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#1a3a6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  modeCarouselWrap: {
    marginTop: 16,
    marginHorizontal: -24,
  },
  modeCarouselCardShell: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  modeCarouselCardShellDisabled: {
    opacity: 0.46,
  },
  modeCarouselCardOutline: {
    padding: 3,
    borderRadius: 24,
  },
  modeCarouselCardBody: {
    width: 190,
    height: 146,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
  },
  modeCarouselCardBodyFocused: {
    transform: [{ scale: 1.01 }],
  },
  modeCarouselCardBodyDisabled: {
    transform: [{ scale: 0.98 }],
  },
  modeCarouselCardGlow: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    height: 46,
    borderRadius: 18,
    opacity: 0.16,
  },
  modeCarouselCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 25,
    color: '#133f5a',
    textAlign: 'center',
  },
  modeCarouselCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3a6076',
    textAlign: 'center',
  },
  modeCarouselCardSubtitleDisabled: {
    color: '#60798c',
  },
  actionStack: {
    gap: 20,
    marginTop: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.32)',
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
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
