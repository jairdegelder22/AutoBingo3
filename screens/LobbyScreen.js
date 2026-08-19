import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { BackButton, InlineNote, ScreenLayout } from './flowComponents';
import {
  BASIC_SKIN_OPTIONS,
  EQUIPPED_SKIN_STORAGE_KEY,
  GAME_RULE_PREFERENCES_STORAGE_KEY,
  PLAYER_SETUP_STORAGE_KEY,
  SKIN_OPTIONS,
  createGameConfig,
  createRandomSalt,
  createRandomSeed,
  createPlayer,
  getDefaultPlayerName,
  normalizeCustomPlayerName,
  serializeGameRulePreferences,
  withDefaultPlayerNames,
} from './gameFlowConfig';
import { checkOnlineConnection, deleteLobby, ensureLobby, removePlayers, startLobby, subscribeToLobby, touchPlayerPresence, updateLobbySettings, upsertPlayers } from '../src/services/liveLobbyService';
import LobbyCodePlate from './LobbyCodePlate';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ThemeCarousel from '../src/components/ThemeCarousel';
import RemovePlayerIcon from '../src/components/RemovePlayerIcon';
import { getPlayerSurfaceColors } from '../src/utils/playerColorStyles';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import CircularReveal from '../components/CircularReveal';
import WarmupImages from '../src/components/WarmupImages';
import { getThemeCardImage } from '../assets/images/theme-cards/themeCardImages';
import { THEMES } from './themeCatalog';
import { getResponsiveMetrics } from '../src/utils/responsive';
import useOnlineConnectionStatus from '../src/hooks/useOnlineConnectionStatus';
import ConnectionWarningOverlay from '../src/components/ConnectionWarningOverlay';
import { WAITING_ROOM_ASSETS } from '../src/assets/preloadManifest';
import {
  SKIN_CHALLENGES,
  getChallengeProgressValue,
  isChallengeSkin,
  isSkinUnlocked,
  loadSkinChallengeProgress,
} from '../src/challenges/skinChallenges';

const MAX_PLAYER_NAME_LENGTH = 12;
const MAX_LOCAL_PLAYERS = 2;
const MAX_LOBBY_PLAYERS = 6;
const START_GAME_REVEAL_BLUE = '#1677D2';
const LEAVE_LOBBY_REVEAL_GREEN = '#159B3B';
const PLAYER_SILHOUETTE_IMAGE = PLAYER_ADD_SILHOUETTE_IMAGE;
const CHALLENGE_SKIN_LOCK_IMAGE = require('../assets/images/players/challenge-skin-lock.png');
const GAME_SETUP_BACKGROUND = require('../assets/images/backgrounds/game-setup-birds-eye-background-v4.png');
const LOBBY_ROAD_BACKGROUND_IMAGE = require('../assets/images/backgrounds/lobby-road-background.png');
const LOBBY_PARKING_GRID_IMAGE = require('../assets/images/lobby/lobby-parking-grid.png');
const NO_WIFI_BADGE_IMAGE = require('../assets/images/game-mode-cards/kaartcode-no-wifi.png');
const CAR_ATTENTION_DELAY_MS = 2600;
const CAR_ATTENTION_STAGGER_MS = 900;
const KLASSIEK_CARD_RED = require('../assets/images/game-mode-cards/klassiek-card-red.png');
const KLASSIEK_CARD_GREEN = require('../assets/images/game-mode-cards/klassiek-card-green.png');
const KLASSIEK_CARD_BLUE = require('../assets/images/game-mode-cards/klassiek-card-blue.png');
const COLLECTIEF_BINGO_BOARD = require('../assets/images/game-mode-cards/collectief-bingo-board.png');
const CLAIM_BINGO_BOARD = require('../assets/images/game-mode-cards/claim-direct-bingo-board.png');
const SCREEN_HORIZONTAL_PADDING = 20;
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 188;
const CAROUSEL_CAR_SIZE = 224;
const COMPACT_INPUT_BASE_WIDTH = 108;
const COMPACT_INPUT_MAX_WIDTH = 148;
const HERO_CAR_Y_OFFSET = -2;
const LOBBY_SETTINGS_BLUE = '#1A7BD4';
const PARKING_GRID_DRIVE_OFFSET_X = 24;
const PARKING_GRID_DRIVE_OFFSET_Y = 18;
const PARKING_GRID_SLOT_STYLES = [
  { left: '9.4%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '51.1%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '9.4%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '9.4%', top: '63.8%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '63.8%', width: '39.5%', height: '21.8%' },
];
const LOBBY_THEME_CARDS = THEMES.map((theme) => ({
  id: theme.id,
  title: theme.label,
  surface: theme.cardSurface,
  border: theme.cardBorder,
  outline: theme.cardOutline,
  premium: theme.premium,
}));
const LOBBY_GAME_MODES = [
  { id: 'klassiek', title: 'Klassiek', images: [KLASSIEK_CARD_RED, KLASSIEK_CARD_BLUE, KLASSIEK_CARD_GREEN] },
  { id: 'claim', title: 'Claim', images: [CLAIM_BINGO_BOARD] },
  { id: 'collectief', title: 'Collectief', images: [COLLECTIEF_BINGO_BOARD] },
];
const LOBBY_WIN_OPTIONS = [
  { id: '1rij', label: '1 Lijn' },
  { id: '2rijen', label: '2 Lijnen' },
  { id: 'heel-blok', label: 'Hele kaart' },
];
const LOBBY_DIAGONAL_OPTIONS = [
  { id: true, label: 'Wel diagonaal' },
  { id: false, label: 'Niet diagonaal' },
];
const LOBBY_DUTCH_OPTIONS = [
  { id: true, label: 'Nederlands aan' },
  { id: false, label: 'Nederlands uit' },
];
const LOBBY_CARD_LAYOUT_OPTIONS = [
  { id: 'zelfde', label: 'Zelfde kaart' },
  { id: 'anders', label: 'Andere kaarten' },
];

