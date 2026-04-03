import { useEffect, useMemo, useState } from 'react';
import {
  Modal, StyleSheet, Text, View, TouchableOpacity,
  Image, ImageBackground, Dimensions,
} from 'react-native';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import { getRandomIcons } from './themeIcons';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getPlayerThemes } from './gameFlowConfig';
import { getBoardState, setBoardCell, subscribeToBoardState } from '../src/services/liveLobbyService';

const SIZE = 4;
const { width, height } = Dimensions.get('window');
const OUTER_PADDING = 12;
const PADDING = 10;
const GAP = 8;
const TOP_CONTROLS_HEIGHT = 12;
const SECTION_GAP = 12;
const AVAILABLE_BOARD_WIDTH = width - OUTER_PADDING * 2 - PADDING * 2 - GAP * (SIZE - 1);
const AVAILABLE_BOARD_HEIGHT = ((height - TOP_CONTROLS_HEIGHT - SECTION_GAP - OUTER_PADDING * 2) / 2)
  - PADDING * 2
  - GAP * (SIZE - 1);
const CELL_SIZE = Math.floor(Math.min(
  AVAILABLE_BOARD_WIDTH / SIZE,
  AVAILABLE_BOARD_HEIGHT / SIZE,
));
const GRID_HEIGHT = SIZE * CELL_SIZE + (SIZE - 1) * GAP + PADDING * 2;

