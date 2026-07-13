import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from '../settings/haptics';
import ThemeCarousel from '../components/ThemeCarousel';
import GlossyButton from '../components/GlossyButton';
import RemovePlayerIcon from '../components/RemovePlayerIcon';
import AnimatedRouteBackButton from '../components/AnimatedRouteBackButton';
import CircularReveal from '../../components/CircularReveal';
import PremiumPaywallModal from '../premium/PremiumPaywallModal';
import { usePremium } from '../premium/PremiumContext';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../../assets/images/players/playerImages';
import { getThemeCardImage, THEME_LOCK_OVERLAY_IMAGE } from '../../assets/images/theme-cards/themeCardImages';
import { createGameConfig, createPlayer, SKIN_OPTIONS } from '../../screens/gameFlowConfig';
import { THEMES } from '../../screens/themeCatalog';
import { useAppSettings } from '../settings/AppSettingsContext';
import { playSoundEffect, preloadSoundEffect } from '../audio/soundEffects';
import {
  SKIN_CHALLENGES,
  getChallengeProgressValue,
  isChallengeSkin,
  isSkinUnlocked,
  loadSkinChallengeProgress,
} from '../challenges/skinChallenges';

const THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  outline: theme.cardOutline,
  premium: theme.premium,
}));
const MAX_LOCAL_PLAYERS = 2;
const MAX_PLAYER_NAME_LENGTH = 12;
const PLAYER_SILHOUETTE_IMAGE = PLAYER_ADD_SILHOUETTE_IMAGE;
const GAME_SETUP_BACKGROUND = require('../../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const CHALLENGE_SKIN_LOCK_IMAGE = require('../../assets/images/players/challenge-skin-lock.png');
const SETTINGS_CROWN_ICON = require('../../assets/images/settings/crown-logo.png');
const SETTINGS_DIAGONAL_ICON = require('../../assets/images/settings/diagonal-logo.png');
const SETTINGS_RULES_PANEL_IMAGE = require('../../assets/images/settings/rules-menu-panel-v2.png');
const SETTINGS_RULE_SLIDER_FRAME_WINCONDITION = require('../../assets/images/settings/rules-slider-frame-wincondition.png');
const SETTINGS_RULE_SLIDER_FRAME_DIAGONAL = require('../../assets/images/settings/rules-slider-frame-diagonal.png');
const SETTINGS_WIN_CONDITION_TITLE_ICON = require('../../assets/images/settings/win-condition-title.png');
const SETTINGS_DIAGONAL_TITLE_ICON = require('../../assets/images/settings/diagonal-rule-title.png');
const SETTINGS_WIN_ONE_LINE = require('../../assets/images/settings/win-1-line.png');
const SETTINGS_WIN_TWO_LINES = require('../../assets/images/settings/win-2-lines.png');
const SETTINGS_WIN_FULL_CARD = require('../../assets/images/settings/win-full-card.png');
const SETTINGS_DIAGONAL_ON = require('../../assets/images/settings/diagonal-on.png');
const SETTINGS_DIAGONAL_OFF = require('../../assets/images/settings/diagonal-off.png');
const SCREEN_HORIZONTAL_PADDING = 24;
const THEME_CARD_WIDTH = 194;
const THEME_CARD_HEIGHT = Math.round(THEME_CARD_WIDTH * 1.5);
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 176;
const CAROUSEL_CAR_SIZE = 224;
const PLAY_TRANSITION_BLUE = '#1A7BD4';
const BACKGROUND_PLAYER_OPACITY = 0.28;
const CAR_ATTENTION_DELAY_MS = 2600;
const CAR_ATTENTION_STAGGER_MS = 900;
const SETTINGS_WIN_OPTIONS = [
  { id: '1rij', label: '1 rij', image: SETTINGS_WIN_ONE_LINE },
  { id: '2rijen', label: '2 rijen', image: SETTINGS_WIN_TWO_LINES },
  { id: 'heel-blok', label: 'Hele kaart', image: SETTINGS_WIN_FULL_CARD },
];
const SETTINGS_DIAGONAL_OPTIONS = [
  { id: true, label: 'Wel', image: SETTINGS_DIAGONAL_ON },
  { id: false, label: 'Niet', image: SETTINGS_DIAGONAL_OFF },
];
const GAME_SETTINGS_KLAP_IN_SOUND = 'gameSettingsKlapIn';
const GAME_SETTINGS_KLAP_UIT_SOUND = 'gameSettingsKlapUit';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function withAlpha(hexColor, alpha) {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return hexColor;
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function isEmbeddedThemeCard(themeId) {
  return (
    themeId === 'snelweg'
    || themeId === 'stad'
    || themeId === 'platteland'
    || themeId === 'vakantie'
    || themeId === 'voertuigen'
    || themeId === 'winter'
    || themeId === 'verkeersborden'
  );
}

function getEmbeddedThemeTitleStyle(themeId) {
  const compactTitleStyle = themeId === 'verkeersborden'
    ? {
        fontSize: 18,
        lineHeight: 25,
      }
    : themeId === 'voertuigen'
    ? {
        fontSize: 22,
        lineHeight: 30,
      }
    : null;

  if (themeId === 'verkeersborden') {
    return {
      color: '#111111',
      ...compactTitleStyle,
      letterSpacing: 0.5,
      textShadowColor: 'rgba(255, 255, 255, 0.52)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    };
  }

  return {
    color: '#FFFFFF',
    ...compactTitleStyle,
    letterSpacing: 0.5,
    textShadowColor: '#15539D',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };
}

export default function SingleDeviceSetupTestScreen({ navigation, route }) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { isPremium } = usePremium();
  const { settings } = useAppSettings();
  const initialConfig = route?.params?.initialConfig ?? null;
  const initialThemeIndex = Math.max(
    0,
    THEME_CARDS.findIndex((theme) => theme.id === initialConfig?.thema)
  );
  const initialPlayers = initialConfig?.spelers?.length
    ? initialConfig.spelers.map((player, index) => ({
        ...createPlayer({ skin: player.skin ?? (index === 0 ? 'geel' : 'blauw') }),
        ...player,
        naam: player.naam ?? `Speler ${index + 1}`,
      })).slice(0, MAX_LOCAL_PLAYERS)
    : [{ ...createPlayer({ skin: 'geel' }), naam: 'Speler 1' }];
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(initialThemeIndex);
  const [spelers, setSpelers] = useState(initialPlayers);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [focusedNameIndex, setFocusedNameIndex] = useState(null);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('geel');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [wincondition, setWincondition] = useState(initialConfig?.wincondition ?? '1rij');
  const [diagonaal, setDiagonaal] = useState(initialConfig?.diagonaal ?? true);
  const [kaartOpzet, setKaartOpzet] = useState(initialConfig?.kaartOpzet ?? 'zelfde');
  const [pendingGameStart, setPendingGameStart] = useState(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  const scale = clamp(Math.min(screenWidth / 430, screenHeight / 932), 0.88, 1.18);
  const collapsedPanelHeight = Math.round(clamp(screenHeight * 0.078, 66, 88));
  const expandedPanelHeight = Math.round(clamp(screenHeight * 0.74, 560, screenHeight * 0.82));
  const setupMetrics = useMemo(() => ({
    scale,
    panelContentPaddingHorizontal: Math.round(clamp(screenWidth * 0.052, 20, 48)),
    panelContentPaddingTop: Math.round(clamp(screenHeight * 0.013, 10, 18)),
    panelContentPaddingBottom: Math.round(clamp(screenHeight * 0.024, 20, 34)),
    settingsPillIconSize: Math.round(clamp(screenWidth * 0.052, 20, 30)),
    settingsTileSize: Math.round(clamp(screenWidth * 0.22, 78, 118)),
    settingsTileImageSize: Math.round(clamp(screenWidth * 0.16, 58, 86)),
    settingsDiagonalTileSize: Math.round(clamp(screenWidth * 0.23, 84, 124)),
    settingsDiagonalImageSize: Math.round(clamp(screenWidth * 0.17, 64, 92)),
    settingsLabelFontSize: Math.round(clamp(screenWidth * 0.045, 17, 24)),
    settingsTitleIconSize: Math.round(clamp(screenWidth * 0.118, 46, 66)),
    settingsSliderHeight: Math.round(clamp(screenHeight * 0.156, 126, 156)),
    settingsSliderImageSize: Math.round(clamp(screenWidth * 0.155, 58, 78)),
    settingsSliderDiagonalImageSize: Math.round(clamp(screenWidth * 0.178, 68, 92)),
    settingsPillFontSize: Math.round(clamp(screenWidth * 0.035, 14, 19)),
    settingsSectionGap: Math.round(clamp(screenHeight * 0.038, 28, 42)),
    settingsOptionGap: Math.round(clamp(screenWidth * 0.05, 18, 34)),
  }), [scale, screenHeight, screenWidth]);
  const panelHeight = useRef(new Animated.Value(collapsedPanelHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const settingsProgress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const addPlayerFocusOpacity = useRef(new Animated.Value(1)).current;
  const firstPlayerFocusProgress = useRef(new Animated.Value(focusedNameIndex === 0 ? 1 : 0)).current;
  const secondPlayerFocusProgress = useRef(new Animated.Value(focusedNameIndex === 1 ? 1 : 0)).current;
  const playRevealRef = useRef(null);
  const latestPlayPressPointRef = useRef(null);
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const carRefs = useRef([]);
  const selectedTheme = THEME_CARDS[selectedThemeIndex] ?? THEME_CARDS[0];
  const selectedThemeAvailable = !selectedTheme?.premium || isPremium;
  const playerCount = spelers.length;
  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const stageCarSize = playerCount >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
  const takenSkins = useMemo(
    () => spelers.filter((_, index) => index !== selectedPlayerIndex).map((player) => player.skin),
    [selectedPlayerIndex, spelers]
  );

  const canStart = useMemo(
    () => Boolean(selectedTheme?.id && playerCount),
    [playerCount, selectedTheme?.id]
  );
  const settingsPanelTranslateY = settingsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedPanelHeight - collapsedPanelHeight - Math.round(20 * scale), 0],
  });
  const settingsContentTranslateY = settingsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
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
  const isEditingPlayerName = focusedNameIndex !== null;
  const fallbackKeyboardLift = -Math.round(clamp(screenHeight * 0.18, 142, 190));
  const firstPlayerStageTranslateX = Animated.add(
    firstPlayerTranslateX,
    firstPlayerFocusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, laneOffset],
    })
  );
  const firstPlayerStageTranslateY = Animated.multiply(firstPlayerFocusProgress, keyboardLift);
  const firstPlayerStageOpacity = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, BACKGROUND_PLAYER_OPACITY],
  });
  const secondPlayerStageTranslateX = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [laneOffset, 0],
  });
  const secondPlayerStageTranslateY = Animated.multiply(secondPlayerFocusProgress, keyboardLift);
  const secondPlayerStageOpacity = Animated.add(
    secondPlayerOpacity,
    firstPlayerFocusProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BACKGROUND_PLAYER_OPACITY - 1],
    })
  );
  const secondPlayerRemoveOpacity = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0, 0],
  });
  const secondPlayerRemoveScale = secondPlayerFocusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });

  useEffect(() => {
    if (!route?.params?.openSettings) {
      return;
    }

    requestAnimationFrame(() => {
      animateSettings(true);
    });
  }, []);

  useEffect(() => {
    Animated.timing(playerLayoutProgress, {
      toValue: spelers.length >= 2 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playerLayoutProgress, spelers.length]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(firstPlayerFocusProgress, {
        toValue: focusedNameIndex === 0 ? 1 : 0,
        duration: focusedNameIndex === 0 ? 360 : 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(secondPlayerFocusProgress, {
        toValue: focusedNameIndex === 1 ? 1 : 0,
        duration: focusedNameIndex === 1 ? 360 : 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [firstPlayerFocusProgress, focusedNameIndex, secondPlayerFocusProgress]);

  useLayoutEffect(() => {
    if (!pendingGameStart) {
      return;
    }

    playRevealRef.current?.reveal();
  }, [pendingGameStart]);

  useEffect(() => {
    panelHeight.setValue(expandedPanelHeight);
    settingsProgress.setValue(settingsOpen ? 1 : 0);
  }, [collapsedPanelHeight, expandedPanelHeight, panelHeight]);

  useEffect(() => {
    preloadSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND);
    preloadSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND);
  }, []);

  useEffect(() => {
    Animated.timing(addPlayerFocusOpacity, {
      toValue: isEditingPlayerName ? 0 : 1,
      duration: isEditingPlayerName ? 160 : 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [addPlayerFocusOpacity, isEditingPlayerName]);

  useEffect(() => {
    Animated.timing(keyboardLift, {
      toValue: isEditingPlayerName ? fallbackKeyboardLift : 0,
      duration: isEditingPlayerName ? 360 : 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fallbackKeyboardLift, isEditingPlayerName, keyboardLift]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      const lift = -Math.round(clamp(keyboardHeight * 0.42, 126, 190));

      Animated.timing(keyboardLift, {
        toValue: lift,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', (event) => {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: Math.max(event.duration ?? 380, 380),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardLift]);

  function animateSettings(open) {
    if (open) {
      setSettingsPanelVisible(true);
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
    }

    Animated.parallel([
      Animated.timing(settingsProgress, {
        toValue: open ? 1 : 0,
        duration: open ? 440 : 420,
        easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 300 : 360,
        easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished && !open) {
        setSettingsPanelVisible(false);
      }
    });
  }

  function openSettings() {
    void Haptics.selectionAsync();
    void playSoundEffect(GAME_SETTINGS_KLAP_UIT_SOUND, settings);
    animateSettings(true);
  }

  function closeSettings() {
    void playSoundEffect(GAME_SETTINGS_KLAP_IN_SOUND, settings);
    animateSettings(false);
  }

  function dismissNameEditing() {
    Keyboard.dismiss();
    setFocusedNameIndex(null);
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
    dismissNameEditing();
    setSpelers((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setKaartOpzet('zelfde');
  }

  function updatePlayerName(index, naam) {
    setSpelers((current) => current.map((player, currentIndex) => (
      currentIndex === index ? { ...player, naam: naam.slice(0, MAX_PLAYER_NAME_LENGTH) } : player
    )));
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

  function handlePlayPressIn(event) {
    latestPlayPressPointRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
  }

  function handleStart() {
    if (!selectedThemeAvailable) {
      setPremiumModalVisible(true);
      return;
    }

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

    const origin = latestPlayPressPointRef.current ?? {
      x: screenWidth / 2,
      y: screenHeight - 120,
    };

    setPendingGameStart({
      config,
      originX: origin.x,
      originY: origin.y,
      transitionKey: `singleplayer-spel-${Date.now()}`,
    });
  }

  return (
    <View style={styles.safeArea}>
      <ImageBackground
        source={GAME_SETUP_BACKGROUND}
        resizeMode="cover"
        style={styles.background}
      >
        <SafeAreaView style={styles.safeAreaContent}>
          <AnimatedRouteBackButton
            navigation={navigation}
            size={66}
            style={styles.backButton}
          />
          <View style={styles.content}>
            <View style={styles.topBlock}>
              <ThemeCarousel
                items={THEME_CARDS}
                itemSpacing={10}
                itemWidth={THEME_CARD_WIDTH}
                keyExtractor={(item) => item.id}
                onSnapToItem={setSelectedThemeIndex}
                renderCard={({ item }) => (
                  <ThemeCard
                    item={item}
                    isPremium={isPremium}
                    onLockedPress={() => setPremiumModalVisible(true)}
                  />
                )}
              />
            </View>

            <Animated.View style={styles.playerStageSection}>
              <Animated.View
                pointerEvents={focusedNameIndex === 1 ? 'none' : 'auto'}
                style={[
                  styles.playerStageSlot,
                  {
                    opacity: firstPlayerStageOpacity,
                    transform: [
                      { translateX: firstPlayerStageTranslateX },
                      { translateY: firstPlayerStageTranslateY },
                    ],
                    zIndex: focusedNameIndex === 0 ? 5 : 1,
                  },
                ]}
              >
                <View ref={(node) => { carRefs.current[0] = node; }} collapsable={false}>
                  <AttentionCarButton
                    skin={spelers[0]?.skin}
                    size={stageCarSize}
                    style={skinPickerMounted && selectedPlayerIndex === 0 ? styles.heroCarButtonHidden : null}
                    onPress={() => animatePickerOpen(0)}
                    active={!skinPickerMounted && focusedNameIndex !== 1}
                    attentionDelay={0}
                  />
                </View>
                <PlayerNameInput
                  value={spelers[0]?.naam ?? ''}
                  skin={spelers[0]?.skin ?? 'geel'}
                  defaultName="Speler 1"
                  onChangeText={(naam) => updatePlayerName(0, naam)}
                  onFocus={() => setFocusedNameIndex(0)}
                  onBlur={() => setFocusedNameIndex(null)}
                  hidden={skinPickerMounted && selectedPlayerIndex === 0}
                />
              </Animated.View>

              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.playerStageSlot,
                  {
                    transform: [
                      { translateX: secondPlayerStageTranslateX },
                      { translateY: secondPlayerStageTranslateY },
                    ],
                    zIndex: focusedNameIndex === 1 ? 5 : 1,
                  },
                ]}
              >
                <Animated.View
                  pointerEvents={spelers.length >= 2 || skinPickerMounted || isEditingPlayerName ? 'none' : 'auto'}
                  style={[
                    styles.stageOverlay,
                    {
                      opacity: skinPickerMounted ? 0 : Animated.multiply(addButtonOpacity, addPlayerFocusOpacity),
                      transform: [{ translateX: addButtonTranslateX }],
                    },
                  ]}
                >
                  <AddPlayerButton visible={spelers.length < 2} onPress={handleAddPlayer} />
                </Animated.View>

                {spelers[1] ? (
                  <Animated.View
                    pointerEvents={focusedNameIndex === 0 ? 'none' : 'auto'}
                    style={[
                      styles.stageOverlay,
                      {
                        opacity: secondPlayerStageOpacity,
                        transform: [
                          { translateY: secondPlayerTranslateY },
                          { scale: secondPlayerScale },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.secondaryPlayerWrap}>
                      <View ref={(node) => { carRefs.current[1] = node; }} collapsable={false}>
                        <AttentionCarButton
                          skin={spelers[1]?.skin}
                          size={stageCarSize}
                          style={skinPickerMounted && selectedPlayerIndex === 1 ? styles.heroCarButtonHidden : null}
                          onPress={() => animatePickerOpen(1)}
                          active={!skinPickerMounted && focusedNameIndex !== 0}
                          attentionDelay={CAR_ATTENTION_STAGGER_MS}
                        />
                      </View>
                      <PlayerNameInput
                        value={spelers[1]?.naam ?? ''}
                        skin={spelers[1]?.skin ?? 'blauw'}
                        defaultName="Speler 2"
                        onChangeText={(naam) => updatePlayerName(1, naam)}
                        onFocus={() => setFocusedNameIndex(1)}
                        onBlur={() => setFocusedNameIndex(null)}
                        hidden={skinPickerMounted && selectedPlayerIndex === 1}
                      />
                      {skinPickerMounted && selectedPlayerIndex === 1 ? null : (
                        <Animated.View
                          pointerEvents={focusedNameIndex === 1 ? 'none' : 'auto'}
                          style={[
                            styles.removeButton,
                            {
                              opacity: secondPlayerRemoveOpacity,
                              transform: [{ scale: secondPlayerRemoveScale }],
                            },
                          ]}
                        >
                          <Pressable style={styles.removeButtonPressable} onPress={() => handleRemovePlayer(1)}>
                            <RemovePlayerIcon size={34} />
                          </Pressable>
                        </Animated.View>
                      )}
                    </View>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </Animated.View>

            <View style={styles.actionStack}>
              <GlossyButton
                label="Play"
                variant="blue"
                size="large"
                onPressIn={handlePlayPressIn}
                onPress={handleStart}
                disabled={!canStart || !selectedThemeAvailable}
              />
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
            pointerEvents={settingsPanelVisible ? 'auto' : 'none'}
            style={[
              styles.panelShell,
              settingsPanelVisible ? styles.panelShellOpen : styles.panelShellClosed,
              {
                height: expandedPanelHeight,
                transform: [{ translateY: settingsPanelTranslateY }],
              },
            ]}
          >
            <ImageBackground
              pointerEvents="none"
              source={SETTINGS_RULES_PANEL_IMAGE}
              resizeMode="stretch"
              style={styles.rulesPanelImage}
              imageStyle={styles.rulesPanelImageAsset}
            />
            <Pressable
              onPress={settingsOpen ? closeSettings : openSettings}
              style={[
                styles.panelHeader,
                { minHeight: collapsedPanelHeight },
                settingsPanelVisible ? styles.panelHeaderOpen : styles.panelHeaderClosed,
              ]}
            >
              <Text style={styles.panelHeaderText}>Spelregels</Text>
            </Pressable>

            <Animated.View
              pointerEvents={settingsOpen ? 'auto' : 'none'}
              style={[
                styles.panelContent,
                {
                  opacity: settingsProgress,
                  paddingHorizontal: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  transform: [{ translateY: settingsContentTranslateY }],
                },
              ]}
            >
              <View style={[styles.settingsMenuBody, { gap: setupMetrics.settingsSectionGap }]}>
                <SettingsRuleSlider
                  title="Winconditie"
                  titleIcon={SETTINGS_WIN_CONDITION_TITLE_ICON}
                  value={wincondition}
                  options={SETTINGS_WIN_OPTIONS}
                  onChange={setWincondition}
                  metrics={setupMetrics}
                />

                <SettingsRuleSlider
                  title="Diagonaal"
                  titleIcon={SETTINGS_DIAGONAL_TITLE_ICON}
                  value={diagonaal}
                  options={SETTINGS_DIAGONAL_OPTIONS}
                  onChange={setDiagonaal}
                  metrics={setupMetrics}
                  variant="diagonal"
                />
              </View>
            </Animated.View>
          </Animated.View>
          {!settingsPanelVisible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open spelregels"
              onPress={openSettings}
              style={[
                styles.collapsedPanelPressTarget,
                { height: collapsedPanelHeight + Math.round(24 * scale) },
              ]}
            />
          ) : null}
        </View>
      </ImageBackground>
      {pendingGameStart ? (
        <CircularReveal
          key={pendingGameStart.transitionKey}
          ref={playRevealRef}
          color={PLAY_TRANSITION_BLUE}
          originX={pendingGameStart.originX}
          originY={pendingGameStart.originY}
          onComplete={() => {
            navigation.navigate('Spel', {
              config: pendingGameStart.config,
              transition: {
                color: PLAY_TRANSITION_BLUE,
                originX: screenWidth / 2,
                originY: screenHeight / 2,
                routeName: 'Spel',
                pauseMs: 320,
                transitionKey: pendingGameStart.transitionKey,
              },
            });
            setPendingGameStart(null);
          }}
        />
      ) : null}
      <PremiumPaywallModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUnlocked={() => setPremiumModalVisible(false)}
        title="Premium thema"
        message="Dit thema hoort bij Premium. Hosten en premium thema’s zijn daarna meteen vrij."
      />
    </View>
  );
}

function PlayerAvatar({ skin = 'geel', size = 96, style }) {
  const source = PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.geel;
  const shadowWidth = size * 0.76;
  const shadowHeight = size * 0.18;

  return (
    <View style={[styles.playerAvatarWrap, { width: size, height: size }, style]}>
      <Svg
        width={shadowWidth}
        height={shadowHeight}
        viewBox={`0 0 ${shadowWidth} ${shadowHeight}`}
        style={[styles.carGroundShadow, { bottom: size * 0.18 }]}
      >
        <Defs>
          <RadialGradient id="setupCarShadowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#111820" stopOpacity="0.2" />
            <Stop offset="52%" stopColor="#111820" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#111820" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={shadowWidth / 2} cy={shadowHeight / 2} rx={shadowWidth / 2} ry={shadowHeight / 2} fill="url(#setupCarShadowGradient)" />
      </Svg>
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
}

function AttentionCarButton({ skin, size, onPress, active = true, style, attentionDelay = 0 }) {
  const attention = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      attention.stopAnimation();
      attention.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(CAR_ATTENTION_DELAY_MS + attentionDelay),
        Animated.timing(attention, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0.45,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(attention, {
          toValue: 0,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, attention, attentionDelay]);

  const translateY = attention.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const rotate = attention.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-1.8deg', '1.8deg'],
  });

  return (
    <Pressable style={[styles.heroCarButton, style]} onPress={onPress} disabled={!active}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <PlayerAvatar skin={skin} size={size} />
      </Animated.View>
    </Pressable>
  );
}

function PlayerNameInput({
  value,
  skin = 'geel',
  defaultName = 'Speler',
  onChangeText,
  onFocus,
  onBlur,
  hidden = false,
}) {
  const carColor = PLAYER_HEX[skin] ?? PLAYER_HEX.geel ?? '#F5C400';
  const handleFocus = () => {
    onFocus?.();
    if (value === defaultName) {
      onChangeText('');
    }
  };
  const handleBlur = () => {
    if (!value.trim()) {
      onChangeText(defaultName);
    }
    onBlur?.();
  };

  return (
    <Pressable
      onPress={(event) => event.stopPropagation()}
      style={[
        styles.playerNamePlate,
        {
          backgroundColor: carColor,
          shadowColor: carColor,
        },
        hidden && styles.playerNameInputHidden,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 253, 245, 0.98)', 'rgba(255, 246, 225, 0.9)', 'rgba(245, 232, 204, 0.88)']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.playerNamePlateInner}
      >
        <View pointerEvents="none" style={styles.playerNamePlateGloss} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={defaultName}
          placeholderTextColor="rgba(20, 71, 102, 0.55)"
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
          style={styles.playerNameInput}
        />
      </LinearGradient>
    </Pressable>
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
  const [challengeProgress, setChallengeProgress] = useState(null);
  const orderedSkins = useMemo(
    () => [selectedSkin, ...SKIN_OPTIONS.filter((skin) => skin !== selectedSkin)],
    [selectedSkin]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      void loadSkinChallengeProgress().then(setChallengeProgress);
    }
  }, [visible]);

  const activeSkin = orderedSkins[activeIndex] ?? selectedSkin;
  const activeSkinTaken = takenSkins.includes(activeSkin) && activeSkin !== selectedSkin;
  const activeSkinLocked = isChallengeSkin(activeSkin) && !isSkinUnlocked(challengeProgress, activeSkin);

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
                  {isChallengeSkin(item) && !isSkinUnlocked(challengeProgress, item) ? (
                    <Image
                      source={CHALLENGE_SKIN_LOCK_IMAGE}
                      style={styles.challengeSkinLock}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
            )}
          />

          <SkinChallengeProgressPanel
            skin={activeSkin}
            progress={challengeProgress}
          />

          <View style={styles.selectButtonWrap}>
            <GlossyButton
              label="Selecteer"
              variant="green"
              size="normal"
              heightOverride={62}
              horizontalPadding={44}
              onPress={() => onSelectSkin(activeSkin)}
              disabled={activeSkinTaken || activeSkinLocked}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function SkinChallengeProgressPanel({ skin, progress }) {
  const challenge = SKIN_CHALLENGES[skin];

  if (!challenge) {
    return <View style={styles.challengePanelPlaceholder} />;
  }

  const progressValue = getChallengeProgressValue(progress, skin);
  const ratio = progressValue.target > 0 ? progressValue.current / progressValue.target : 1;

  return (
    <View style={styles.challengePanel}>
      <Text style={styles.challengeTitle}>{challenge.title}</Text>
      <Text style={styles.challengeDescription}>{challenge.description}</Text>
      <View style={styles.challengeProgressRow}>
        <View style={styles.challengeProgressTrack}>
          <View
            style={[
              styles.challengeProgressFill,
              { width: `${Math.max(0, Math.min(1, ratio)) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.challengeProgressText}>
          {progressValue.current} / {progressValue.target}
        </Text>
      </View>
    </View>
  );
}

function ThemeCard({ item, isPremium = false, onLockedPress }) {
  const themeImage = getThemeCardImage(item.id);
  const isLocked = item.premium && !isPremium;
  const usesEmbeddedFrame = isEmbeddedThemeCard(item.id);
  const cardBorderColor = item.outline ?? item.border;

  return (
    <View style={styles.carouselCardShell}>
      <View
        style={[
          styles.carouselCardOutline,
          usesEmbeddedFrame
            ? styles.carouselCardOutlineEmbedded
            : { borderColor: isLocked ? withAlpha(cardBorderColor, 0.42) : cardBorderColor },
        ]}
      >
        {themeImage ? (
          <ImageBackground
            source={themeImage}
            resizeMode={usesEmbeddedFrame ? 'contain' : 'cover'}
            imageStyle={[
              styles.carouselCardImage,
              usesEmbeddedFrame && styles.carouselCardImageEmbedded,
            ]}
            style={[
              styles.carouselCardBody,
              usesEmbeddedFrame && styles.carouselCardBodyEmbedded,
            ]}
          >
            {usesEmbeddedFrame ? null : <View style={styles.carouselCardOverlay} />}
            {isLocked ? <View style={styles.carouselCardLockedDim} /> : null}
            {isLocked ? (
              <Pressable accessibilityRole="button" onPress={onLockedPress} style={styles.carouselCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.carouselCardLockOverlay} />
              </Pressable>
            ) : null}
            <View style={[styles.carouselCardTitleWrap, usesEmbeddedFrame && styles.carouselCardTitleWrapEmbedded]}>
              <Text
                style={[
                  styles.carouselCardTitle,
                  usesEmbeddedFrame && getEmbeddedThemeTitleStyle(item.id),
                ]}
              >
                {item.title}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.carouselCardBody, { backgroundColor: item.surface }]}>
            {isLocked ? <View style={styles.carouselCardLockedDim} /> : null}
            {isLocked ? (
              <Pressable accessibilityRole="button" onPress={onLockedPress} style={styles.carouselCardLockPressable}>
                <Image source={THEME_LOCK_OVERLAY_IMAGE} resizeMode="cover" style={styles.carouselCardLockOverlay} />
              </Pressable>
            ) : null}
            <View style={styles.carouselCardTitleWrap}>
              <Text style={styles.carouselCardTitle}>{item.title}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function SettingsRuleSlider({ title, titleIcon, value, options, onChange, metrics, variant = 'win' }) {
  const isDiagonal = variant === 'diagonal';
  const [railWidth, setRailWidth] = useState(0);
  const selectorTranslateX = useRef(new Animated.Value(0)).current;
  const selectorScale = useRef(new Animated.Value(1)).current;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
  const optionCount = options.length;
  const selectorWidth = railWidth > 0 ? railWidth / optionCount : 0;
  const frameSource = isDiagonal
    ? SETTINGS_RULE_SLIDER_FRAME_DIAGONAL
    : SETTINGS_RULE_SLIDER_FRAME_WINCONDITION;
  const frameAspectRatio = isDiagonal ? (919 / 1475) : (935 / 1490);
  const selectorColors = isDiagonal
    ? ['#A553FF', '#7B24D8', '#4F1196']
    : ['#62D629', '#2EAA0F', '#146E06'];
  const titleShadowColor = isDiagonal ? '#4A0A83' : '#155F04';
  const frameWidth = Math.round(clamp(metrics.scale * 346, 314, 382));
  const frameHeight = Math.round(frameWidth * frameAspectRatio);
  const selectorVisualWidth = isDiagonal ? selectorWidth : selectorWidth * 1.06;
  const selectorVisualOffset = isDiagonal ? 0 : selectorWidth * -0.03;

  function animateSelectorToIndex(index) {
    if (!selectorWidth) {
      return;
    }

    Animated.spring(selectorTranslateX, {
      toValue: selectorWidth * index,
      useNativeDriver: true,
      speed: 22,
      bounciness: 7,
    }).start();
  }

  function popSelector(strength = 1.045) {
    Animated.sequence([
      Animated.spring(selectorScale, {
        toValue: strength,
        useNativeDriver: true,
        speed: 34,
        bounciness: 7,
      }),
      Animated.spring(selectorScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 26,
        bounciness: 7,
      }),
    ]).start();
  }

  function handleOptionPress(option, index) {
    if (!option) {
      return;
    }

    selectorTranslateX.stopAnimation();

    if (option.id === value) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateSelectorToIndex(index);
      popSelector(1.035);
      return;
    }

    void Haptics.selectionAsync();
    onChange(option.id);
    animateSelectorToIndex(index);
    popSelector(1.055);
  }

  useEffect(() => {
    animateSelectorToIndex(selectedIndex);
  }, [selectedIndex, selectorWidth]);

  return (
    <View style={styles.settingsRuleSection}>
      <ImageBackground
        source={frameSource}
        resizeMode="stretch"
        style={[
          styles.settingsRuleFrame,
          {
            width: frameWidth,
            height: frameHeight,
          },
        ]}
        imageStyle={styles.settingsRuleFrameImage}
      >
        <View style={styles.settingsRuleTitleOverlay}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.95}
            style={[
              styles.settingsRuleTitle,
              {
                fontSize: Math.round(29 * metrics.scale),
                textShadowColor: titleShadowColor,
              },
            ]}
          >
            {title}
          </Text>
          <Image
            source={titleIcon}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.settingsRuleTitleIcon,
              {
                width: isDiagonal ? Math.round(metrics.settingsTitleIconSize * 1.14) : Math.round(metrics.settingsTitleIconSize * 0.92),
                height: isDiagonal ? Math.round(metrics.settingsTitleIconSize * 0.92) : Math.round(metrics.settingsTitleIconSize * 0.92),
              },
            ]}
          />
        </View>

        <View
          onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
          style={[
            styles.settingsRuleSlider,
            isDiagonal && styles.settingsRuleSliderDiagonal,
          ]}
        >
          {selectorWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.settingsRuleSelector,
                {
                  width: selectorVisualWidth,
                  transform: [
                    { translateX: selectorTranslateX },
                    { translateX: selectorVisualOffset },
                    { scale: selectorScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={selectorColors}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.92, y: 1 }}
                style={styles.settingsRuleSelectorGradient}
              />
            </Animated.View>
          ) : null}

          <View style={styles.settingsRuleOptionsRow}>
            {options.map((option, index) => {
              const selected = option.id === value;
              const isLongLabel = option.label.length >= 9;
              const baseLabelSize = isDiagonal ? 25 : 20;
              const labelSize = option.label.length >= 9
                ? 17
                : baseLabelSize;
              const optionImageSize = isDiagonal
                ? Math.round(metrics.settingsSliderDiagonalImageSize * 0.84)
                : Math.round(metrics.settingsSliderImageSize * (isLongLabel ? 0.82 : 0.88));

              return (
                <Pressable
                  key={String(option.id)}
                  onPress={() => handleOptionPress(option, index)}
                  style={styles.settingsRuleOption}
                >
                  <View style={styles.settingsRuleOptionContent}>
                    <Image
                      source={option.image}
                      resizeMode="contain"
                      fadeDuration={0}
                      style={[
                        styles.settingsRuleOptionImage,
                        {
                          width: optionImageSize,
                          height: optionImageSize,
                        },
                      ]}
                    />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.58}
                      style={[
                        styles.settingsRuleOptionLabel,
                        {
                          fontSize: Math.round(labelSize * metrics.scale),
                          lineHeight: Math.round((labelSize + 9) * metrics.scale),
                        },
                        selected && styles.settingsRuleOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ImageBackground>
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
    paddingTop: 4,
    paddingBottom: 152,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    elevation: 20,
  },
  topBlock: {
    marginTop: 32,
    marginHorizontal: -24,
  },
  actionStack: {
    gap: 20,
    marginTop: -2,
  },
  playerStageSection: {
    height: 252,
    position: 'relative',
    marginTop: 12,
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
  },
  removeButtonPressable: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 31, 0.32)',
  },
  bottomDock: {
    position: 'absolute',
    left: -8,
    right: -8,
    bottom: 0,
  },
  collapsedPanelPressTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelShell: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: '#3B0504',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },
  rulesPanelImage: {
    ...StyleSheet.absoluteFillObject,
  },
  rulesPanelImageAsset: {
    width: '100%',
    height: '100%',
  },
  panelShellClosed: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  panelShellOpen: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeader: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    paddingHorizontal: 68,
    paddingTop: 4,
    paddingBottom: 10,
  },
  panelHeaderClosed: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeaderOpen: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  panelHeaderGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  panelHeaderInner: {
    width: '100%',
    maxWidth: 340,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#082E43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
  },
  panelHeaderShine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 7,
    height: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  panelHeaderText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 34,
    lineHeight: 39,
    color: '#FFFFFF',
    textShadowColor: 'rgba(116, 7, 5, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    zIndex: 2,
    marginTop: 24,
    marginBottom: 0,
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  panelContentGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsMenuBody: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 36,
    paddingBottom: 28,
  },
  settingsRuleSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  settingsRuleFrame: {
    alignItems: 'center',
  },
  settingsRuleFrameImage: {
    width: '100%',
    height: '100%',
  },
  settingsRuleTitleOverlay: {
    position: 'absolute',
    top: '2.3%',
    left: '13.5%',
    right: '13.5%',
    height: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    zIndex: 4,
  },
  settingsRuleTitleRow: {
    width: '92%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    paddingTop: 3,
    paddingLeft: 19,
    paddingRight: 19,
    paddingBottom: 3,
    borderRadius: 15,
    backgroundColor: '#6b0e0e',
    overflow: 'hidden',
    shadowColor: '#6b0e0e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  settingsRuleTitleGloss: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 12,
  },
  settingsRuleTitleShine: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    height: '46%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  settingsRuleTitleShade: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 7,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  settingsRuleTitle: {
    flexShrink: 1,
    fontFamily: 'FredokaOne_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: '#8e1212',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  settingsRuleTitleIcon: {
    marginTop: 1,
    zIndex: 2,
  },
  settingsRuleSlider: {
    position: 'absolute',
    left: '7.4%',
    right: '7.4%',
    top: '37%',
    bottom: '9.2%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 20,
  },
  settingsRuleSliderDiagonal: {
    backgroundColor: 'transparent',
  },
  settingsRuleSliderGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsRuleSelector: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  settingsRuleSelectorGradient: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 0,
    borderColor: '#FF140E',
    shadowColor: '#9F0F08',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  settingsRuleOptionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  settingsRuleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 5,
    overflow: 'hidden',
  },
  settingsRuleOptionContent: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 4,
  },
  settingsRuleOptionImage: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  settingsRuleOptionLabel: {
    width: '100%',
    fontFamily: 'FredokaOne_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(129, 44, 22, 0.48)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  settingsRuleOptionLabelSelected: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(2, 31, 52, 0.72)',
    textShadowRadius: 5,
  },
  carouselCardShell: {
    borderRadius: 26,
  },
  carouselCardOutline: {
    borderWidth: 4,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  carouselCardOutlineEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  carouselCardBody: {
    width: THEME_CARD_WIDTH,
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
  },
  carouselCardBodyEmbedded: {
    height: THEME_CARD_HEIGHT,
    borderRadius: 0,
    overflow: 'visible',
  },
  carouselCardImage: {
    borderRadius: 22,
  },
  carouselCardImageEmbedded: {
    borderRadius: 0,
  },
  carouselCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 38, 0.18)',
  },
  carouselCardLockedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    zIndex: 1,
  },
  carouselCardLockPressable: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  carouselCardLockOverlay: {
    width: '100%',
    height: '100%',
  },
  carouselCardTitleWrap: {
    position: 'absolute',
    top: 26,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  carouselCardTitleWrapEmbedded: {
    top: '1.5%',
    left: '10%',
    right: '10%',
    minHeight: 46,
    justifyContent: 'center',
  },
  carouselCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    lineHeight: 40,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.38)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
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
  challengeSkinLock: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
  },
  carouselCardTaken: {
    opacity: 0.32,
  },
  playerAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carGroundShadow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  playerNamePlate: {
    width: 148,
    minHeight: 42,
    marginTop: -8,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 5,
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  playerNamePlateInner: {
    minHeight: 34,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  playerNamePlateGloss: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 5,
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  playerNameInput: {
    padding: 0,
    margin: 0,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 17,
    lineHeight: 22,
    color: '#144766',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  playerNameInputHidden: {
    opacity: 0,
  },
  selectButtonWrap: {
    minWidth: 220,
  },
  challengePanelPlaceholder: {
    minHeight: 86,
  },
  challengePanel: {
    width: '86%',
    maxWidth: 430,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  challengeTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    lineHeight: 25,
    color: '#FFF7DD',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  challengeDescription: {
    marginTop: 5,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    lineHeight: 17,
    color: '#F4E8CD',
    textAlign: 'center',
    letterSpacing: 0,
  },
  challengeProgressRow: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeProgressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F5C400',
  },
  challengeProgressText: {
    minWidth: 46,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#FFF7DD',
    textAlign: 'right',
    letterSpacing: 0,
  },
  transitionCar: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