function normalizeName(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function getNumberedName(prefix, players = []) {
  const usedNames = new Set(players.map((player) => normalizeName(player?.naam).toLowerCase()));

  for (let index = 1; index <= MAX_LOBBY_PLAYERS; index += 1) {
    const candidate = `${prefix} ${index}`;
    if (!usedNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${prefix} ${players.length + 1}`;
}

function formatPlayerGridName(value = '', fallbackName = 'Speler') {
  const normalized = normalizeName(value);
  if (!normalized) {
    return fallbackName;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function measureViewCenter(ref, fallback) {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node?.measureInWindow) {
      resolve(fallback);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: x + width / 2,
        y: y + height / 2,
      });
    });
  });
}

function PlayerAvatar({ skin = 'rood', size = 72, style }) {
  const source = PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.rood;
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
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

function AttentionCarButton({ skin, size, onPress, disabled = false, attentionDelay = 0 }) {
  const attention = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
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
  }, [attention, attentionDelay, disabled]);

  const translateY = attention.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const rotate = attention.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-1.8deg', '1.8deg'],
  });

  return (
    <Pressable style={styles.heroCarButton} onPress={onPress} disabled={disabled}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <PlayerAvatar skin={skin} size={size} />
      </Animated.View>
    </Pressable>
  );
}

function normalizeLocalPlayer(player = {}, fallbackSkin = 'rood') {
  return {
    ...createPlayer({ skin: fallbackSkin }),
    ...player,
    naam: normalizeCustomPlayerName(player?.naam),
    skin: player?.skin || fallbackSkin,
  };
}

function getCompactNameInputWidth(name = '') {
  const visibleCharacters = Math.max(4, normalizeName(name).length || 0);
  return Math.min(COMPACT_INPUT_MAX_WIDTH, COMPACT_INPUT_BASE_WIDTH + Math.max(0, visibleCharacters - 4) * 10);
}

function resolveUniqueLocalPlayers(players = [], remotePlayers = []) {
  const reservedSkins = new Set(remotePlayers.map((player) => player.skin));
  let changed = false;

  const nextPlayers = players.map((player) => {
    if (!reservedSkins.has(player.skin)) {
      reservedSkins.add(player.skin);
      return player;
    }

    const fallbackSkin = BASIC_SKIN_OPTIONS.find((skin) => !reservedSkins.has(skin)) ?? player.skin;
    reservedSkins.add(fallbackSkin);
    if (fallbackSkin !== player.skin) {
      changed = true;
      return { ...player, skin: fallbackSkin };
    }
    return player;
  });

  return changed ? nextPlayers : players;
}

function LobbyThemeCard({ item, selected }) {
  const themeImage = getThemeCardImage(item.id);

  return (
    <View style={[styles.settingsThemeCardShell, selected && styles.settingsThemeCardShellSelected]}>
      {themeImage ? (
        <ImageBackground
          source={themeImage}
          resizeMode="cover"
          imageStyle={styles.settingsThemeCardImage}
          style={styles.settingsThemeCard}
        >
          <View style={styles.settingsThemeCardShade} />
          <Text style={styles.settingsThemeCardTitle}>{item.title}</Text>
        </ImageBackground>
      ) : (
        <View style={[styles.settingsThemeCard, { backgroundColor: item.surface ?? '#FFFFFF' }]}>
          <Text style={styles.settingsThemeCardTitle}>{item.title}</Text>
        </View>
      )}
    </View>
  );
}

function LobbySettingsChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsChip, selected && styles.settingsChipSelected]}
    >
      <Text style={[styles.settingsChipText, selected && styles.settingsChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LobbyGameModeCard({ mode, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsModeCard, selected && styles.settingsModeCardSelected]}
    >
      <Text style={styles.settingsModeCardTitle}>{mode.title}</Text>
      <View style={styles.settingsModeCardArt}>
        {mode.images.map((image, index) => (
          <Image
            key={`${mode.id}-image-${index}`}
            source={image}
            resizeMode="contain"
            style={[
              styles.settingsModeCardImage,
              mode.id === 'klassiek' && index === 0 ? styles.settingsModeCardImageLeft : null,
              mode.id === 'klassiek' && index === 1 ? styles.settingsModeCardImageCenter : null,
              mode.id === 'klassiek' && index === 2 ? styles.settingsModeCardImageRight : null,
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

function LobbyGameSettingsPage({
  visible,
  settings,
  onChange,
  onClose,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const selectedThemeIndex = Math.max(0, LOBBY_THEME_CARDS.findIndex((theme) => theme.id === settings.thema));
  const showWinAndDiagonalRuleSettings = (
    settings.modus === 'klassiek'
    || settings.modus === 'wegenkaart'
    || settings.modus === 'collectief'
  );
  const showCardLayoutRuleSettings = settings.modus === 'klassiek' || settings.modus === 'wegenkaart';
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => {
      dragY.setValue(Math.max(0, gesture.dy));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 96 || gesture.vy > 0.85) {
        Animated.timing(slideY, {
          toValue: screenHeight,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          dragY.setValue(0);
          onClose();
        });
        return;
      }

      Animated.spring(dragY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 4,
      }).start();
    },
  }), [dragY, onClose, screenHeight, slideY]);

  useEffect(() => {
    if (!visible) {
      slideY.setValue(screenHeight);
      dragY.setValue(0);
      return;
    }

    slideY.setValue(screenHeight);
    dragY.setValue(0);
    Animated.timing(slideY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dragY, slideY, visible]);

  function closeWithSlide() {
    Animated.timing(slideY, {
      toValue: screenHeight,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(onClose);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithSlide}
    >
      <Animated.View
        style={[
          styles.settingsPage,
          {
            transform: [
              { translateY: slideY },
              { translateY: dragY },
            ],
          },
        ]}
      >
        <ImageBackground
          source={GAME_SETUP_BACKGROUND}
          resizeMode="cover"
          style={styles.settingsPageBackground}
        >
          <View
            style={styles.settingsPageGrabberWrap}
            {...panResponder.panHandlers}
          >
            <View style={styles.settingsPageGrabber} />
          </View>

          <BackButton onPress={closeWithSlide} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.settingsPageScroll}
            contentContainerStyle={styles.settingsPageContent}
          >
            <Text style={styles.settingsPageTitle}>Spelregels</Text>

            <Text style={styles.settingsPageSectionTitle}>Bingo Thema</Text>
            <ThemeCarousel
              items={LOBBY_THEME_CARDS}
              itemWidth={210}
              itemSpacing={12}
              focusedIndex={selectedThemeIndex}
              keyExtractor={(item) => item.id}
              onSnapToItem={(index) => {
                const nextTheme = LOBBY_THEME_CARDS[index];
                if (nextTheme) {
                  onChange({ thema: nextTheme.id });
                }
              }}
              renderCard={({ item }) => (
                <LobbyThemeCard item={item} selected={item.id === settings.thema} />
              )}
            />

            <Text style={styles.settingsPageSectionTitle}>Gamemode</Text>
            <View style={styles.settingsModeGrid}>
              {LOBBY_GAME_MODES.map((mode) => (
                <LobbyGameModeCard
                  key={mode.id}
                  mode={mode}
                  selected={settings.modus === mode.id}
                  onPress={() => onChange({ modus: mode.id })}
                />
              ))}
            </View>

            <View style={styles.settingsBottomPanel}>
              <Text style={styles.settingsBottomPanelTitle}>Spelregels</Text>
              {showWinAndDiagonalRuleSettings ? (
                <>
                  <Text style={styles.settingsSectionLabel}>Win conditie</Text>
                  <View style={styles.settingsChipRow}>
                    {LOBBY_WIN_OPTIONS.map((option) => (
                      <LobbySettingsChip
                        key={option.id}
                        label={option.label}
                        selected={settings.wincondition === option.id}
                        onPress={() => onChange({ wincondition: option.id })}
                      />
                    ))}
                  </View>

                  <Text style={styles.settingsSectionLabel}>Diagonaal</Text>
                  <View style={styles.settingsChipRow}>
                    {LOBBY_DIAGONAL_OPTIONS.map((option) => (
                      <LobbySettingsChip
                        key={String(option.id)}
                        label={option.label}
                        selected={settings.diagonaal === option.id}
                        onPress={() => onChange({ diagonaal: option.id })}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.settingsSectionLabel}>Nederlands</Text>
              <View style={styles.settingsChipRow}>
                {LOBBY_DUTCH_OPTIONS.map((option) => (
                  <LobbySettingsChip
                    key={String(option.id)}
                    label={option.label}
                    selected={settings.nederlands === option.id}
                    onPress={() => onChange({ nederlands: option.id })}
                  />
                ))}
              </View>

              {showCardLayoutRuleSettings ? (
                <>
                  <Text style={styles.settingsSectionLabel}>Kaarten</Text>
                  <View style={styles.settingsChipRow}>
                    {LOBBY_CARD_LAYOUT_OPTIONS.map((option) => (
                      <LobbySettingsChip
                        key={option.id}
                        label={option.label}
                        selected={settings.kaartOpzet === option.id}
                        onPress={() => onChange({ kaartOpzet: option.id })}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </ImageBackground>
      </Animated.View>
    </Modal>
  );
}

function PlayerGrid({ players, canRemovePlayers = false, localPlayerIds = [], onRemovePlayer, avatarSize = 62, nameFontSize = 20 }) {
  const slots = Array.from({ length: 6 }, (_, index) => players[index] ?? null);
  const localPlayerIdSet = useMemo(() => new Set(localPlayerIds), [localPlayerIds]);

  return (
    <ImageBackground
      source={LOBBY_PARKING_GRID_IMAGE}
      resizeMode="stretch"
      style={styles.grid}
      imageStyle={styles.gridBackgroundImage}
    >
      {slots.map((player, index) => {
        const isRightSlot = index % 2 === 1;

        return (
          <View
            key={`parking-slot-${index}`}
            style={[
              styles.gridCell,
              PARKING_GRID_SLOT_STYLES[index],
            ]}
          >
            <AnimatedGridPlayer
              player={player}
              isRightSlot={isRightSlot}
              fallbackName={`Speler ${index + 1}`}
              avatarSize={avatarSize}
              nameFontSize={nameFontSize}
              canRemove={Boolean(
                canRemovePlayers
                && player
                && !localPlayerIdSet.has(player.playerId)
              )}
              onRemove={() => onRemovePlayer?.(player)}
            />
          </View>
        );
      })}
    </ImageBackground>
  );
}

function AnimatedGridPlayer({ player, isRightSlot, fallbackName, canRemove = false, onRemove, avatarSize = 62, nameFontSize = 20 }) {
  const [renderedPlayer, setRenderedPlayer] = useState(player);
  const [exiting, setExiting] = useState(false);
  const playerIdRef = useRef(player?.playerId ?? null);
  const progress = useRef(new Animated.Value(player ? 1 : 0)).current;
  const offlinePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const nextPlayerId = player?.playerId ?? null;
    const currentPlayerId = playerIdRef.current;

    if (player) {
      setRenderedPlayer(player);
      setExiting(false);
      progress.stopAnimation();

      if (currentPlayerId !== nextPlayerId) {
        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else {
        progress.setValue(1);
      }

      playerIdRef.current = nextPlayerId;
      return;
    }

    if (!currentPlayerId) {
      return;
    }

    setExiting(true);
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        playerIdRef.current = null;
        setRenderedPlayer(null);
        setExiting(false);
      }
    });
  }, [player?.isOffline, player?.playerId, player?.naam, player?.skin, progress]);

  useEffect(() => {
    if (!renderedPlayer?.isOffline) {
      offlinePulse.stopAnimation();
      offlinePulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(offlinePulse, {
          toValue: 0.58,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(offlinePulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [offlinePulse, renderedPlayer?.isOffline]);

  if (!renderedPlayer) {
    return null;
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [exiting ? -PARKING_GRID_DRIVE_OFFSET_X : PARKING_GRID_DRIVE_OFFSET_X, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [exiting ? PARKING_GRID_DRIVE_OFFSET_Y : -PARKING_GRID_DRIVE_OFFSET_Y, 0],
  });
  const nameOpacity = renderedPlayer.naam ? progress : Animated.multiply(progress, 0.4);

  return (
    <View style={styles.gridPlayer}>
      <Animated.View
        style={[
          styles.gridPlayerAvatar,
          isRightSlot ? styles.gridPlayerAvatarRight : styles.gridPlayerAvatarLeft,
          {
            opacity: progress,
            transform: [
              { translateX },
              { translateY: -31 },
              { translateY },
            ],
          },
        ]}
      >
        <PlayerAvatar skin={renderedPlayer.skin} size={avatarSize} />
        {renderedPlayer.isOffline ? (
          <Animated.Image
            source={NO_WIFI_BADGE_IMAGE}
            resizeMode="contain"
            style={[
              styles.gridPlayerOfflineBadge,
              {
                opacity: offlinePulse,
                transform: [{ scale: offlinePulse }],
              },
            ]}
          />
        ) : null}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.66}
        style={[
          styles.gridPlayerName,
          isRightSlot ? styles.gridPlayerNameRight : styles.gridPlayerNameLeft,
          !renderedPlayer.naam ? styles.gridPlayerNamePlaceholder : null,
          {
            opacity: nameOpacity,
            fontSize: nameFontSize,
            lineHeight: Math.round(nameFontSize * 1.2),
          },
        ]}
      >
        {formatPlayerGridName(renderedPlayer.naam, fallbackName)}
      </Animated.Text>
      {canRemove ? (
        <Animated.View
          style={[
            styles.gridPlayerRemoveButton,
            isRightSlot ? styles.gridPlayerRemoveButtonRight : styles.gridPlayerRemoveButtonLeft,
            { opacity: progress },
          ]}
        >
          <Pressable
            hitSlop={8}
            onPress={onRemove}
            style={styles.gridPlayerRemovePressable}
          >
            <RemovePlayerIcon size={27} />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
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
  const { width, height } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(width, height);
  const [challengeProgress, setChallengeProgress] = useState(null);
  const orderedSkins = useMemo(() => (
    [selectedSkin, ...SKIN_OPTIONS.filter((skin) => skin !== selectedSkin)]
  ), [selectedSkin]);
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
            itemWidth={isTablet ? 320 : 224}
            itemSpacing={isTablet ? 16 : 0}
            onSnapToItem={setActiveIndex}
            keyExtractor={(item) => item}
            containerStyle={styles.carouselWrap}
            flatListProps={{ initialScrollIndex: 0 }}
            renderCard={({ item, isFocused }) => (
              (() => {
                const itemLocked = isChallengeSkin(item) && !isSkinUnlocked(challengeProgress, item);

                return (
              <View
                style={[
                  styles.carouselCardShell,
                  { shadowColor: PLAYER_HEX[item] ?? PLAYER_HEX.rood },
                  !isFocused && styles.carouselCardShellMuted,
                ]}
              >
                <View
                  style={[
                    styles.carouselCard,
                    takenSkins.includes(item) && item !== selectedSkin ? styles.carouselCardTaken : null,
                  ]}
                >
                  <View style={itemLocked ? styles.challengeSkinLockedCar : null}>
                    <PlayerAvatar skin={item} size={isTablet ? 318 : CAROUSEL_CAR_SIZE} />
                  </View>
                  {itemLocked ? (
                    <Image
                      source={CHALLENGE_SKIN_LOCK_IMAGE}
                      style={styles.challengeSkinLock}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
                );
              })()
            )}
          />

          <SkinChallengeProgressPanel
            skin={activeSkin}
            progress={challengeProgress}
            fontFamily={undefined}
          />

          <View style={styles.selectButtonWrap}>
            <GlossyButton
              label="Selecteer"
              variant="green"
              heightOverride={isTablet ? 82 : 62}
              horizontalPadding={isTablet ? 62 : 44}
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

function AddPlayerButton({ visible, onPress }) {
  if (!visible) {
    return null;
  }

  return (
    <Pressable style={styles.addPlayerButton} onPress={onPress}>
      <Image
        source={PLAYER_SILHOUETTE_IMAGE}
        style={styles.addPlayerButtonImage}
        resizeMode="contain"
      />
    </Pressable>
  );
}

function PlayerEditor({
  player,
  compact = false,
  carSize = STAGE_SINGLE_CAR_SIZE,
  carOpacity,
  disableCar = false,
  hideRemove = false,
  nameWidth,
  onChangeName,
  onOpenSkinPicker,
  onRemove,
  carRef,
  attentionDelay = 0,
  defaultName = 'Speler',
}) {
  const playerColors = getPlayerSurfaceColors(player.skin);
  const carColor = PLAYER_HEX[player.skin] ?? playerColors.border ?? '#E03030';
  const handleNameFocus = () => {
    if (player.naam === defaultName) {
      onChangeName('');
    }
  };
  const handleNameBlur = () => {
    if (!player.naam.trim()) {
      onChangeName(defaultName);
    }
  };

  return (
    <View style={[styles.playerEditor, compact && styles.playerEditorCompact]}>
      <View
        style={[
          styles.nameInputWrap,
          compact && styles.nameInputWrapCompact,
          compact && nameWidth ? { width: nameWidth } : null,
          {
            backgroundColor: carColor,
            shadowColor: carColor,
          },
        ]}
      >
        <TextInput
          style={[
            styles.nameInput,
            compact && styles.nameInputCompact,
            {
              backgroundColor: 'rgba(255, 248, 232, 0.92)',
              color: playerColors.text,
            },
          ]}
          value={player.naam}
          onChangeText={(value) => onChangeName(value.slice(0, MAX_PLAYER_NAME_LENGTH))}
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          placeholder={defaultName}
          placeholderTextColor={playerColors.placeholderText}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
        />
      </View>

      <Animated.View style={carOpacity !== undefined ? { opacity: carOpacity } : null}>
        <View ref={carRef} collapsable={false}>
          <AttentionCarButton
            skin={player.skin}
            size={carSize}
            onPress={onOpenSkinPicker}
            disabled={disableCar}
            attentionDelay={attentionDelay}
          />
        </View>
      </Animated.View>

      {compact && onRemove ? (
        <Pressable
          style={[styles.removeButton, hideRemove && styles.removeButtonHidden]}
          onPress={onRemove}
          disabled={hideRemove}
        >
          <RemovePlayerIcon size={34} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function LobbyScreen({ navigation, route }) {
  const config = route.params?.config;
  const isLiveLobby = config?.syncType === 'live';
  const connectionStatus = useOnlineConnectionStatus(isLiveLobby);
  const liveConnectionOffline = isLiveLobby && connectionStatus.isOffline;
  const isCardCodeMode = config?.modus === 'wegenkaart'
    || config?.gameMode === 'wegenkaart'
    || config?.syncType === 'geen'
    || config?.syncType === 'offline';
  const maxLocalPlayers = isLiveLobby ? 1 : MAX_LOCAL_PLAYERS;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(screenWidth, screenHeight);
  const routePlayers = Array.isArray(config?.spelers) && config.spelers.length
    ? config.spelers
        .slice(0, maxLocalPlayers)
        .map((player, index) => normalizeLocalPlayer(player, index === 0 ? 'rood' : 'blauw'))
    : null;
  const [liveLobby, setLiveLobby] = useState(null);
  const [stableLobbyPlayers, setStableLobbyPlayers] = useState(() => config?.liveLobbyPlayers ?? []);
  const [spelers, setSpelers] = useState(() => (
    routePlayers ?? [normalizeLocalPlayer(createPlayer({ skin: 'rood' }), 'rood')]
  ));
  const [startConfirmVisible, setStartConfirmVisible] = useState(false);
  const [startError, setStartError] = useState('');
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [gameSettingsVisible, setGameSettingsVisible] = useState(false);
  const [lobbyLayoutReady, setLobbyLayoutReady] = useState(false);
  const [lobbyAssetsReady, setLobbyAssetsReady] = useState(false);
  const [draftGameSettings, setDraftGameSettings] = useState(() => ({
    thema: config?.thema ?? 'snelweg',
    modus: config?.modus ?? 'klassiek',
    wincondition: config?.wincondition ?? '1rij',
    diagonaal: typeof config?.diagonaal === 'boolean' ? config.diagonaal : true,
    kaartOpzet: config?.kaartOpzet ?? 'zelfde',
    nederlands: config?.nederlands !== false,
  }));
  const handleLobbyWarmupReady = useCallback(() => {
    setLobbyAssetsReady(true);
  }, []);

  useEffect(() => {
    if (!lobbyLayoutReady || !lobbyAssetsReady) {
      return undefined;
    }

    let cancelled = false;

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            navigation.markRouteReady?.();
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lobbyAssetsReady, lobbyLayoutReady, navigation]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('rood');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const startConfirmProgress = useRef(new Animated.Value(0)).current;
  const leaveConfirmProgress = useRef(new Animated.Value(0)).current;
  const startGameRevealRef = useRef(null);
  const leaveLobbyRevealRef = useRef(null);
  const remoteLobbyExitRevealRef = useRef(null);
  const hasObservedLiveLobbyRef = useRef(Boolean(config?.liveLobbyPlayers?.length));
  const localWasInLobbyRef = useRef(false);
  const selfLeavingLobbyRef = useRef(false);
  const lobbyMissingTimeoutRef = useRef(null);
  const confirmYesButtonRef = useRef(null);
  const lobbyPlayerShrinkTimeoutRef = useRef(null);
  const carOpacityValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const carRefs = useRef([]);
  const [startGameReveal, setStartGameReveal] = useState(null);
  const [leaveLobbyReveal, setLeaveLobbyReveal] = useState(null);
  const [remoteLobbyExitReveal, setRemoteLobbyExitReveal] = useState(null);
  const [lobbySnapshotReady, setLobbySnapshotReady] = useState(false);
  const [lobbySetupReady, setLobbySetupReady] = useState(!isLiveLobby);
  const stageCarSize = spelers.length >= 2
    ? Math.round(STAGE_MULTI_CAR_SIZE * (isTablet ? Math.min(tabletScale, 1.22) : 1))
    : Math.round(STAGE_SINGLE_CAR_SIZE * (isTablet ? Math.min(tabletScale, 1.22) : 1));
  const effectiveConfig = useMemo(
    () => ({
      ...config,
      ...(liveLobby?.config ?? {}),
      lobbyCode: config?.lobbyCode ?? liveLobby?.config?.lobbyCode,
      syncType: config?.syncType ?? liveLobby?.config?.syncType,
    }),
    [config, liveLobby?.config]
  );

  useEffect(() => {
    const nextConfig = liveLobby?.config ?? config ?? {};
    setDraftGameSettings((current) => ({
      thema: nextConfig.thema ?? current.thema ?? 'snelweg',
      modus: nextConfig.modus ?? current.modus ?? 'klassiek',
      wincondition: nextConfig.wincondition ?? current.wincondition ?? '1rij',
      diagonaal: typeof nextConfig.diagonaal === 'boolean'
        ? nextConfig.diagonaal
        : (typeof current.diagonaal === 'boolean' ? current.diagonaal : true),
      kaartOpzet: nextConfig.kaartOpzet ?? current.kaartOpzet ?? 'zelfde',
      nederlands: typeof nextConfig.nederlands === 'boolean'
        ? nextConfig.nederlands
        : (typeof current.nederlands === 'boolean' ? current.nederlands : true),
    }));
  }, [
    config?.diagonaal,
    config?.kaartOpzet,
    config?.modus,
    config?.nederlands,
    config?.thema,
    config?.wincondition,
    liveLobby?.config?.diagonaal,
    liveLobby?.config?.kaartOpzet,
    liveLobby?.config?.modus,
    liveLobby?.config?.nederlands,
    liveLobby?.config?.thema,
    liveLobby?.config?.wincondition,
  ]);

  useEffect(() => {
    if (!startConfirmVisible) {
      startConfirmProgress.setValue(0);
      return;
    }

    startConfirmProgress.setValue(0);
    Animated.spring(startConfirmProgress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [startConfirmProgress, startConfirmVisible]);

  useEffect(() => {
    if (!leaveConfirmVisible) {
      leaveConfirmProgress.setValue(0);
      return;
    }

    leaveConfirmProgress.setValue(0);
    Animated.spring(leaveConfirmProgress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [leaveConfirmProgress, leaveConfirmVisible]);

  useEffect(() => {
    if (!startGameReveal) {
      return;
    }

    requestAnimationFrame(() => {
      startGameRevealRef.current?.reveal();
    });
  }, [startGameReveal]);

  useEffect(() => {
    if (!leaveLobbyReveal) {
      return;
    }

    requestAnimationFrame(() => {
      leaveLobbyRevealRef.current?.reveal();
    });
  }, [leaveLobbyReveal]);

  useEffect(() => {
    if (!remoteLobbyExitReveal) {
      return;
    }

    requestAnimationFrame(() => {
      remoteLobbyExitRevealRef.current?.reveal();
    });
  }, [remoteLobbyExitReveal]);

  useEffect(() => () => {
    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }
    if (lobbyMissingTimeoutRef.current) {
      clearTimeout(lobbyMissingTimeoutRef.current);
      lobbyMissingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (config?.syncType !== 'live') {
      return;
    }

    const snapshotPlayers = liveLobby?.players;
    const nextPlayers = snapshotPlayers ?? config?.liveLobbyPlayers ?? [];
    if (!nextPlayers.length) {
      return;
    }

    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }

    setStableLobbyPlayers((current) => {
      if (snapshotPlayers) {
        return snapshotPlayers;
      }

      if (nextPlayers.length >= current.length) {
        return nextPlayers;
      }

      lobbyPlayerShrinkTimeoutRef.current = setTimeout(() => {
        setStableLobbyPlayers(nextPlayers);
        lobbyPlayerShrinkTimeoutRef.current = null;
      }, 2800);

      return current.length ? current : nextPlayers;
    });
  }, [config?.liveLobbyPlayers, config?.syncType, liveLobby?.players]);

  useEffect(() => {
    if (routePlayers?.length) {
      setSpelers(routePlayers);
      setStorageLoaded(true);
      return;
    }

    Promise.all([
      AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY),
      AsyncStorage.getItem(EQUIPPED_SKIN_STORAGE_KEY),
    ]).then(([storedValue, storedEquippedSkin]) => {
      const preferredSkin = SKIN_OPTIONS.includes(storedEquippedSkin) ? storedEquippedSkin : 'rood';

      if (storedValue) {
        try {
          const parsed = JSON.parse(storedValue);
          const parsedPlayers = Array.isArray(parsed?.spelers) && parsed.spelers.length
            ? parsed.spelers
                .slice(0, 1)
                .map((player, index) => ({
                  ...normalizeLocalPlayer(player, index === 0 ? preferredSkin : 'blauw'),
                  skin: index === 0 ? preferredSkin : (player?.skin || 'blauw'),
                }))
            : null;

          if (parsedPlayers?.length) {
            setSpelers(parsedPlayers);
          } else {
            setSpelers((current) => current.map((player, index) => (
              index === 0 ? { ...player, skin: preferredSkin } : player
            )));
          }
        } catch (_error) {
          // Negeer corrupte placeholder-data.
          setSpelers((current) => current.map((player, index) => (
            index === 0 ? { ...player, skin: preferredSkin } : player
          )));
        }
      } else {
        setSpelers((current) => current.map((player, index) => (
          index === 0 ? { ...player, skin: preferredSkin } : player
        )));
      }
      setStorageLoaded(true);
    }).catch(() => {
      setSpelers((current) => current.map((player, index) => (
        index === 0 ? { ...player, skin: 'rood' } : player
      )));
      setStorageLoaded(true);
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
    if (spelers.length <= maxLocalPlayers) {
      return;
    }

    setSpelers((current) => current.slice(0, maxLocalPlayers));
  }, [maxLocalPlayers, spelers.length]);

  const localPlayerIds = useMemo(
    () => spelers.map((player) => player.playerId),
    [spelers]
  );
  const knownLobbyPlayers = useMemo(
    () => stableLobbyPlayers.length ? stableLobbyPlayers : (config?.liveLobbyPlayers ?? []),
    [config?.liveLobbyPlayers, stableLobbyPlayers]
  );
  const localLobbyPlayers = useMemo(
    () => knownLobbyPlayers.filter((player) => localPlayerIds.includes(player.playerId)),
    [knownLobbyPlayers, localPlayerIds]
  );
  const hasKnownLobbyPlayers = knownLobbyPlayers.length > 0;
  const isLocalHost = config?.syncType === 'live'
    ? (
        localLobbyPlayers.some((player) => player.role === 'host')
        || (!hasKnownLobbyPlayers && Boolean(config?.lobbyCode))
      )
    : true;
  const isKnownGuest = config?.syncType === 'live'
    ? localLobbyPlayers.some((player) => player.role !== 'host')
    : false;

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || liveConnectionOffline || !localPlayerIds.length) {
      return undefined;
    }

    void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    const interval = setInterval(() => {
      void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    }, 5000);

    return () => clearInterval(interval);
  }, [config?.lobbyCode, config?.syncType, liveConnectionOffline, localPlayerIds]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || !storageLoaded || !isLocalHost) {
      setLobbySetupReady(!isLiveLobby || !isLocalHost);
      return undefined;
    }

    let cancelled = false;
    setLobbySetupReady(false);

    void ensureLobby({
      code: config.lobbyCode,
      config,
      hostPlayer: {
        ...spelers[0],
        playerId: spelers[0].playerId,
        naam: normalizeName(spelers[0].naam) || getDefaultPlayerName(0),
        role: 'host',
      },
      resetExisting: !config?.liveLobbyPlayers?.length && (config?.startedAt ?? null) === null,
    }).then((snapshot) => {
      if (!cancelled) {
        setLobbySetupReady(Boolean(snapshot));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    config,
    config?.liveLobbyPlayers?.length,
    config?.lobbyCode,
    config?.startedAt,
    config?.syncType,
    isLocalHost,
    spelers[0]?.playerId,
    storageLoaded,
  ]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    setLobbySnapshotReady(false);
    const publishLobbySnapshot = (snapshot) => {
      setLobbySnapshotReady(true);
      setLiveLobby(snapshot);
    };

    const unsubscribe = subscribeToLobby(config.lobbyCode, publishLobbySnapshot);
    return unsubscribe;
  }, [config?.lobbyCode, config?.syncType]);

  function startRemoteLobbyExit(message) {
    if (selfLeavingLobbyRef.current || remoteLobbyExitReveal || leaveLobbyReveal) {
      return;
    }

    setRemoteLobbyExitReveal({
      message,
      originX: screenWidth / 2,
      originY: screenHeight / 2,
      transitionKey: `remote-lobby-exit-${Date.now()}`,
    });
  }

  function completeRemoteLobbyExit() {
    const message = remoteLobbyExitReveal?.message
      ?? 'Je bent uit de lobby gehaald of de lobby is gestopt.';
    const transitionKey = remoteLobbyExitReveal?.transitionKey ?? `remote-lobby-home-${Date.now()}`;

    navigation.reset('Home', {
      lobbyExitMessage: message,
      transition: {
        color: LEAVE_LOBBY_REVEAL_GREEN,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Home',
        pauseMs: 180,
        transitionKey,
      },
    });
  }

  useEffect(() => {
    if (config?.syncType !== 'live' || isLocalHost || liveConnectionOffline) {
      if (lobbyMissingTimeoutRef.current) {
        clearTimeout(lobbyMissingTimeoutRef.current);
        lobbyMissingTimeoutRef.current = null;
      }
      return;
    }

    if (liveLobby) {
      hasObservedLiveLobbyRef.current = true;
      if (lobbyMissingTimeoutRef.current) {
        clearTimeout(lobbyMissingTimeoutRef.current);
        lobbyMissingTimeoutRef.current = null;
      }
      return;
    }

    if (
      lobbySnapshotReady
      && liveLobby === null
      && hasObservedLiveLobbyRef.current
      && !lobbyMissingTimeoutRef.current
    ) {
      lobbyMissingTimeoutRef.current = setTimeout(() => {
        lobbyMissingTimeoutRef.current = null;
        startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      }, 1800);
    }
  }, [config?.syncType, isLocalHost, liveConnectionOffline, liveLobby, lobbySnapshotReady, leaveLobbyReveal, remoteLobbyExitReveal]);

  useEffect(() => {
    if (config?.syncType !== 'live' || isLocalHost || liveConnectionOffline || !liveLobby) {
      return;
    }

    if (liveLobby.ended || !liveLobby.players?.length) {
      startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      return;
    }

    const hostStillInLobby = liveLobby.players.some((player) => player.role === 'host');
    if (!hostStillInLobby) {
      startRemoteLobbyExit('De lobby die je gejoind hebt, is gestopt door de host.');
      return;
    }

    const localPlayerInLobby = liveLobby.players.some((player) => localPlayerIds.includes(player.playerId));
    if (localPlayerInLobby) {
      localWasInLobbyRef.current = true;
      return;
    }

    if (localWasInLobbyRef.current) {
      startRemoteLobbyExit('Je bent verwijderd uit de lobby.');
    }
  }, [config?.syncType, isLocalHost, liveConnectionOffline, liveLobby, localPlayerIds, leaveLobbyReveal, remoteLobbyExitReveal]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !liveLobby?.started || liveConnectionOffline) {
      return;
    }

    if (remoteLobbyExitReveal) {
      return;
    }

    const nextStartedAt = liveLobby.startedAt ?? null;
    const currentStartedAt = config?.startedAt ?? null;
    if (!nextStartedAt || nextStartedAt === currentStartedAt) {
      return;
    }

    if (!isLocalHost || isKnownGuest) {
      if (!startGameReveal) {
        setStartGameReveal({
          originX: screenWidth / 2,
          originY: screenHeight / 2,
          transitionKey: `joined-lobby-spel-${Date.now()}`,
          source: 'remote',
        });
      }
      return;
    }

    if (startGameReveal) {
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...effectiveConfig,
        ...(liveLobby.config ?? {}),
        spelers: withDefaultPlayerNames(spelers),
        aantalSpelersOpDitApparaat: spelers.length,
        liveLobbyPlayers: liveLobby.players?.length >= knownLobbyPlayers.length
          ? liveLobby.players
          : knownLobbyPlayers,
        startedAt: nextStartedAt,
      },
      replayAt: Date.now(),
    });
  }, [
    config?.startedAt,
    config?.syncType,
    effectiveConfig,
    isLocalHost,
    isKnownGuest,
    knownLobbyPlayers,
    liveLobby,
    liveConnectionOffline,
    navigation,
    screenHeight,
    screenWidth,
    spelers,
    remoteLobbyExitReveal,
    startGameReveal,
  ]);

  const andereSpelers = useMemo(
    () => (liveLobby?.players ?? []).filter((player) => !localPlayerIds.includes(player.playerId)),
    [liveLobby?.players, localPlayerIds]
  );

  useEffect(() => {
    setSpelers((current) => resolveUniqueLocalPlayers(current, andereSpelers));
  }, [andereSpelers]);

  const validationError = useMemo(() => {
    const seenNames = new Set();
    const seenSkins = new Set();

    for (const remotePlayer of andereSpelers) {
      const remoteName = normalizeName(remotePlayer.naam).toLowerCase();
      if (remoteName) {
        seenNames.add(remoteName);
      }
      seenSkins.add(remotePlayer.skin);
    }

    for (const player of spelers) {
      const normalizedName = normalizeName(player.naam);
      if (normalizedName.length > MAX_PLAYER_NAME_LENGTH) {
        return `Naam mag maximaal ${MAX_PLAYER_NAME_LENGTH} tekens zijn.`;
      }

      if (normalizedName) {
        const lowercaseName = normalizedName.toLowerCase();
        if (seenNames.has(lowercaseName)) {
          return isCardCodeMode
            ? 'Een van deze namen is al gekozen voor deze kaartcode.'
            : 'Een van deze namen is al in gebruik in de lobby.';
        }
        seenNames.add(lowercaseName);
      }

      if (seenSkins.has(player.skin)) {
        return isCardCodeMode
          ? 'Een van deze autokleuren is al gekozen voor deze kaartcode.'
          : 'Een van deze autokleuren is al gekozen in de lobby.';
      }
      seenSkins.add(player.skin);
    }

    return '';
  }, [andereSpelers, isCardCodeMode, spelers]);

  const canStartHost = isLocalHost
    && !validationError
    && !liveConnectionOffline;

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || validationError || liveConnectionOffline) {
      return undefined;
    }

    const normalizedPlayers = withDefaultPlayerNames(spelers).map((player, index) => ({
      ...player,
      role: isLocalHost && index === 0 ? 'host' : 'guest',
    }));

    const timeout = setTimeout(() => {
      void upsertPlayers(config.lobbyCode, normalizedPlayers);

      void AsyncStorage.setItem(
        PLAYER_SETUP_STORAGE_KEY,
        JSON.stringify({
          spelers: normalizedPlayers.map(({ role, ...player }) => ({
            ...player,
            naam: normalizeCustomPlayerName(player.naam),
          })),
        })
      );
    }, 180);

    return () => clearTimeout(timeout);
  }, [config?.lobbyCode, config?.syncType, isLocalHost, liveConnectionOffline, spelers, validationError]);

  const deelnemers = useMemo(() => {
    if (config?.syncType !== 'live') {
      return spelers;
    }

    return knownLobbyPlayers.length ? knownLobbyPlayers : spelers;
  }, [config?.syncType, knownLobbyPlayers, spelers]);
  const isSinglePlayerLobby = deelnemers.length <= 1;
  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const takenSkins = useMemo(
    () => [
      ...andereSpelers.map((player) => player.skin),
      ...spelers.filter((_, index) => index !== selectedPlayerIndex).map((player) => player.skin),
    ],
    [andereSpelers, selectedPlayerIndex, spelers]
  );

  function updateSpeler(index, patch) {
    setSpelers((current) => current.map((player, playerIndex) => (
      playerIndex === index
        ? {
            ...player,
            ...patch,
            naam: patch.naam !== undefined ? normalizeName(patch.naam) : player.naam,
          }
        : player
    )));
  }

  function handleAddPlayer() {
    if (spelers.length >= maxLocalPlayers) {
      return;
    }

    const usedSkins = new Set([
      ...andereSpelers.map((player) => player.skin),
      ...spelers.map((player) => player.skin),
    ]);
    const preferredSkins = SKIN_OPTIONS.filter((skin) => !usedSkins.has(skin));
    const fallbackSkin = preferredSkins[0] ?? 'blauw';

    setSpelers((current) => [
      ...current,
      normalizeLocalPlayer(createPlayer({ skin: fallbackSkin }), fallbackSkin),
    ]);
  }

  function handleRemovePlayer(index) {
    const playerToRemove = spelers[index];
    if (!playerToRemove || index === 0) {
      return;
    }

    setSpelers((current) => current.filter((_, currentIndex) => currentIndex !== index));

    if (config?.syncType === 'live' && config?.lobbyCode) {
      void removePlayers(config.lobbyCode, [playerToRemove.playerId]);
    }
  }

  function handleRemoveLobbyPlayer(playerToRemove) {
    if (!isLocalHost || !config?.lobbyCode || !playerToRemove?.playerId) {
      return;
    }

    if (localPlayerIds.includes(playerToRemove.playerId)) {
      return;
    }

    if (lobbyPlayerShrinkTimeoutRef.current) {
      clearTimeout(lobbyPlayerShrinkTimeoutRef.current);
      lobbyPlayerShrinkTimeoutRef.current = null;
    }
    setStableLobbyPlayers((current) => current.filter((player) => player.playerId !== playerToRemove.playerId));
    void removePlayers(config.lobbyCode, [playerToRemove.playerId]);
  }

  function handleStart() {
    if (!canStartHost) {
      return;
    }

    setStartError('');

    if (isLiveLobby && !lobbySetupReady) {
      setLobbySetupReady(true);
    }

    if (isCardCodeMode) {
      if (startGameReveal) {
        return;
      }
      setStartGameReveal({
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        transitionKey: `kaartcode-spel-${Date.now()}`,
        source: 'host',
      });
      return;
    }

    setStartConfirmVisible(true);
  }

  function handleOpenGameSettings() {
    if (!isLiveLobby || !isLocalHost || liveConnectionOffline) {
      return;
    }

    setGameSettingsVisible(true);
  }

  function updateDraftGameSettings(patch) {
    const nextSettings = {
      ...draftGameSettings,
      ...patch,
    };

    setDraftGameSettings(nextSettings);
    void AsyncStorage.setItem(
      GAME_RULE_PREFERENCES_STORAGE_KEY,
      serializeGameRulePreferences(nextSettings)
    );

    if (!isLiveLobby || !isLocalHost || !config?.lobbyCode || liveConnectionOffline) {
      return;
    }

    const nextConfig = createGameConfig({
      ...effectiveConfig,
      ...nextSettings,
      syncType: effectiveConfig.syncType ?? config?.syncType,
      lobbyCode: config.lobbyCode,
      seed: createRandomSeed(),
      salt: createRandomSalt(),
      aantalSpelersOpDitApparaat: 1,
    });

    void updateLobbySettings(config.lobbyCode, nextConfig).then((updatedLobby) => {
      if (updatedLobby) {
        setLiveLobby(updatedLobby);
      }
    });
  }

  function handleBackPress() {
    setLeaveConfirmVisible(true);
  }

  function handleConfirmLeavePress(event) {
    if (leaveLobbyReveal) {
      return;
    }

    selfLeavingLobbyRef.current = true;

    const origin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : {
          x: screenWidth / 2,
          y: screenHeight / 2,
        };

    setLeaveLobbyReveal({
      originX: origin.x,
      originY: origin.y,
      transitionKey: `leave-lobby-${Date.now()}`,
    });
  }

  async function confirmLeaveLobby(transitionKey) {
    if (config?.syncType === 'live' && config?.lobbyCode) {
      if (isLocalHost) {
        await deleteLobby(config.lobbyCode);
      } else {
        await removePlayers(config.lobbyCode, localPlayerIds);
      }
    }

    if (navigation.goBackWithTransition) {
      navigation.goBackWithTransition({
        color: LEAVE_LOBBY_REVEAL_GREEN,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        pauseMs: 260,
        transitionKey,
      });
    } else {
      navigation.goBack?.();
    }

    setTimeout(() => {
      setLeaveConfirmVisible(false);
      setLeaveLobbyReveal(null);
    }, 80);
  }

  async function handleConfirmStartPress(event) {
    if (startGameReveal) {
      return;
    }

    setStartError('');

    if (isLiveLobby) {
      const online = await checkOnlineConnection(1600);
      if (!online) {
        setStartConfirmVisible(false);
        return;
      }
    }

    const origin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : await measureViewCenter(confirmYesButtonRef, {
        x: screenWidth / 2,
        y: screenHeight / 2,
      });

    setStartGameReveal({
      originX: origin.x,
      originY: origin.y,
      transitionKey: `lobby-spel-${Date.now()}`,
      source: 'host',
    });
  }

  async function confirmStart(transitionKey) {
    if (isLiveLobby) {
      const online = await checkOnlineConnection(1600);
      if (!online) {
        setStartGameReveal(null);
        setStartConfirmVisible(false);
        return;
      }
    }

    const normalizedPlayers = withDefaultPlayerNames(spelers);
    const storagePlayers = spelers.map((player) => ({
      ...player,
      naam: normalizeCustomPlayerName(player.naam),
    }));
    const startConfig = {
      ...effectiveConfig,
      ...draftGameSettings,
      syncType: effectiveConfig.syncType ?? config?.syncType,
      lobbyCode: config?.lobbyCode,
    };

    await AsyncStorage.setItem(
      PLAYER_SETUP_STORAGE_KEY,
      JSON.stringify({ spelers: storagePlayers })
    );

    let startedLobby = null;
    if (config?.syncType === 'live') {
      await upsertPlayers(
        config.lobbyCode,
        normalizedPlayers.map((player, index) => ({ ...player, role: isLocalHost && index === 0 ? 'host' : 'guest' }))
      );
      startedLobby = await startLobby(config.lobbyCode);

      if (!startedLobby?.started || !startedLobby.startedAt) {
        const hostPlayer = {
          ...normalizedPlayers[0],
          role: 'host',
        };

        await ensureLobby({
          code: config.lobbyCode,
          config: startConfig,
          hostPlayer,
          resetExisting: false,
        });
        startedLobby = await startLobby(config.lobbyCode);
      }

      if (!startedLobby?.started || !startedLobby.startedAt) {
        if (!isSinglePlayerLobby) {
          setStartError('De lobby kon niet worden gestart. Probeer het nog een keer.');
          setStartGameReveal(null);
          setStartConfirmVisible(false);
          return;
        }

        startedLobby = {
          started: true,
          startedAt: new Date().toISOString(),
          config: startConfig,
          players: normalizedPlayers,
        };
      }
    }

    navigation.replace('Spel', {
      config: {
        ...startConfig,
        ...(startedLobby?.config ?? {}),
        aantalSpelersOpDitApparaat: normalizedPlayers.length,
        spelers: normalizedPlayers,
        liveLobbyPlayers: startedLobby?.players?.length >= knownLobbyPlayers.length
          ? startedLobby.players
          : (knownLobbyPlayers.length ? knownLobbyPlayers : (liveLobby?.players ?? normalizedPlayers)),
        startedAt: startedLobby?.startedAt ?? null,
      },
      transition: {
        color: START_GAME_REVEAL_BLUE,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Spel',
        pauseMs: 80,
        minSolidMs: 560,
        settleMs: 220,
        routeReadySettleMs: 520,
        transitionKey,
      },
    });
  }

  function openStartedLobbyGame(transitionKey) {
    const nextStartedAt = liveLobby?.startedAt ?? null;

    if (!nextStartedAt) {
      setStartGameReveal(null);
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...effectiveConfig,
        ...(liveLobby.config ?? {}),
        spelers: withDefaultPlayerNames(spelers),
        aantalSpelersOpDitApparaat: spelers.length,
        liveLobbyPlayers: liveLobby.players?.length >= knownLobbyPlayers.length
          ? liveLobby.players
          : knownLobbyPlayers,
        startedAt: nextStartedAt,
      },
      replayAt: Date.now(),
      transition: {
        color: START_GAME_REVEAL_BLUE,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Spel',
        pauseMs: 80,
        minSolidMs: 560,
        settleMs: 220,
        routeReadySettleMs: 520,
        transitionKey,
      },
    });
  }

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
  function animatePickerOpen(index) {
    const targetRef = carRefs.current[index];
    targetRef?.measureInWindow?.((x, y, width) => {
      const sourceSize = stageCarSize;
      const measuredWidth = width || sourceSize;
      const sourceLeft = x + (measuredWidth - sourceSize) / 2;
      const destinationLeft = (screenWidth - sourceSize) / 2;

      setHeroTop(y + HERO_CAR_Y_OFFSET);
      setTransitionSourceLeft(sourceLeft);
      setTransitionSkin(spelers[index]?.skin ?? 'rood');
      setTransitionCarSize(sourceSize);
      setSelectedPlayerIndex(index);
      setSkinPickerMounted(true);
      carOpacityValues[index]?.stopAnimation();
      carOpacityValues[index]?.setValue(0);
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
      updateSpeler(closingPlayerIndex, { skin: nextSkin });
      if (closingPlayerIndex === 0) {
        void AsyncStorage.setItem(EQUIPPED_SKIN_STORAGE_KEY, nextSkin);
      }
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
      transitionOpacity.setValue(0);
      carOpacityValues[closingPlayerIndex]?.setValue(1);
      setSelectedPlayerIndex(null);
      setSkinPickerMounted(false);
    });
  }

  return (
    <>
      <WarmupImages
        assets={WAITING_ROOM_ASSETS}
        timeoutMs={null}
        imageSize={128}
        batchSize={16}
        onReady={handleLobbyWarmupReady}
      />
      <ScreenLayout
        onLayout={() => setLobbyLayoutReady(true)}
        title=""
        scroll={false}
        backgroundImage={LOBBY_ROAD_BACKGROUND_IMAGE}
        footerTransparent
        footer={(
          <View style={styles.lobbyActionStack}>
            <GlossyButton
              label="Start spel"
              variant="blue"
              size="large"
              disabled={!canStartHost}
              onPress={handleStart}
              heightOverride={62}
              labelOffsetY={-1}
            />
          </View>
        )}
      >
        <View style={styles.topBar}>
          <BackButton navigation={navigation} onPress={handleBackPress} />
        </View>

        <View style={styles.screenBody}>
          <LobbyCodePlate
            code={config?.lobbyCode}
            title={isCardCodeMode ? 'Kaartcode' : 'Lobbycode'}
          />

          <View style={styles.playerStage}>
            <Animated.View
              style={[
                styles.playerStageSlot,
                { transform: [{ translateX: firstPlayerTranslateX }] },
              ]}
            >
              <PlayerEditor
                player={spelers[0]}
                compact={spelers.length >= 2}
                carSize={stageCarSize}
                carOpacity={carOpacityValues[0]}
                disableCar={skinPickerMounted && selectedPlayerIndex === 0}
                nameWidth={getCompactNameInputWidth(spelers[0]?.naam)}
                carRef={(node) => {
                  carRefs.current[0] = node;
                }}
                onChangeName={(naam) => updateSpeler(0, { naam })}
                onOpenSkinPicker={() => animatePickerOpen(0)}
                attentionDelay={0}
                defaultName="Speler 1"
              />
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
                <AddPlayerButton visible={spelers.length < maxLocalPlayers} onPress={handleAddPlayer} />
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
                  <PlayerEditor
                    player={spelers[1]}
                    compact
                    carSize={stageCarSize}
                    carOpacity={carOpacityValues[1]}
                    disableCar={skinPickerMounted && selectedPlayerIndex === 1}
                    hideRemove={skinPickerMounted && selectedPlayerIndex === 1}
                    nameWidth={getCompactNameInputWidth(spelers[1]?.naam)}
                    carRef={(node) => {
                      carRefs.current[1] = node;
                    }}
                    onChangeName={(naam) => updateSpeler(1, { naam })}
                    onOpenSkinPicker={() => animatePickerOpen(1)}
                    onRemove={() => handleRemovePlayer(1)}
                    attentionDelay={CAR_ATTENTION_STAGGER_MS}
                    defaultName="Speler 2"
                  />
                </Animated.View>
              ) : null}
            </View>
          </View>

          {validationError ? <InlineNote>{validationError}</InlineNote> : null}
          {startError ? <InlineNote>{startError}</InlineNote> : null}

          {!isCardCodeMode ? (
            <PlayerGrid
              players={deelnemers}
              canRemovePlayers={isLiveLobby && isLocalHost}
              localPlayerIds={localPlayerIds}
              onRemovePlayer={handleRemoveLobbyPlayer}
            />
          ) : null}

        </View>
      </ScreenLayout>

      <ConnectionWarningOverlay
        visible={liveConnectionOffline}
        width={screenWidth}
        height={screenHeight}
      />

      <SkinCarouselModal
        visible={skinPickerMounted && selectedPlayer !== null}
        selectedSkin={selectedPlayer?.skin ?? 'rood'}
        takenSkins={takenSkins}
        heroTop={heroTop}
        overlayOpacity={overlayOpacity}
        carouselOpacity={carouselOpacity}
        onClose={() => animatePickerClose()}
        onSelectSkin={(skin) => animatePickerClose(skin)}
      />

      <LobbyGameSettingsPage
        visible={gameSettingsVisible}
        settings={draftGameSettings}
        onChange={updateDraftGameSettings}
        onClose={() => {
          setGameSettingsVisible(false);
        }}
      />

      <Modal
        visible={leaveConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaveConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <Animated.View
            style={{
              opacity: leaveConfirmProgress,
              transform: [
                {
                  scale: leaveConfirmProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            }}
          >
            <PopupPanel
              title={isCardCodeMode ? 'Kaartcode verlaten' : 'Lobby verlaten'}
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label="Nee"
                      variant="red"
                      onPress={() => setLeaveConfirmVisible(false)}
                      disabled={Boolean(leaveLobbyReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label="Ja"
                      variant="green"
                      onPress={handleConfirmLeavePress}
                      disabled={Boolean(leaveLobbyReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                </>
              )}
            >
              {isLocalHost
                ? (isCardCodeMode
                  ? 'Als je deze pagina verlaat, verdwijnt deze kaartcode uit beeld.'
                  : 'Als je deze pagina verlaat, verdwijnt de lobby.')
                : 'Als je nu de pagina verlaat, verlaat je ook de lobby. Je kunt later nog weer joinen.'}
            </PopupPanel>
          </Animated.View>
          {leaveLobbyReveal ? (
            <CircularReveal
              key={leaveLobbyReveal.transitionKey}
              ref={leaveLobbyRevealRef}
              color={LEAVE_LOBBY_REVEAL_GREEN}
              originX={leaveLobbyReveal.originX}
              originY={leaveLobbyReveal.originY}
              onComplete={() => {
                void confirmLeaveLobby(leaveLobbyReveal.transitionKey);
              }}
            />
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={startConfirmVisible}
        transparent
        animationType="none"
        onRequestClose={() => setStartConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <Animated.View
            style={{
              opacity: startConfirmProgress,
              transform: [
                {
                  scale: startConfirmProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1],
                  }),
                },
              ],
            }}
          >
            <PopupPanel
              title="Spel starten"
              fontFamily="FredokaOne_400Regular"
              actions={(
                <>
                  <View style={styles.confirmGlossyButton}>
                    <GlossyButton
                      label="Nee"
                      variant="red"
                      onPress={() => setStartConfirmVisible(false)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                  <View
                    ref={confirmYesButtonRef}
                    collapsable={false}
                    style={styles.confirmGlossyButton}
                  >
                    <GlossyButton
                      label="Ja"
                      variant="green"
                      onPress={(event) => {
                        void handleConfirmStartPress(event);
                      }}
                      disabled={Boolean(startGameReveal)}
                      heightOverride={isTablet ? 84 : 54}
                      horizontalPadding={isTablet ? 38 : 18}
                      labelFontScale={isTablet ? 1.18 : 1}
                    />
                  </View>
                </>
              )}
            >
              {isSinglePlayerLobby ? (
                <Text style={[styles.confirmText, isTablet && styles.confirmTextTablet]}>
                  Er is maar <Text style={styles.confirmTextStrong}>1 speler</Text>{isCardCodeMode ? ' klaar.' : ' in de lobby.'}
                  {' '}Weet je zeker dat je wilt spelen?
                </Text>
              ) : (
                'Weet je zeker dat je het spel wilt beginnen?'
              )}
            </PopupPanel>
          </Animated.View>
          {startGameReveal && startGameReveal.source !== 'remote' ? (
            <CircularReveal
              key={startGameReveal.transitionKey}
              ref={startGameRevealRef}
              color={START_GAME_REVEAL_BLUE}
              originX={startGameReveal.originX}
              originY={startGameReveal.originY}
              onComplete={() => {
                if (startGameReveal.source === 'remote') {
                  openStartedLobbyGame(startGameReveal.transitionKey);
                  return;
                }

                void confirmStart(startGameReveal.transitionKey);
              }}
            />
          ) : null}
        </View>
      </Modal>

      {startGameReveal?.source === 'remote' ? (
        <CircularReveal
          key={startGameReveal.transitionKey}
          ref={startGameRevealRef}
          color={START_GAME_REVEAL_BLUE}
          originX={startGameReveal.originX}
          originY={startGameReveal.originY}
          onComplete={() => {
            openStartedLobbyGame(startGameReveal.transitionKey);
          }}
        />
      ) : null}

      {remoteLobbyExitReveal ? (
        <CircularReveal
          key={remoteLobbyExitReveal.transitionKey}
          ref={remoteLobbyExitRevealRef}
          color={LEAVE_LOBBY_REVEAL_GREEN}
          originX={remoteLobbyExitReveal.originX}
          originY={remoteLobbyExitReveal.originY}
          onComplete={completeRemoteLobbyExit}
        />
      ) : null}

      {skinPickerMounted && selectedPlayer !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.transitionCar,
            {
              top: heroTop,
              left: transitionSourceLeft,
              opacity: transitionOpacity,
              transform: [
                { translateX: transitionTranslateX },
              ],
            },
          ]}
        >
          <PlayerAvatar skin={transitionSkin} size={transitionCarSize} />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    elevation: 20,
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 8,
    justifyContent: 'flex-start',
    gap: 12,
  },
  lobbyActionStack: {
    gap: 10,
  },
  playerStage: {
    height: 244,
    position: 'relative',
    marginBottom: 4,
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
  playerEditor: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  playerEditorCompact: {
    minWidth: 0,
    marginTop: 18,
    paddingBottom: 16,
  },
  nameInputWrap: {
    width: 172,
    borderRadius: 18,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 5,
    shadowOpacity: 0.24,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  nameInputWrapCompact: {
    minWidth: COMPACT_INPUT_BASE_WIDTH,
  },
  nameInput: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
    color: '#111111',
  },
  nameInputCompact: {
    fontSize: 18,
    paddingHorizontal: 10,
  },
  heroCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: -8,
  },
  heroCarButtonHidden: {
    opacity: 0,
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
  addPlayerButton: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 96,
  },
  addPlayerButtonImage: {
    width: 62,
    height: 62,
  },
  grid: {
    position: 'relative',
    alignSelf: 'stretch',
    aspectRatio: 1224 / 876,
    overflow: 'hidden',
    marginHorizontal: -12,
    marginTop: 2,
  },
  gridBackgroundImage: {
    borderRadius: 24,
  },
  gridCell: {
    position: 'absolute',
  },
  gridPlayer: {
    flex: 1,
    position: 'relative',
  },
  gridPlayerAvatar: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -31 }],
  },
  gridPlayerOfflineBadge: {
    position: 'absolute',
    width: 34,
    height: 34,
    right: -8,
    top: -10,
  },
  gridPlayerAvatarLeft: {
    right: '4%',
  },
  gridPlayerAvatarRight: {
    left: '4%',
  },
  gridPlayerName: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    lineHeight: 24,
    color: '#EEDFCB',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(48, 37, 55, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridPlayerNameLeft: {
    left: '1%',
    width: '58%',
  },
  gridPlayerNameRight: {
    right: '1%',
    width: '58%',
  },
  gridPlayerNamePlaceholder: {
    opacity: 0.4,
  },
  gridPlayerRemoveButton: {
    position: 'absolute',
    top: '50%',
    marginTop: 10,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 4,
  },
  gridPlayerRemoveButtonLeft: {
    left: '1%',
  },
  gridPlayerRemoveButtonRight: {
    right: '1%',
  },
  gridPlayerRemovePressable: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.76)',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    gap: 20,
  },
  carouselWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCardShell: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  carouselCardShellMuted: {
    opacity: 0.52,
  },
  carouselCard: {
    width: CAROUSEL_CAR_SIZE,
    height: CAROUSEL_CAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeSkinLock: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 96,
    height: 96,
    marginLeft: -48,
    marginTop: -48,
    zIndex: 4,
  },
  challengeSkinLockedCar: {
    opacity: 0.34,
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
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(244, 241, 232, 0.96)',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#0B3550',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 18,
    shadowColor: '#0B3550',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 28,
    fontFamily: 'FredokaOne_400Regular',
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confirmText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#1F2A37',
    textAlign: 'center',
  },
  confirmTextTablet: {
    fontSize: 24,
    lineHeight: 32,
  },
  confirmTextStrong: {
    fontWeight: '900',
    color: '#143A52',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 14,
  },
  confirmGlossyButton: {
    flex: 1,
  },
  transitionCar: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  settingsPage: {
    flex: 1,
    backgroundColor: '#F4F1E8',
  },
  settingsPageBackground: {
    flex: 1,
  },
  settingsPageGrabberWrap: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 120,
    marginLeft: -60,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  settingsPageGrabber: {
    width: 54,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 58, 82, 0.42)',
  },
  settingsPageScroll: {
    flex: 1,
  },
  settingsPageContent: {
    paddingTop: 78,
    paddingBottom: 34,
    gap: 14,
  },
  settingsPageTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
  },
  settingsPageSectionTitle: {
    marginTop: 2,
    paddingHorizontal: 22,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#143A52',
    letterSpacing: 0,
  },
  settingsSectionLabel: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: '#143A52',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  settingsThemeCarouselWrap: {
    height: 190,
    marginHorizontal: -20,
  },
  settingsThemeCardShell: {
    width: 210,
    height: 168,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(20, 58, 82, 0.28)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  settingsThemeCardShellSelected: {
    borderColor: LOBBY_SETTINGS_BLUE,
  },
  settingsThemeCard: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  settingsThemeCardImage: {
    borderRadius: 14,
  },
  settingsThemeCardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  settingsThemeCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  settingsModeGrid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  settingsModeCard: {
    height: 118,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#0B3550',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#0B3550',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  settingsModeCardSelected: {
    borderColor: LOBBY_SETTINGS_BLUE,
    backgroundColor: 'rgba(226, 247, 255, 0.96)',
  },
  settingsModeCardTitle: {
    position: 'absolute',
    left: 18,
    top: 13,
    zIndex: 2,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    color: '#143A52',
    letterSpacing: 0,
  },
  settingsModeCardArt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settingsModeCardImage: {
    position: 'absolute',
    right: 10,
    width: 132,
    height: 96,
  },
  settingsModeCardImageLeft: {
    right: 80,
    transform: [{ rotate: '-7deg' }],
  },
  settingsModeCardImageCenter: {
    right: 46,
    transform: [{ rotate: '-1deg' }],
  },
  settingsModeCardImageRight: {
    right: 12,
    transform: [{ rotate: '7deg' }],
  },
  settingsBottomPanel: {
    marginHorizontal: 14,
    marginTop: 6,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#0B3550',
    backgroundColor: 'rgba(244, 241, 232, 0.94)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
  },
  settingsBottomPanelTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: '#143A52',
    textAlign: 'center',
    letterSpacing: 0,
  },
  settingsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingsChip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#B8C6D0',
    backgroundColor: '#FFFDFC',
  },
  settingsChipSelected: {
    borderColor: '#0B3550',
    backgroundColor: '#1A7BD4',
  },
  settingsChipText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#143A52',
  },
  settingsChipTextSelected: {
    color: '#FFFFFF',
  },
});
