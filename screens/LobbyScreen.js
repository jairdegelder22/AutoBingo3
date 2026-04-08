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
  View,
} from 'react-native';
import { BackButton, InlineNote, ScreenLayout } from './flowComponents';
import { PLAYER_SETUP_STORAGE_KEY, SKIN_OPTIONS, createPlayer } from './gameFlowConfig';
import { ensureLobby, startLobby, subscribeToLobby, upsertPlayers } from '../src/services/liveLobbyService';
import LobbyCodePlate from './LobbyCodePlate';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import ThemeCarousel from '../src/components/ThemeCarousel';

const MAX_PLAYER_NAME_LENGTH = 12;

function normalizeName(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function PlayerAvatar({ skin = 'rood', size = 72 }) {
  return (
    <Image
      source={PLAYER_IMAGES[skin] ?? PLAYER_IMAGES.rood}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function PlayerGrid({ players }) {
  const slots = Array.from({ length: 6 }, (_, index) => players[index] ?? null);

  return (
    <View style={styles.grid}>
      {slots.map((player, index) => (
        <View
          key={player?.playerId ?? `slot-${index}`}
          style={[
            styles.gridCell,
            index % 2 === 0 ? styles.gridCellLeft : null,
            index < slots.length - 2 ? styles.gridCellWithBottomBorder : null,
          ]}
        >
          {player ? (
            <View style={styles.gridPlayer}>
              <PlayerAvatar skin={player.skin} size={52} />
              <Text numberOfLines={1} style={styles.gridPlayerName}>
                {player.naam || (player.role === 'host' ? 'Host' : 'Speler')}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
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
  const orderedSkins = useMemo(() => (
    [selectedSkin, ...SKIN_OPTIONS.filter((skin) => skin !== selectedSkin)]
  ), [selectedSkin]);
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
                    outputRange: [0.94, 1],
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
                    {
                      opacity: takenSkins.includes(item) && item !== selectedSkin ? 0.32 : 1,
                    },
                  ]}
                >
                  <PlayerAvatar skin={item} size={224} />
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

export default function LobbyScreen({ navigation, route }) {
  const [host, setHost] = useState(createPlayer({ skin: 'rood' }));
  const [liveLobby, setLiveLobby] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [skinPickerMounted, setSkinPickerMounted] = useState(false);
  const [heroTop, setHeroTop] = useState(234);
  const [transitionSkin, setTransitionSkin] = useState('rood');
  const config = route.params?.config;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionScale = useRef(new Animated.Value(1)).current;
  const heroCarRef = useRef(null);
  const LOBBY_CAR_SIZE = 188;
  const CAROUSEL_CAR_SIZE = 224;
  const OPEN_SCALE = CAROUSEL_CAR_SIZE / LOBBY_CAR_SIZE;

  useEffect(() => {
    AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY).then((storedValue) => {
      if (!storedValue) return;

      try {
        const parsed = JSON.parse(storedValue);
        setHost((current) => ({
          ...current,
          naam: parsed.spelers?.[0]?.naam ?? current.naam,
          skin: parsed.spelers?.[0]?.skin ?? current.skin,
        }));
        setNameInput(parsed.spelers?.[0]?.naam ?? '');
      } catch (_error) {
        // Negeer corrupte placeholder-data.
      }
    });
  }, []);

  useEffect(() => {
    setNameInput((current) => current || host.naam || '');
  }, [host.naam]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    void ensureLobby({
      code: config.lobbyCode,
      config,
      hostPlayer: {
        ...host,
        playerId: host.playerId,
        naam: normalizeName(host.naam) || 'Host',
        role: 'host',
      },
    });

    return undefined;
  }, [config?.lobbyCode, config?.syncType, host.playerId]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    const unsubscribe = subscribeToLobby(config.lobbyCode, setLiveLobby);
    return unsubscribe;
  }, [config?.lobbyCode, config?.syncType]);

  const andereSpelers = useMemo(
    () => (liveLobby?.players ?? []).filter((player) => player.playerId !== host.playerId),
    [host.playerId, liveLobby?.players]
  );

  const naamFout = useMemo(() => {
    const normalized = normalizeName(nameInput);
    if (!normalized) {
      return 'Voer eerst een naam in.';
    }
    if (normalized.length > MAX_PLAYER_NAME_LENGTH) {
      return `Naam mag maximaal ${MAX_PLAYER_NAME_LENGTH} tekens zijn.`;
    }

    const duplicate = andereSpelers.some(
      (player) => normalizeName(player.naam).toLowerCase() === normalized.toLowerCase()
    );
    if (duplicate) {
      return 'Deze naam is al in gebruik in de lobby.';
    }

    return '';
  }, [andereSpelers, nameInput]);

  const kleurFout = useMemo(() => {
    const duplicate = andereSpelers.some((player) => player.skin === host.skin);
    return duplicate ? 'Deze autokleur is al gekozen door een andere speler.' : '';
  }, [andereSpelers, host.skin]);

  const canSyncHost = !naamFout && !kleurFout;

  useEffect(() => {
    const normalizedName = normalizeName(nameInput);
    setHost((current) => (
      current.naam === normalizedName ? current : { ...current, naam: normalizedName }
    ));
  }, [nameInput]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode || !canSyncHost) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      void upsertPlayers(config.lobbyCode, [{
        ...host,
        playerId: host.playerId,
        naam: normalizeName(host.naam) || 'Host',
        role: 'host',
      }]);

      void AsyncStorage.setItem(
        PLAYER_SETUP_STORAGE_KEY,
        JSON.stringify({
          spelers: [{
            ...host,
            naam: normalizeName(host.naam) || 'Host',
          }],
        })
      );
    }, 180);

    return () => clearTimeout(timeout);
  }, [canSyncHost, config?.lobbyCode, config?.syncType, host]);

  const deelnemers = useMemo(() => {
    if (config?.syncType !== 'live') {
      return [{
        naam: normalizeName(host.naam) || 'Host',
        skin: host.skin,
        playerId: host.playerId,
        role: 'host',
      }];
    }

    return liveLobby?.players?.length ? liveLobby.players : [
      { naam: normalizeName(host.naam) || 'Host', skin: host.skin, playerId: host.playerId, role: 'host' },
    ];
  }, [config?.syncType, host, liveLobby?.players]);

  async function handleStart() {
    if (!canSyncHost) {
      return;
    }

    const spelers = [
      {
        ...host,
        naam: normalizeName(host.naam) || 'Host',
      },
    ];

    await AsyncStorage.setItem(
      PLAYER_SETUP_STORAGE_KEY,
      JSON.stringify({ spelers })
    );

    if (config?.syncType === 'live') {
      await upsertPlayers(config.lobbyCode, spelers.map((player) => ({ ...player, role: 'host' })));
      await startLobby(config.lobbyCode);
    }

    navigation.navigate('Spel', {
      config: {
        ...config,
        aantalSpelersOpDitApparaat: 1,
        spelers,
        liveLobbyPlayers: liveLobby?.players ?? spelers,
      },
    });
  }

  function animatePickerOpen() {
    heroCarRef.current?.measureInWindow?.((_x, y) => {
      setHeroTop(y);
      setTransitionSkin(host.skin);
      setSkinPickerMounted(true);
      carouselOpacity.setValue(0);
      transitionOpacity.setValue(1);
      transitionScale.setValue(1);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 0,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
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
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(transitionScale, {
            toValue: OPEN_SCALE,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.parallel([
            Animated.timing(carouselOpacity, {
              toValue: 1,
              duration: 120,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(transitionOpacity, {
              toValue: 0,
              duration: 90,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    });
  }

  function animatePickerClose(nextSkin) {
    const resolvedSkin = nextSkin ?? transitionSkin;
    setTransitionSkin(resolvedSkin);
    transitionScale.setValue(OPEN_SCALE);
    transitionOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(carouselOpacity, {
        toValue: 0,
        duration: 90,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionScale, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (nextSkin) {
        setHost((current) => ({ ...current, skin: nextSkin }));
      }

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(transitionOpacity, {
          toValue: 0,
          duration: 110,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSkinPickerMounted(false);
      });
    });
  }

  return (
    <>
      <ScreenLayout
        title=""
        scroll={false}
        footer={(
          <Pressable
            style={[styles.startButton, !canSyncHost && styles.startButtonDisabled]}
            disabled={!canSyncHost}
            onPress={handleStart}
          >
            <Text style={styles.startButtonText}>Start spel</Text>
          </Pressable>
        )}
      >
        <View style={styles.topBar}>
          <BackButton onPress={navigation.goBack} />
        </View>

        <View style={styles.screenBody}>
          <LobbyCodePlate
            code={config?.lobbyCode}
            subtitle="Geef deze code aan de andere spelers"
          />

          <View style={styles.heroWrap}>
            <View style={styles.nameInputWrap}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={(value) => setNameInput(value.slice(0, MAX_PLAYER_NAME_LENGTH))}
                placeholder="Jouw naam"
                maxLength={MAX_PLAYER_NAME_LENGTH}
                autoCapitalize="words"
              />
            </View>

            <View ref={heroCarRef} collapsable={false} style={styles.heroCarMeasure}>
              <Animated.View
                style={[
                  styles.heroCarWrap,
                  {
                    opacity: heroOpacity,
                  },
                ]}
                pointerEvents={skinPickerMounted ? 'none' : 'auto'}
              >
                <Pressable style={styles.heroCarButton} onPress={animatePickerOpen}>
                  <PlayerAvatar skin={host.skin} size={LOBBY_CAR_SIZE} />
                </Pressable>
              </Animated.View>
            </View>
            {naamFout ? <InlineNote>{naamFout}</InlineNote> : null}
            {!naamFout && kleurFout ? <InlineNote>{kleurFout}</InlineNote> : null}
          </View>

          <PlayerGrid players={deelnemers} />
        </View>
      </ScreenLayout>

      <SkinCarouselModal
        visible={skinPickerMounted}
        selectedSkin={host.skin}
        takenSkins={andereSpelers.map((player) => player.skin)}
        heroTop={heroTop}
        overlayOpacity={overlayOpacity}
        carouselOpacity={carouselOpacity}
        onClose={() => animatePickerClose()}
        onSelectSkin={(skin) => animatePickerClose(skin)}
      />

      {skinPickerMounted ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.transitionCar,
            {
              top: heroTop,
              opacity: transitionOpacity,
              transform: [{ scale: transitionScale }],
            },
          ]}
        >
          <PlayerAvatar skin={transitionSkin} size={LOBBY_CAR_SIZE} />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 40,
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
  heroWrap: {
    alignItems: 'center',
    gap: 4,
  },
  heroCarMeasure: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInputWrap: {
    width: 172,
    backgroundColor: '#FFFDFC',
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  nameInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
    color: '#111111',
  },
  heroCarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: -8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: -2,
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
  startButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#155E75',
    borderRadius: 22,
    paddingVertical: 18,
    borderWidth: 4,
    borderColor: '#0B3550',
    shadowColor: '#0B3550',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  startButtonDisabled: {
    opacity: 0.45,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
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
  },
  carouselCardShellMuted: {
    opacity: 0.52,
  },
  carouselCard: {
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
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
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