function darkenHex(hex, factor = 0.82) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;

  const channels = [0, 2, 4].map((index) =>
    Math.max(0, Math.min(255, Math.round(parseInt(value.slice(index, index + 2), 16) * factor)))
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(hex, targetHex = '#ffffff', amount = 0.7) {
  const normalize = (value) => {
    const clean = value.replace('#', '');
    return clean.length === 3
      ? clean.split('').map((char) => char + char).join('')
      : clean;
  };

  const source = normalize(hex);
  const target = normalize(targetHex);

  const channels = [0, 2, 4].map((index) => {
    const sourceValue = parseInt(source.slice(index, index + 2), 16);
    const targetValue = parseInt(target.slice(index, index + 2), 16);
    return Math.round(sourceValue + (targetValue - sourceValue) * amount);
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function withAlpha(hex, alpha = 0.18) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const alphaChannel = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${value}${alphaChannel}`;
}

function getCompletedLines(checked, rules) {
  const lines = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],
    [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],
  ];

  if (rules.allowDiagonal) {
    lines.push([0,5,10,15], [3,6,9,12]);
  }

  return lines.filter((line) => line.every((index) => checked[index]));
}

function findBingo(checked, rules) {
  if (rules.winMode === 'full_card') {
    return checked.every(Boolean) ? 'full_card' : null;
  }

  const completedLines = getCompletedLines(checked, rules);

  if (rules.winMode === 'two_lines') {
    if (completedLines.length >= 2) {
      return [completedLines[0][0], completedLines[0][3]];
    }
    return null;
  }

  if (completedLines.length >= 1) {
    return [completedLines[0][0], completedLines[0][3]];
  }

  return null;
}

function cellCenter(index) {
  const col = index % SIZE;
  const row = Math.floor(index / SIZE);
  return {
    x: PADDING + col * (CELL_SIZE + GAP) + CELL_SIZE / 2,
    y: PADDING + row * (CELL_SIZE + GAP) + CELL_SIZE / 2,
  };
}

// ─── Cel met bounce animatie ─────────────────────────────────────────────────
function BingoCell({ checked, checkedColor, icon, onPress, cellSize }) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          borderRadius: Math.max(10, Math.round(cellSize * 0.18)),
        },
        checked
          ? { backgroundColor: checkedColor, borderColor: darkenHex(checkedColor) }
          : { backgroundColor: '#FFFDF7', borderColor: withAlpha(darkenHex(checkedColor, 0.88), 0.34) },
      ]}
      onPress={handlePress}
      activeOpacity={0.82}
    >
      <Image
        source={icon}
        style={[
          styles.cellIcon,
          {
            width: cellSize * 0.82,
            height: cellSize * 0.82,
          },
        ]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

// ─── Scherm ──────────────────────────────────────────────────────────────────
function getRulesFromProps({
  rules,
  wincondition,
  diagonaal,
  kaartOpzet,
}) {
  if (rules) return rules;

  const winModeMap = {
    '1rij': 'one_line',
    '2rijen': 'two_lines',
    'heel-blok': 'full_card',
  };

  return {
    sharedCards: kaartOpzet === 'zelfde',
    winMode: winModeMap[wincondition] ?? 'one_line',
    allowDiagonal: diagonaal ?? true,
  };
}

export default function BingoCardScreen({
  theme,
  thema,
  seed,
  syncType,
  modus,
  lobbyCode,
  liveLobbyPlayers,
  playerCount,
  playerColors,
  playerNames,
  playerThemes,
  spelers,
  rules,
  wincondition,
  diagonaal,
  aantalSpelersOpDitApparaat,
  kaartOpzet,
  onBack,
  onMenu,
  onReplay,
}) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const resolvedTheme = thema ?? theme ?? 'snelweg';
  const resolvedPlayers = useMemo(
    () => (
      spelers?.length
        ? spelers
        : Array.from({ length: aantalSpelersOpDitApparaat ?? playerCount ?? 1 }, (_, index) => ({
            naam: playerNames?.[index] ?? `Speler ${index + 1}`,
            skin: playerColors?.[index] ?? 'groen',
          }))
    ),
    [aantalSpelersOpDitApparaat, playerColors, playerCount, playerNames, spelers]
  );
  const resolvedPlayerCount = resolvedPlayers.length || aantalSpelersOpDitApparaat || playerCount || 1;
  const resolvedPlayerColors = useMemo(
    () => resolvedPlayers.map((player, index) => player.skin ?? playerColors?.[index] ?? 'groen'),
    [playerColors, resolvedPlayers]
  );
  const derivedThemes = useMemo(
    () => (
      playerThemes?.length
        ? playerThemes
        : kaartOpzet === 'ander-thema'
          ? getPlayerThemes(resolvedTheme, resolvedPlayerCount)
          : Array.from({ length: resolvedPlayerCount }, () => resolvedTheme)
    ),
    [kaartOpzet, playerThemes, resolvedPlayerCount, resolvedTheme]
  );
  const actieveRegels = useMemo(
    () => getRulesFromProps({
      rules,
      wincondition,
      diagonaal,
      kaartOpzet,
    }),
    [rules, wincondition, diagonaal, kaartOpzet]
  );
  const resolvedSeed = Number.isFinite(seed) ? seed : 0;
  const liveSyncEnabled = syncType === 'live' && Boolean(lobbyCode);
  const boardKeys = useMemo(
    () => resolvedPlayers.map((player, index) => {
      if (modus === 'collectief' || modus === 'claim') {
        return 'shared:0';
      }

      return player.playerId ?? `local:${index}`;
    }),
    [modus, resolvedPlayers]
  );
  const allKnownPlayers = useMemo(
    () => {
      const playerMap = new Map();

      [...(liveLobbyPlayers ?? []), ...resolvedPlayers].forEach((player, index) => {
        const playerId = player?.playerId ?? `local:${index}`;
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            playerId,
            skin: player?.skin ?? 'groen',
            naam: player?.naam ?? `Speler ${index + 1}`,
          });
        }
      });

      return playerMap;
    },
    [liveLobbyPlayers, resolvedPlayers]
  );
  const [sharedIcons] = useState(() => getRandomIcons(resolvedTheme, SIZE * SIZE, resolvedSeed));
  const [playerIcons] = useState(() =>
    kaartOpzet === 'ander-thema'
      ? derivedThemes.map((playerTheme, index) => getRandomIcons(playerTheme, SIZE * SIZE, resolvedSeed + index))
      : actieveRegels.sharedCards
      ? Array.from({ length: resolvedPlayerCount }, () => sharedIcons)
      : Array.from({ length: resolvedPlayerCount }, (_, index) => getRandomIcons(resolvedTheme, SIZE * SIZE, resolvedSeed + index))
  );
  const [playerChecked, setPlayerChecked] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(SIZE * SIZE).fill(false))
  );
  const [playerClaimOwners, setPlayerClaimOwners] = useState(() =>
    Array.from({ length: resolvedPlayerCount }, () => Array(SIZE * SIZE).fill(null))
  );
  const [playerWinLines, setPlayerWinLines] = useState(Array(resolvedPlayerCount).fill(null));
  const [winnerColor, setWinnerColor] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;
  const compactTwoPlayerLayout = resolvedPlayerCount >= 2;
  const resolvedCellSize = compactTwoPlayerLayout ? Math.floor(CELL_SIZE * 0.94) : CELL_SIZE;
  const resolvedGap = compactTwoPlayerLayout ? 6 : GAP;
  const resolvedPadding = compactTwoPlayerLayout ? 8 : PADDING;
  const resolvedGridSize = SIZE * resolvedCellSize + (SIZE - 1) * resolvedGap + resolvedPadding * 2;

  function applyLiveBoardState(boardState) {
    setPlayerChecked((current) => current.map((cells, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return cells;
      }

      return entries.map((entry) => Boolean(entry?.checked));
    }));

    setPlayerClaimOwners((current) => current.map((owners, index) => {
      const entries = boardState[boardKeys[index]];
      if (!entries) {
        return owners;
      }

      return entries.map((entry) => entry?.playerId ?? null);
    }));
  }

  useEffect(() => {
    if (!liveSyncEnabled) {
      return undefined;
    }

    void getBoardState(lobbyCode).then((boardState) => {
      applyLiveBoardState(boardState);
    });

    return subscribeToBoardState(lobbyCode, (boardState) => {
      applyLiveBoardState(boardState);
    });
  }, [boardKeys, liveSyncEnabled, lobbyCode]);

  useEffect(() => {
    const nextWins = playerChecked.map((checked) => findBingo(checked, actieveRegels));
    setPlayerWinLines(nextWins);

    const firstWinnerIndex = nextWins.findIndex(Boolean);
    if (firstWinnerIndex >= 0) {
      setWinnerColor(resolvedPlayerColors[firstWinnerIndex] ?? 'groen');
      setWinnerIndex(firstWinnerIndex);
      return;
    }

    setWinnerColor(null);
    setWinnerIndex(null);
  }, [actieveRegels, playerChecked, resolvedPlayerColors]);

  async function handlePress(playerIndex, index) {
    if (playerWinLines[playerIndex]) return;
    const next = playerChecked.map((cells, currentIndex) =>
      currentIndex === playerIndex ? [...cells] : cells
    );
    next[playerIndex][index] = !next[playerIndex][index];
    setPlayerChecked(next);
    setPlayerClaimOwners((current) => current.map((owners, currentIndex) => {
      if (currentIndex !== playerIndex) {
        return owners;
      }

      const nextOwners = [...owners];
      nextOwners[index] = next[playerIndex][index]
        ? (resolvedPlayers[playerIndex]?.playerId ?? null)
        : null;
      return nextOwners;
    }));

    if (liveSyncEnabled) {
      await setBoardCell({
        code: lobbyCode,
        boardKey: boardKeys[playerIndex],
        cellIndex: index,
        checked: next[playerIndex][index],
        playerId: resolvedPlayers[playerIndex]?.playerId,
      });
    }
  }

  function renderBoard(playerIndex) {
    const kleur = resolvedPlayerColors[playerIndex] ?? 'groen';
    const checked = playerChecked[playerIndex];
    const claimOwners = playerClaimOwners[playerIndex];
    const icons = playerIcons[playerIndex];
    const winLine = playerWinLines[playerIndex];
    const checkedColor = PLAYER_HEX[kleur] ?? '#2E8B3F';
    const boardFill = withAlpha(mixHex(checkedColor, '#ffffff', 0.86), 0.72);
    const boardBorder = checkedColor;

    let lineOverlay = null;
    if (Array.isArray(winLine)) {
      const a = {
        x: resolvedPadding + (winLine[0] % SIZE) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
        y: resolvedPadding + Math.floor(winLine[0] / SIZE) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
      };
      const b = {
        x: resolvedPadding + (winLine[1] % SIZE) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
        y: resolvedPadding + Math.floor(winLine[1] / SIZE) * (resolvedCellSize + resolvedGap) + resolvedCellSize / 2,
      };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      lineOverlay = (
        <View
          pointerEvents="none"
          style={[styles.line, {
            width: length,
            left: midX - length / 2,
            top: midY - 4,
            backgroundColor: checkedColor,
            transform: [{ rotate: `${angle}deg` }],
          }]}
        />
      );
    }

    return (
      <View
        key={playerIndex}
        style={[
          styles.playerSection,
          compactTwoPlayerLayout && styles.playerSectionCompact,
        ]}
      >
        <View style={styles.boardShell}>
          <View
            style={[
              styles.gridShell,
              {
                backgroundColor: boardFill,
                borderColor: boardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.gridWrapper,
                {
                  width: resolvedGridSize,
                  height: resolvedGridSize,
                  padding: resolvedPadding,
                  gap: resolvedGap,
                  backgroundColor: withAlpha(mixHex(checkedColor, '#ffffff', 0.84), 0.16),
                },
              ]}
            >
              {icons.map((icon, iconIndex) => (
                (() => {
                  const ownerPlayerId = claimOwners?.[iconIndex];
                  const ownerSkin = ownerPlayerId ? allKnownPlayers.get(ownerPlayerId)?.skin : null;
                  const cellCheckedColor = modus === 'claim' && ownerSkin
                    ? (PLAYER_HEX[ownerSkin] ?? checkedColor)
                    : checkedColor;

                  return (
                <BingoCell
                  key={iconIndex}
                  checked={checked[iconIndex]}
                  checkedColor={cellCheckedColor}
                  icon={icon}
                  cellSize={resolvedCellSize}
                  onPress={() => handlePress(playerIndex, iconIndex)}
                />
                  );
                })()
              ))}
              {lineOverlay}
            </View>
          </View>
        </View>

        {winLine && (
          <Text style={[styles.bingoText, { color: checkedColor, fontFamily: fredoka }]}>
            BINGO!
          </Text>
        )}
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/backgrounds/bingo-original-background.png')}
      resizeMode="cover"
      style={styles.container}
    >
      <View style={styles.backgroundWash} />
      <Modal
        visible={Boolean(winnerColor)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setWinnerColor(null);
          setWinnerIndex(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text
              style={[
                styles.modalTitle,
                {
                  fontFamily: fredoka,
                  color: PLAYER_HEX[winnerColor] ?? '#2D2B55',
                },
              ]}
            >
              BINGO
            </Text>
            <Image
              source={PLAYER_IMAGES[winnerColor] ?? PLAYER_IMAGES.groen}
              style={[
                styles.winnerCarImage,
                winnerIndex === 0 && styles.winnerCarImageMirrored,
              ]}
              resizeMode="contain"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.iconActionButton, styles.homeActionButton]}
                onPress={() => {
                  setWinnerColor(null);
                  setWinnerIndex(null);
                  onMenu?.();
                }}
              >
                <Text style={styles.iconActionSymbol}>⌂</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconActionButton, styles.replayActionButton]}
                onPress={() => {
                  setWinnerColor(null);
                  setWinnerIndex(null);
                  onReplay?.();
                }}
              >
                <Text style={styles.iconActionSymbol}>↻</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.topControls} />

      <View style={styles.cardsColumn}>
        {compactTwoPlayerLayout ? (
          <View style={styles.twoPlayerStack}>
            {renderBoard(0)}
            <View style={styles.middleControlRow}>
              <Image
                source={PLAYER_IMAGES[resolvedPlayerColors[0]] ?? PLAYER_IMAGES.groen}
                style={[styles.middlePlayerCar, styles.middlePlayerCarMirrored]}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.middleHomeButton} onPress={() => onMenu?.()}>
                <Text style={[styles.middleHomeText, { fontFamily: fredoka }]}>HOME</Text>
              </TouchableOpacity>
              <Image
                source={PLAYER_IMAGES[resolvedPlayerColors[1]] ?? PLAYER_IMAGES.blauw}
                style={styles.middlePlayerCar}
                resizeMode="contain"
              />
            </View>
            {renderBoard(1)}
          </View>
        ) : (
          <View style={styles.singlePlayerStack}>
            {Array.from({ length: resolvedPlayerCount }, (_, playerIndex) => renderBoard(playerIndex))}
            <View style={styles.singleHomeRow}>
              <TouchableOpacity style={styles.middleHomeButton} onPress={() => onMenu?.()}>
                <Text style={[styles.middleHomeText, { fontFamily: fredoka }]}>HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#EBF4E8' },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 250, 242, 0.28)',
  },
  topControls: {
    height: TOP_CONTROLS_HEIGHT + 18,
  },

  cardsColumn: {
    flex: 1,
    paddingHorizontal: OUTER_PADDING,
    paddingBottom: OUTER_PADDING,
    paddingTop: 8,
    justifyContent: 'center',
  },
  twoPlayerStack: {
    flex: 1,
    justifyContent: 'center',
  },
  singlePlayerStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSectionCompact: {
    justifyContent: 'center',
    marginBottom: -6,
  },
  boardShell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  middleControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    minHeight: 52,
    marginTop: -8,
    marginBottom: -12,
  },
  singleHomeRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middlePlayerCar: {
    width: 104,
    height: 76,
    marginTop: 10,
  },
  middlePlayerCarMirrored: {
    transform: [{ scaleX: -1 }],
  },
  middleHomeButton: {
    minWidth: 86,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3f6d8d',
    borderWidth: 2,
    borderColor: '#1e3749',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  middleHomeText: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  gridShell: {
    borderWidth: 4,
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },

  cell: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIcon: {},

  line:      { position: 'absolute', height: 8, borderRadius: 4 },
  bingoText: { marginTop: 8, fontSize: 32, letterSpacing: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 35, 46, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFDF7',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 30,
    color: '#2D2B55',
    marginBottom: 18,
  },
  winnerCarImage: {
    width: 360,
    height: 260,
    marginBottom: 18,
  },
  winnerCarImageMirrored: {
    transform: [{ scaleX: -1 }],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 6,
  },
  iconActionButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  homeActionButton: {
    backgroundColor: '#d91f16',
    borderColor: '#0f2b3c',
  },
  replayActionButton: {
    backgroundColor: '#15c255',
    borderColor: '#0f2b3c',
  },
  iconActionSymbol: {
    fontSize: 48,
    lineHeight: 50,
    color: '#000000',
    fontWeight: '700',
  },
});
