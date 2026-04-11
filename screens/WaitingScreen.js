import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { BackButton, PrimaryButton, ScreenLayout } from './flowComponents';
import {
  createPlayer,
  PLAYER_SETUP_STORAGE_KEY,
  SKIN_OPTIONS,
} from './gameFlowConfig';
import {
  getLobbySnapshot,
  removePlayers,
  subscribeToLobby,
  upsertPlayers,
} from '../src/services/liveLobbyService';
import LobbyCodePlate from './LobbyCodePlate';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ThemeCarousel from '../src/components/ThemeCarousel';
import RemovePlayerIcon from '../src/components/RemovePlayerIcon';
import { getPlayerSurfaceColors } from '../src/utils/playerColorStyles';

const MAX_PLAYER_NAME_LENGTH = 12;
const MAX_LOCAL_PLAYERS = 2;
const PLAYER_SILHOUETTE_IMAGE = require('../assets/images/players/player-silhouette.png');
const SCREEN_HORIZONTAL_PADDING = 20;
const STAGE_SINGLE_CAR_SIZE = 188;
const STAGE_MULTI_CAR_SIZE = 188;
const CAROUSEL_CAR_SIZE = 224;
const COMPACT_INPUT_BASE_WIDTH = 108;
const COMPACT_INPUT_MAX_WIDTH = 148;
const HERO_CAR_Y_OFFSET = -2;

function normalizeName(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeLocalPlayer(player = {}, fallbackSkin = 'rood') {
  return {
    ...createPlayer({ skin: fallbackSkin }),
    ...player,
    naam: normalizeName(player?.naam ?? ''),
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
  return (
    <Image
      source={PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.rood}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}

function PlayerGrid({ players, localPlayerIds = [] }) {
  const slots = Array.from({ length: 6 }, (_, index) => players[index] ?? null);

  return (
    <View style={styles.grid}>
      {slots.map((player, index) => {
        const playerColors = player ? getPlayerSurfaceColors(player.skin) : null;

        return (
          <View
            key={player?.playerId ?? `slot-${index}`}
            style={[
              styles.gridCell,
              playerColors ? { backgroundColor: playerColors.tint } : null,
              index % 2 === 0 ? styles.gridCellLeft : null,
              index < slots.length - 2 ? styles.gridCellWithBottomBorder : null,
            ]}
          >
            {player ? (
              <View style={styles.gridPlayer}>
                <PlayerAvatar skin={player.skin} size={42} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.gridPlayerName,
                    playerColors ? { color: playerColors.text } : null,
                    !player.naam ? styles.gridPlayerNamePlaceholder : null,
                  ]}
                >
                  {player.naam || 'naam'}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
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
}) {
  const playerColors = getPlayerSurfaceColors(player.skin);

  return (
    <View style={[styles.playerEditor, compact && styles.playerEditorCompact]}>
      <View
        style={[
          styles.nameInputWrap,
          compact && styles.nameInputWrapCompact,
          compact && nameWidth ? { width: nameWidth } : null,
        ]}
      >
        <TextInput
          style={[
            styles.nameInput,
            compact && styles.nameInputCompact,
            {
              backgroundColor: playerColors.strongTint,
              borderColor: playerColors.border,
              color: playerColors.text,
            },
          ]}
          value={player.naam}
          onChangeText={(value) => onChangeName(value.slice(0, MAX_PLAYER_NAME_LENGTH))}
          placeholder="naam"
          placeholderTextColor={playerColors.placeholderText}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
        />
      </View>

      <Animated.View style={carOpacity !== undefined ? { opacity: carOpacity } : null}>
        <View ref={carRef} collapsable={false}>
          <Pressable
            style={styles.heroCarButton}
            onPress={onOpenSkinPicker}
            disabled={disableCar}
          >
            <PlayerAvatar skin={player.skin} size={carSize} />
          </Pressable>
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
  const { width: screenWidth } = useWindowDimensions();
  const [liveLobby, setLiveLobby] = useState(null);
  const [spelers, setSpelers] = useState(() => {
    const initialPlayers = Array.isArray(config?.spelers) && config.spelers.length
      ? config.spelers.slice(0, 1)
      : [createPlayer({ skin: 'rood' })];

    return initialPlayers
      .slice(0, MAX_LOCAL_PLAYERS)
      .map((player, index) => normalizeLocalPlayer(player, index === 0 ? 'rood' : 'blauw'));
  });
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
  const carOpacityValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const carRefs = useRef([]);

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
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    void getLobbySnapshot(config.lobbyCode).then(setLiveLobby);
    return subscribeToLobby(config.lobbyCode, setLiveLobby);
  }, [config?.lobbyCode, config?.syncType]);

  useEffect(() => {
    Animated.timing(playerLayoutProgress, {
      toValue: spelers.length >= 2 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playerLayoutProgress, spelers.length]);

  const localPlayerIds = useMemo(
    () => spelers.map((player) => player.playerId),
    [spelers]
  );

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
    if (config?.syncType !== 'live' || !config?.lobbyCode || validationError) {
      return undefined;
    }

    const normalizedPlayers = spelers.map((player) => ({
      ...player,
      naam: normalizeName(player.naam),
      role: 'guest',
    }));

    const timeout = setTimeout(() => {
      void upsertPlayers(config.lobbyCode, normalizedPlayers);
      void AsyncStorage.setItem(
        PLAYER_SETUP_STORAGE_KEY,
        JSON.stringify({ spelers: normalizedPlayers })
      );
    }, 180);

    return () => clearTimeout(timeout);
  }, [config?.lobbyCode, config?.syncType, spelers, validationError]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !liveLobby?.started) {
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...config,
        ...liveLobby.config,
        aantalSpelersOpDitApparaat: spelers.length,
        spelers: spelers.map((player) => ({
          ...player,
          naam: normalizeName(player.naam),
        })),
        liveLobbyPlayers: liveLobby.players,
      },
    });
  }, [config, liveLobby, navigation, spelers]);

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
    if (spelers.length >= MAX_LOCAL_PLAYERS) {
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
        footer={
          config?.syncType === 'live'
            ? <PrimaryButton label="Nog wachten op start" disabled onPress={() => {}} />
            : <PrimaryButton label="Start nu (placeholder)" onPress={() => navigation.replace('Spel', { config })} />
        }
      >
        <View style={styles.topBar}>
          <BackButton onPress={navigation.goBack} />
        </View>

        <View style={styles.screenBody}>
          <LobbyCodePlate
            code={config?.lobbyCode}
            subtitle="Geef deze code aan de andere spelers"
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
                />
              ))}
            </View>
          ) : null}

          <PlayerGrid players={deelnemers} localPlayerIds={localPlayerIds} />
        </View>
      </ScreenLayout>

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
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
    justifyContent: 'flex-start',
    gap: 12,
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
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  nameInputWrapCompact: {
    minWidth: COMPACT_INPUT_BASE_WIDTH,
  },
  nameInput: {
    borderWidth: 1.5,
    borderRadius: 16,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 2,
  },
  gridCell: {
    minHeight: 74,
    width: '50%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  gridCellLeft: {
    borderRightWidth: 1.5,
    borderRightColor: '#111111',
  },
  gridCellWithBottomBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#111111',
  },
  gridPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridPlayerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
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
