import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { BackButton, ScreenLayout } from './flowComponents';
import {
  createPlayer,
  PLAYER_SETUP_STORAGE_KEY,
  SKIN_OPTIONS,
  normalizeCustomPlayerName,
  withDefaultPlayerNames,
} from './gameFlowConfig';
import {
  removePlayers,
  subscribeToLobby,
  touchPlayerPresence,
  upsertPlayers,
} from '../src/services/liveLobbyService';
import LobbyCodePlate from './LobbyCodePlate';
import { PLAYER_ADD_SILHOUETTE_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ThemeCarousel from '../src/components/ThemeCarousel';
import RemovePlayerIcon from '../src/components/RemovePlayerIcon';
import { getPlayerSurfaceColors } from '../src/utils/playerColorStyles';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import CircularReveal from '../components/CircularReveal';
import { getResponsiveMetrics } from '../src/utils/responsive';
import useOnlineConnectionStatus from '../src/hooks/useOnlineConnectionStatus';
import ConnectionWarningOverlay from '../src/components/ConnectionWarningOverlay';

const MAX_PLAYER_NAME_LENGTH = 12;
const MAX_LOCAL_PLAYERS = 2;
const LEAVE_LOBBY_REVEAL_GREEN = '#159B3B';
const START_GAME_REVEAL_GREEN = '#159B3B';
const PLAYER_SILHOUETTE_IMAGE = PLAYER_ADD_SILHOUETTE_IMAGE;
const LOBBY_ROAD_BACKGROUND_IMAGE = require('../assets/images/backgrounds/lobby-road-background.png');
const LOBBY_PARKING_GRID_IMAGE = require('../assets/images/lobby/lobby-parking-grid.png');
const NO_WIFI_BADGE_IMAGE = require('../assets/images/game-mode-cards/kaartcode-no-wifi.png');
const SCREEN_HORIZONTAL_PADDING = 20;
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 188;
const CAROUSEL_CAR_SIZE = 224;
const CAR_ATTENTION_DELAY_MS = 2600;
const CAR_ATTENTION_STAGGER_MS = 900;
const COMPACT_INPUT_BASE_WIDTH = 108;
const COMPACT_INPUT_MAX_WIDTH = 148;
const HERO_CAR_Y_OFFSET = -2;
const PARKING_GRID_ENTER_OFFSET_Y = -18;
const PARKING_GRID_EXIT_OFFSET_Y = 24;
const PARKING_GRID_SLOT_STYLES = [
  { left: '9.4%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '51.1%', top: '15.6%', width: '39.5%', height: '21.5%' },
  { left: '9.4%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '39.7%', width: '39.5%', height: '21.8%' },
  { left: '9.4%', top: '63.8%', width: '39.5%', height: '21.8%' },
  { left: '51.1%', top: '63.8%', width: '39.5%', height: '21.8%' },
];

function normalizeName(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function formatPlayerGridName(value = '', fallbackName = 'Speler') {
  const normalized = normalizeName(value);
  if (!normalized) {
    return fallbackName;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

    const fallbackSkin = SKIN_OPTIONS.find((skin) => !reservedSkins.has(skin)) ?? player.skin;
    reservedSkins.add(fallbackSkin);
    if (fallbackSkin !== player.skin) {
      changed = true;
      return { ...player, skin: fallbackSkin };
    }
    return player;
  });

  return changed ? nextPlayers : players;
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

function PlayerGrid({ players, localPlayerIds = [] }) {
  const slots = Array.from({ length: 6 }, (_, index) => players[index] ?? null);

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
            />
          </View>
        );
      })}
    </ImageBackground>
  );
}

