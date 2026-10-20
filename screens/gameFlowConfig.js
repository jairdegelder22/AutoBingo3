import { THEMES } from './themeCatalog';
import { LOBBY_CODE_SALT_ENTROPY_BITS } from '../src/utils/lobbyCode';
import {
  FREE_EPIC_CHALLENGE_SKIN_OPTIONS,
  PREMIUM_CHALLENGE_SKIN_OPTIONS,
  PREMIUM_SKIN_OPTIONS,
  STANDARD_CHALLENGE_SKIN_OPTIONS,
} from '../src/skins/skinCatalog';

export const THEME_OPTIONS = THEMES.map(({ id, label, premium }) => ({
  id,
  label,
  premium,
}));

export const PLAYABLE_THEME_IDS = THEME_OPTIONS.filter((theme) => !theme.premium).map((theme) => theme.id);

export const WINCONDITION_OPTIONS = [
  { id: '1rij', label: '1 rij' },
  { id: '2rijen', label: '2 rijen' },
  { id: 'heel-blok', label: 'Heel blok' },
];

export const SKIN_OPTIONS = [
  'rood',
  'blauw',
  'groen',
  'geel',
  'oranje',
  'paars',
  'roze',
  'lichtblauw',
  'zwart',
  'wit',
  ...STANDARD_CHALLENGE_SKIN_OPTIONS,
  ...FREE_EPIC_CHALLENGE_SKIN_OPTIONS,
  ...PREMIUM_SKIN_OPTIONS,
  ...PREMIUM_CHALLENGE_SKIN_OPTIONS,
];

export const BASIC_SKIN_OPTIONS = [
  'rood',
  'blauw',
  'groen',
  'geel',
  'oranje',
  'paars',
  'roze',
  'lichtblauw',
  'zwart',
  'wit',
];

export const DEFAULT_ZICHTBAARHEID = {
  eigenVoortgang: true,
  andermansVoortgang: true,
};

export const PLAYER_SETUP_STORAGE_KEY = 'autobingo:last-player-setup';
export const GAME_RULE_PREFERENCES_STORAGE_KEY = 'autobingo:last-game-rule-preferences-v1';
export const EQUIPPED_SKIN_STORAGE_KEY = 'autobingo:equipped-skin';
export const PREFERRED_PLAYER_NAME_STORAGE_KEY = 'autobingo:preferred-player-name';

export const DEFAULT_GAME_RULE_PREFERENCES = {
  wincondition: '1rij',
  diagonaal: true,
  kaartOpzet: 'zelfde',
  nederlands: true,
};

export function normalizeGameRulePreferences(value = {}) {
  return {
    wincondition: WINCONDITION_OPTIONS.some((option) => option.id === value?.wincondition)
      ? value.wincondition
      : DEFAULT_GAME_RULE_PREFERENCES.wincondition,
    diagonaal: typeof value?.diagonaal === 'boolean'
      ? value.diagonaal
      : DEFAULT_GAME_RULE_PREFERENCES.diagonaal,
    kaartOpzet: ['zelfde', 'anders', 'ander-thema'].includes(value?.kaartOpzet)
      ? value.kaartOpzet
      : DEFAULT_GAME_RULE_PREFERENCES.kaartOpzet,
    nederlands: typeof value?.nederlands === 'boolean'
      ? value.nederlands
      : DEFAULT_GAME_RULE_PREFERENCES.nederlands,
  };
}

export function parseStoredGameRulePreferences(storedValue) {
  if (typeof storedValue !== 'string') {
    return DEFAULT_GAME_RULE_PREFERENCES;
  }

  try {
    return normalizeGameRulePreferences(JSON.parse(storedValue));
  } catch (_error) {
    return DEFAULT_GAME_RULE_PREFERENCES;
  }
}

export function serializeGameRulePreferences(value = {}) {
  return JSON.stringify(normalizeGameRulePreferences(value));
}

export function createPlayer(overrides = {}) {
  return {
    naam: '',
    skin: 'rood',
    playerId: createPlayerId(),
    ...overrides,
  };
}

export function createGameConfig(overrides = {}) {
  return {
    thema: 'snelweg',
    ...DEFAULT_GAME_RULE_PREFERENCES,
    modus: 'solo',
    syncType: 'geen',
    lobbyCode: '',
    seed: createRandomSeed(),
    salt: createRandomSalt(),
    aantalSpelersOpDitApparaat: 1,
    zichtbaarheid: { ...DEFAULT_ZICHTBAARHEID },
    spelers: [],
    ...overrides,
  };
}

export function createRandomSeed() {
  return Math.floor(Math.random() * 2 ** 16);
}

export function createRandomSalt() {
  return Math.floor(Math.random() * 2 ** LOBBY_CODE_SALT_ENTROPY_BITS);
}

export function buildPlayerArray(count, defaults = []) {
  return Array.from({ length: count }, (_, index) =>
    createPlayer(defaults[index] ?? {})
  );
}

export function getDefaultPlayerName(index = 0) {
  return `Speler ${index + 1}`;
}

export function isDefaultPlayerName(value = '') {
  return /^Speler\s+\d+$/i.test(String(value).trim());
}

export function normalizeCustomPlayerName(value = '') {
  const normalizedName = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';

  return isDefaultPlayerName(normalizedName) ? '' : normalizedName;
}

export function withDefaultPlayerNames(players = [], startIndex = 0) {
  return players.map((player, index) => {
    const normalizedName = normalizeCustomPlayerName(player?.naam);

    return {
      ...player,
      naam: normalizedName || getDefaultPlayerName(startIndex + index),
    };
  });
}

export function normalizeLobbyCode(value = '') {
  return value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
}

export function createPlaceholderLobbyCode(syncType) {
  return syncType === 'live' ? 'WOLF' : 'ROAD';
}

export function createPlaceholderJoinConfig(code) {
  const normalizedCode = normalizeLobbyCode(code);

  if (normalizedCode === 'WOLF') {
    return createGameConfig({
      thema: 'snelweg',
      wincondition: '1rij',
      diagonaal: true,
      kaartOpzet: 'zelfde',
      nederlands: true,
      modus: 'klassiek',
      syncType: 'live',
      lobbyCode: normalizedCode,
      zichtbaarheid: {
        eigenVoortgang: true,
        andermansVoortgang: true,
      },
    });
  }

  return createGameConfig({
    thema: 'vakantie',
    wincondition: '2rijen',
    diagonaal: true,
    kaartOpzet: 'zelfde',
    nederlands: true,
    modus: 'klassiek',
    syncType: 'geen',
    lobbyCode: normalizedCode || 'ROAD',
    zichtbaarheid: {
      eigenVoortgang: false,
      andermansVoortgang: false,
    },
  });
}

export function getPlayerThemes(baseTheme, playerCount) {
  const fallbackThemes = PLAYABLE_THEME_IDS.filter((themeId) => themeId !== baseTheme);
  const orderedThemes = [baseTheme, ...fallbackThemes];

  return Array.from({ length: playerCount }, (_, index) =>
    orderedThemes[index % orderedThemes.length] ?? baseTheme
  );
}

function createPlayerId() {
  return `player-${Math.random().toString(36).slice(2, 8)}`;
}
