import { THEMES } from './themeCatalog';

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

export const SKIN_OPTIONS = ['rood', 'blauw', 'groen', 'geel', 'paars', 'oranje'];

export const DEFAULT_ZICHTBAARHEID = {
  eigenVoortgang: true,
  andermansVoortgang: true,
};

export const PLAYER_SETUP_STORAGE_KEY = 'autobingo:last-player-setup';

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
    wincondition: '1rij',
    diagonaal: true,
    kaartOpzet: 'anders',
    modus: 'solo',
    syncType: 'geen',
    lobbyCode: '',
    seed: 0,
    salt: 0,
    aantalSpelersOpDitApparaat: 1,
    zichtbaarheid: { ...DEFAULT_ZICHTBAARHEID },
    spelers: [],
    ...overrides,
  };
}

export function buildPlayerArray(count, defaults = []) {
  return Array.from({ length: count }, (_, index) =>
    createPlayer(defaults[index] ?? {})
  );
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
      kaartOpzet: 'anders',
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