function AnimatedGridPlayer({ player, isRightSlot, fallbackName }) {
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

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [exiting ? PARKING_GRID_EXIT_OFFSET_Y : PARKING_GRID_ENTER_OFFSET_Y, 0],
  });

  return (
    <Animated.View
      style={[
        styles.gridPlayer,
        {
          opacity: progress,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.gridPlayerAvatar,
          isRightSlot ? styles.gridPlayerAvatarRight : styles.gridPlayerAvatarLeft,
        ]}
      >
        <PlayerAvatar skin={renderedPlayer.skin} size={62} />
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
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.66}
        style={[
          styles.gridPlayerName,
          isRightSlot ? styles.gridPlayerNameRight : styles.gridPlayerNameLeft,
          !renderedPlayer.naam ? styles.gridPlayerNamePlaceholder : null,
        ]}
      >
        {formatPlayerGridName(renderedPlayer.naam, fallbackName)}
      </Text>
    </Animated.View>
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
                  <PlayerAvatar skin={item} size={CAROUSEL_CAR_SIZE} />
                </View>
              </View>
            )}
          />

          <View style={styles.selectButtonWrap}>
            <GlossyButton
              label="Selecteer"
              variant="green"
              heightOverride={62}
              horizontalPadding={44}
              onPress={() => onSelectSkin(activeSkin)}
              disabled={activeSkinTaken}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
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

