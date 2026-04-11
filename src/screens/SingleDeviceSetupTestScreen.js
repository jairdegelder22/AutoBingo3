import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
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
import RemovePlayerIcon from '../components/RemovePlayerIcon';
import { PLAYER_HEX, PLAYER_IMAGES } from '../../assets/images/players/playerImages';
import { getThemeCardImage } from '../../assets/images/theme-cards/themeCardImages';
import { createGameConfig, createPlayer, SKIN_OPTIONS, WINCONDITION_OPTIONS } from '../../screens/gameFlowConfig';
import { THEMES } from '../../screens/themeCatalog';

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  premium: theme.premium,
}));
const MAX_LOCAL_PLAYERS = 2;
const PLAYER_SILHOUETTE_IMAGE = require('../../assets/images/players/player-silhouette.png');
const SCREEN_HORIZONTAL_PADDING = 24;
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 176;
const CAROUSEL_CAR_SIZE = 224;

export default function SingleDeviceSetupTestScreen({ navigation }) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [spelers, setSpelers] = useState([{ ...createPlayer({ skin: 'geel' }), naam: 'Speler 1' }]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('geel');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wincondition, setWincondition] = useState('1rij');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');

  const collapsedPanelHeight = 58;
  const expandedPanelHeight = Math.min(360, screenHeight * 0.42);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const carRefs = useRef([]);
  const selectedTheme = THEME_CARDS[selectedThemeIndex] ?? THEME_CARDS[0];
  const playerCount = spelers.length;
  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const stageCarSize = playerCount >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
  const takenSkins = useMemo(
    () => spelers.filter((_, index) => index !== selectedPlayerIndex).map((player) => player.skin),
    [selectedPlayerIndex, spelers]
  );

  const canStart = useMemo(
    () => Boolean(selectedTheme?.id && playerCount && !selectedTheme?.premium),
    [playerCount, selectedTheme?.id, selectedTheme?.premium]
  );
  const playerStageWidth = Math.max(0, screenWidth - SCREEN_HORIZONTAL_PADDING * 2);
  const laneOffset = playerStageWidth / 4;
  const addButtonTranslateX = playerStageWidth * 0.11;
  const firstPlayerTranslateX = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -laneOffset],
  });
  const addButtonOpacity = playerLayoutProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.2, 0],
  });
  const secondPlayerOpacity = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const secondPlayerScale = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const secondPlayerTranslateY = playerLayoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  useEffect(() => {
    Animated.timing(playerLayoutProgress, {
      toValue: spelers.length >= 2 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playerLayoutProgress, spelers.length]);

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

  function handleAddPlayer() {
    if (spelers.length >= MAX_LOCAL_PLAYERS) {
      return;
    }

    void Haptics.selectionAsync();
    const preferredSkin = SKIN_OPTIONS.find((skin) => !spelers.some((player) => player.skin === skin)) ?? 'blauw';
    setSpelers((current) => [
      ...current,
      { ...createPlayer({ skin: preferredSkin }), naam: `Speler ${current.length + 1}` },
    ]);
  }

  function handleRemovePlayer(index) {
    if (index === 0) {
      return;
    }

    void Haptics.selectionAsync();
    setSpelers((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setKaartOpzet('zelfde');
  }

  function animatePickerOpen(index) {
    const targetRef = carRefs.current[index];
    targetRef?.measureInWindow?.((x, y, width) => {
      const sourceSize = spelers.length >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
      const measuredWidth = width || sourceSize;
      const sourceLeft = x + (measuredWidth - sourceSize) / 2;
      const destinationLeft = (screenWidth - sourceSize) / 2;

      setHeroTop(y);
      setTransitionSourceLeft(sourceLeft);
      setTransitionSkin(spelers[index]?.skin ?? 'geel');
      setTransitionCarSize(sourceSize);
      setSelectedPlayerIndex(index);
      setSkinPickerMounted(true);
      overlayOpacity.setValue(0);
      carouselOpacity.setValue(0);
      transitionOpacity.setValue(1);
      transitionTranslateX.setValue(0);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(carouselOpacity, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(transitionOpacity, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(transitionTranslateX, {
            toValue: destinationLeft - sourceLeft,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }

  function animatePickerClose(nextSkin) {
    const closingPlayerIndex = selectedPlayerIndex;
    if (closingPlayerIndex === null) {
      return;
    }

    transitionOpacity.setValue(1);
    transitionTranslateX.stopAnimation();

    if (nextSkin) {
      setTransitionSkin(nextSkin);
      setSpelers((current) => current.map((player, index) => (
        index === closingPlayerIndex ? { ...player, skin: nextSkin } : player
      )));
    }

    Animated.parallel([
      Animated.timing(carouselOpacity, {
        toValue: 0,
        duration: 90,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionTranslateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedPlayerIndex(null);
      setSkinPickerMounted(false);
    });
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
      spelers,
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

            <View style={styles.playerStageSection}>
              <Animated.View
                style={[
                  styles.playerStageSlot,
                  { transform: [{ translateX: firstPlayerTranslateX }] },
                ]}
              >
                <View ref={(node) => { carRefs.current[0] = node; }} collapsable={false}>
                  <Pressable
                    style={[styles.heroCarButton, skinPickerMounted && selectedPlayerIndex === 0 ? styles.heroCarButtonHidden : null]}
                    onPress={() => animatePickerOpen(0)}
                  >
                    <PlayerAvatar skin={spelers[0]?.skin} size={stageCarSize} />
                  </Pressable>
                </View>
              </Animated.View>

              <View
                pointerEvents="box-none"
                style={[
                  styles.playerStageSlot,
                  { transform: [{ translateX: laneOffset }] },
                ]}
              >
                <Animated.View
                  pointerEvents={spelers.length >= 2 || skinPickerMounted ? 'none' : 'auto'}
                  style={[
                    styles.stageOverlay,
                    {
                      opacity: skinPickerMounted ? 0 : addButtonOpacity,
                      transform: [{ translateX: addButtonTranslateX }],
                    },
                  ]}
                >
                  <AddPlayerButton visible={spelers.length < 2} onPress={handleAddPlayer} />
                </Animated.View>

                {spelers[1] ? (
                  <Animated.View
                    style={[
                      styles.stageOverlay,
                      {
                        opacity: secondPlayerOpacity,
                        transform: [
                          { translateY: secondPlayerTranslateY },
                          { scale: secondPlayerScale },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.secondaryPlayerWrap}>
                      <View ref={(node) => { carRefs.current[1] = node; }} collapsable={false}>
                        <Pressable
                          style={[
                            styles.secondaryCarButton,
                            skinPickerMounted && selectedPlayerIndex === 1 ? styles.heroCarButtonHidden : null,
                          ]}
                          onPress={() => animatePickerOpen(1)}
                        >
                          <PlayerAvatar skin={spelers[1]?.skin} size={stageCarSize} />
                        </Pressable>
                      </View>
                      <Pressable
                        style={[
                          styles.removeButton,
                          skinPickerMounted && selectedPlayerIndex === 1 ? styles.removeButtonHidden : null,
                        ]}
                        onPress={() => handleRemovePlayer(1)}
                      >
                        <RemovePlayerIcon size={34} />
                      </Pressable>
                    </View>
                  </Animated.View>
                ) : null}
              </View>
            </View>

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

        <SkinCarouselModal
          visible={skinPickerMounted && selectedPlayer !== null}
          selectedSkin={selectedPlayer?.skin ?? 'geel'}
          takenSkins={takenSkins}
          heroTop={heroTop}
          overlayOpacity={overlayOpacity}
          carouselOpacity={carouselOpacity}
          onClose={() => animatePickerClose()}
          onSelectSkin={(skin) => animatePickerClose(skin)}
        />

        {skinPickerMounted && selectedPlayer !== null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.transitionCar,
              {
                top: heroTop,
                left: transitionSourceLeft,
                opacity: transitionOpacity,
                transform: [{ translateX: transitionTranslateX }],
              },
            ]}
          >
            <PlayerAvatar skin={transitionSkin} size={transitionCarSize} />
          </Animated.View>
        ) : null}

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

function PlayerAvatar({ skin = 'geel', size = 96, style }) {
  return (
    <Image
      source={PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.geel}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}

function AddPlayerButton({ visible, onPress }) {
  if (!visible) {
    return null;
  }

  return (
    <Pressable style={styles.addPlayerButton} onPress={onPress}>
      <Image source={PLAYER_SILHOUETTE_IMAGE} style={styles.addPlayerButtonImage} resizeMode="contain" />
    </Pressable>
  );
}

function SkinCarouselModal({
  visible,
  selectedSkin,
  takenSkins,
  heroTop,
  overlayOpacity,
  carouselOpacity,
  onClose,
  onSelectSkin,
}) {
  const orderedSkins = useMemo(
    () => [selectedSkin, ...SKIN_OPTIONS.filter((skin) => skin !== selectedSkin)],
    [selectedSkin]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
    }
  }, [visible]);

  const activeSkin = orderedSkins[activeIndex] ?? selectedSkin;
  const activeSkinTaken = takenSkins.includes(activeSkin) && activeSkin !== selectedSkin;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalBackdrop, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              paddingTop: heroTop,
              opacity: carouselOpacity,
              transform: [
                {
                  scale: carouselOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <ThemeCarousel
            items={orderedSkins}
            itemWidth={224}
            itemSpacing={0}
            onSnapToItem={setActiveIndex}
            keyExtractor={(item) => item}
            containerStyle={styles.carouselWrap}
            flatListProps={{ initialScrollIndex: 0 }}
            renderCard={({ item, isFocused }) => (
              <View
                style={[
                  styles.carouselCardShellPicker,
                  { shadowColor: PLAYER_HEX[item] ?? PLAYER_HEX.geel },
                  !isFocused && styles.carouselCardShellMuted,
                ]}
              >
                <View
                  style={[
                    styles.carouselCardPicker,
                    takenSkins.includes(item) && item !== selectedSkin ? styles.carouselCardTaken : null,
                  ]}
                >
                  <PlayerAvatar skin={item} size={CAROUSEL_CAR_SIZE} />
                </View>
              </View>
            )}
          />

          <Pressable
            style={[styles.selectButton, activeSkinTaken && styles.selectButtonDisabled]}
            onPress={() => {
              if (!activeSkinTaken) {
                onSelectSkin(activeSkin);
              }
            }}
            disabled={activeSkinTaken}
          >
            <Text style={styles.selectButtonText}>Selecteer</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
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
    paddingBottom: 152,
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
  actionStack: {
    gap: 20,
    marginTop: 8,
  },
  playerStageSection: {
    height: 224,
    position: 'relative',
    marginTop: 24,
    marginBottom: 8,
  },
  playerStageSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  stageOverlay: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: -8,
  },
  heroCarButtonHidden: {
    opacity: 0,
  },
  secondaryPlayerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  secondaryCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlayerButton: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 49,
  },
  addPlayerButtonImage: {
    width: 62,
    height: 62,
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    bottom: 28,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonHidden: {
    opacity: 0,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.78)',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  carouselWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardShellPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  carouselCardShellMuted: {
    opacity: 0.55,
  },
  carouselCardPicker: {
    width: CAROUSEL_CAR_SIZE,
    height: CAROUSEL_CAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardTaken: {
    opacity: 0.32,
  },
  selectButton: {
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#155E75',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: '#0B3550',
  },
  selectButtonDisabled: {
    opacity: 0.4,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  transitionCar: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