export default function WaitingScreen({ navigation, route }) {
  const config = route.params?.config;
  const maxLocalPlayers = config?.syncType === 'live' ? 1 : MAX_LOCAL_PLAYERS;
  const shouldRestoreStoredPlayer = config?.syncType === 'live'
    && !(Array.isArray(config?.spelers) && config.spelers.length);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(screenWidth, screenHeight);
  const isLiveLobby = config?.syncType === 'live';
  const connectionStatus = useOnlineConnectionStatus(isLiveLobby);
  const liveConnectionOffline = isLiveLobby && connectionStatus.isOffline;
  const [liveLobby, setLiveLobby] = useState(null);
  const [spelers, setSpelers] = useState(() => {
    const initialPlayers = Array.isArray(config?.spelers) && config.spelers.length
      ? config.spelers.slice(0, 1)
      : [createPlayer({ skin: 'rood' })];

    return initialPlayers
      .slice(0, maxLocalPlayers)
      .map((player, index) => normalizeLocalPlayer(player, index === 0 ? 'rood' : 'blauw'));
  });
  const [storedPlayerLoaded, setStoredPlayerLoaded] = useState(!shouldRestoreStoredPlayer);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSourceLeft, setTransitionSourceLeft] = useState(0);
  const [transitionSkin, setTransitionSkin] = useState('rood');
  const [transitionCarSize, setTransitionCarSize] = useState(STAGE_SINGLE_CAR_SIZE);
  const playerLayoutProgress = useState(() => new Animated.Value(spelers.length >= 2 ? 1 : 0))[0];
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const leaveConfirmProgress = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const leaveLobbyRevealRef = useRef(null);
  const startGameRevealRef = useRef(null);
  const remoteLobbyExitRevealRef = useRef(null);
  const hasObservedLiveLobbyRef = useRef(Boolean(config?.liveLobbyPlayers?.length));
  const localWasInLobbyRef = useRef(false);
  const selfLeavingLobbyRef = useRef(false);
  const lobbyMissingTimeoutRef = useRef(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTranslateX = useRef(new Animated.Value(0)).current;
  const carOpacityValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const carRefs = useRef([]);
  const [leaveLobbyReveal, setLeaveLobbyReveal] = useState(null);
  const [startGameReveal, setStartGameReveal] = useState(null);
  const [remoteLobbyExitReveal, setRemoteLobbyExitReveal] = useState(null);
  const [lobbySnapshotReady, setLobbySnapshotReady] = useState(false);

  useEffect(() => {
    if (config?.syncType === 'live') {
      return undefined;
    }

    const timeout = setTimeout(() => {
      navigation.replace('Spel', { config });
    }, 1800);

    return () => clearTimeout(timeout);
  }, [config, navigation]);

  useEffect(() => {
    if (!shouldRestoreStoredPlayer) {
      setStoredPlayerLoaded(true);
      return undefined;
    }

    let isMounted = true;
    AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY)
      .then((storedValue) => {
        if (!isMounted) {
          return;
        }

        try {
          const parsedPlayers = storedValue
            ? JSON.parse(storedValue)?.spelers
            : null;
          const storedPlayer = Array.isArray(parsedPlayers) && parsedPlayers.length
            ? parsedPlayers[0]
            : null;

          if (storedPlayer) {
            setSpelers([normalizeLocalPlayer({ ...storedPlayer, role: 'guest' }, storedPlayer.skin || 'rood')]);
          }
        } catch (_error) {
          // Corrupte spelerdata mag joinen niet blokkeren.
        } finally {
          setStoredPlayerLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStoredPlayerLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldRestoreStoredPlayer]);

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
    if (!leaveLobbyReveal) {
      return;
    }

    requestAnimationFrame(() => {
      leaveLobbyRevealRef.current?.reveal();
    });
  }, [leaveLobbyReveal]);

  useEffect(() => {
    if (!startGameReveal) {
      return;
    }

    requestAnimationFrame(() => {
      startGameRevealRef.current?.reveal();
    });
  }, [startGameReveal]);

  useEffect(() => {
    if (!remoteLobbyExitReveal) {
      return;
    }

    requestAnimationFrame(() => {
      remoteLobbyExitRevealRef.current?.reveal();
    });
  }, [remoteLobbyExitReveal]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    setLobbySnapshotReady(false);
    const publishLobbySnapshot = (snapshot) => {
      setLobbySnapshotReady(true);
      setLiveLobby(snapshot);
    };

    return subscribeToLobby(config.lobbyCode, publishLobbySnapshot);
  }, [config?.lobbyCode, config?.syncType]);

  useEffect(() => () => {
    if (lobbyMissingTimeoutRef.current) {
      clearTimeout(lobbyMissingTimeoutRef.current);
      lobbyMissingTimeoutRef.current = null;
    }
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

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || !storedPlayerLoaded || liveConnectionOffline || !localPlayerIds.length) {
      return undefined;
    }

    void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    const interval = setInterval(() => {
      void touchPlayerPresence(config.lobbyCode, localPlayerIds);
    }, 5000);

    return () => clearInterval(interval);
  }, [config?.lobbyCode, config?.syncType, liveConnectionOffline, localPlayerIds, storedPlayerLoaded]);

  function startRemoteLobbyExit(message) {
    if (selfLeavingLobbyRef.current || remoteLobbyExitReveal || leaveLobbyReveal) {
      return;
    }

    setRemoteLobbyExitReveal({
      message,
      originX: screenWidth / 2,
      originY: screenHeight / 2,
      transitionKey: `remote-waiting-exit-${Date.now()}`,
    });
  }

  function completeRemoteLobbyExit() {
    const message = remoteLobbyExitReveal?.message
      ?? 'Je bent uit de lobby gehaald of de lobby is gestopt.';
    const transitionKey = remoteLobbyExitReveal?.transitionKey ?? `remote-waiting-home-${Date.now()}`;

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
    if (config?.syncType !== 'live' || liveConnectionOffline) {
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
  }, [config?.syncType, liveConnectionOffline, liveLobby, lobbySnapshotReady, leaveLobbyReveal, remoteLobbyExitReveal]);

  useEffect(() => {
    if (config?.syncType !== 'live' || liveConnectionOffline || !liveLobby) {
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
  }, [config?.syncType, liveConnectionOffline, liveLobby, localPlayerIds, leaveLobbyReveal, remoteLobbyExitReveal]);

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
      transitionKey: `leave-waiting-lobby-${Date.now()}`,
    });
  }

  async function confirmLeaveLobby(transitionKey) {
    if (config?.syncType === 'live' && config?.lobbyCode) {
      await removePlayers(config.lobbyCode, localPlayerIds);
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

    setLeaveConfirmVisible(false);
    setLeaveLobbyReveal(null);
  }

  const remotePlayers = useMemo(
    () => (liveLobby?.players ?? []).filter((player) => !localPlayerIds.includes(player.playerId)),
    [liveLobby?.players, localPlayerIds]
  );

  useEffect(() => {
    setSpelers((current) => resolveUniqueLocalPlayers(current, remotePlayers));
  }, [remotePlayers]);

  const validationError = useMemo(() => {
    const seenNames = new Set();
    const seenSkins = new Set();

    for (const remotePlayer of remotePlayers) {
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
          return 'Een van deze namen is al in gebruik in de lobby.';
        }
        seenNames.add(lowercaseName);
      }

      if (seenSkins.has(player.skin)) {
        return 'Een van deze autokleuren is al gekozen in de lobby.';
      }
      seenSkins.add(player.skin);
    }

    return '';
  }, [remotePlayers, spelers]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || !storedPlayerLoaded || validationError || liveConnectionOffline) {
      return undefined;
    }

    const normalizedPlayers = withDefaultPlayerNames(spelers, remotePlayers.length).map((player) => ({
      ...player,
      role: 'guest',
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
  }, [config?.lobbyCode, config?.syncType, liveConnectionOffline, remotePlayers.length, spelers, storedPlayerLoaded, validationError]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !liveLobby?.started || liveConnectionOffline) {
      return;
    }

    if (remoteLobbyExitReveal) {
      return;
    }

    const currentStartedAt = config?.startedAt ?? null;
    const nextStartedAt = liveLobby.startedAt ?? null;
    if (!nextStartedAt || nextStartedAt === currentStartedAt) {
      return;
    }

    if (!startGameReveal) {
      setStartGameReveal({
        transitionKey: `waiting-spel-${Date.now()}`,
      });
    }
  }, [config?.startedAt, config?.syncType, liveConnectionOffline, liveLobby?.started, liveLobby?.startedAt, remoteLobbyExitReveal, startGameReveal]);

  function openStartedLobbyGame(transitionKey) {
    if (!liveLobby?.started) {
      setStartGameReveal(null);
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...config,
        ...liveLobby.config,
        startedAt: liveLobby.startedAt ?? null,
        aantalSpelersOpDitApparaat: spelers.length,
        spelers: withDefaultPlayerNames(spelers, remotePlayers.length),
        liveLobbyPlayers: liveLobby.players,
      },
      transition: {
        color: START_GAME_REVEAL_GREEN,
        originX: screenWidth / 2,
        originY: screenHeight / 2,
        routeName: 'Spel',
        pauseMs: 220,
        transitionKey,
      },
    });
  }

  const deelnemers = useMemo(() => {
    if (config?.syncType !== 'live') {
      return spelers;
    }

    return liveLobby?.players?.length ? liveLobby.players : spelers;
  }, [config?.syncType, liveLobby?.players, spelers]);

  const selectedPlayer = selectedPlayerIndex === null ? null : spelers[selectedPlayerIndex];
  const stageCarSize = spelers.length >= 2 ? STAGE_MULTI_CAR_SIZE : STAGE_SINGLE_CAR_SIZE;
  const takenSkins = useMemo(
    () => [
      ...remotePlayers.map((player) => player.skin),
      ...spelers
        .filter((_, index) => index !== selectedPlayerIndex)
        .map((player) => player.skin),
    ],
    [remotePlayers, selectedPlayerIndex, spelers]
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
      ...remotePlayers.map((player) => player.skin),
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
      <ScreenLayout
        title=""
        scroll={false}
        backgroundImage={LOBBY_ROAD_BACKGROUND_IMAGE}
        footer={(
          <View style={styles.waitingActionStack}>
            <GlossyButton
              label={config?.syncType === 'live' ? 'Nog wachten op start' : 'Start spel'}
              variant="blue"
              size="large"
              disabled={config?.syncType === 'live'}
              onPress={() => {
                if (config?.syncType !== 'live') {
                  navigation.replace('Spel', { config });
                }
              }}
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
                    key={spelers[1].playerId}
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

          {spelers.length > 2 ? (
            <View style={styles.multiPlayerRow}>
              {spelers.slice(2).map((player, index) => (
                <PlayerEditor
                  key={player.playerId}
                  player={player}
                  compact
                  onChangeName={(naam) => updateSpeler(index + 2, { naam })}
                  onOpenSkinPicker={() => setSelectedPlayerIndex(index + 2)}
                  attentionDelay={(index + 2) * CAR_ATTENTION_STAGGER_MS}
                  defaultName={`Speler ${index + 3}`}
                />
              ))}
            </View>
          ) : null}

          <PlayerGrid players={deelnemers} localPlayerIds={localPlayerIds} />
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
        onSelectSkin={(skin) => {
          animatePickerClose(skin);
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
              title="Lobby verlaten"
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
              Als je nu de pagina verlaat, verlaat je ook de lobby. Je kunt later nog weer joinen.
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

      {startGameReveal ? (
        <CircularReveal
          key={startGameReveal.transitionKey}
          ref={startGameRevealRef}
          color={START_GAME_REVEAL_GREEN}
          originX={screenWidth / 2}
          originY={screenHeight / 2}
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
  waitingActionStack: {
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
  multiPlayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
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
    marginTop: 112,
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
  carouselCardShell: {
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
  carouselCard: {
    width: CAROUSEL_CAR_SIZE,
    height: CAROUSEL_CAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
});
