export const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_BASE = BigInt(LOBBY_CODE_ALPHABET.length);
const RAW_CODE_LENGTH = 8;
const LEGACY_RAW_CODE_LENGTH = 7;
const LEGACY_THEME_BITS = 2;
const LEGACY_SALT_BITS = 6;

const THEME_TO_BITS = {
  snelweg: 0,
  stad: 1,
  platteland: 2,
  vakantie: 3,
  winter: 4,
  bergen: 5,
  voertuigen: 6,
  verkeersborden: 7,
  natuur: 2,
} as const;

const BITS_TO_THEME = ['snelweg', 'stad', 'platteland', 'vakantie', 'winter', 'bergen', 'voertuigen', 'verkeersborden'] as const;

const GAME_MODE_TO_BITS = {
  wegenkaart: 0,
  klassiek: 1,
  claim: 2,
  collectief: 3,
} as const;

const BITS_TO_GAME_MODE = ['wegenkaart', 'klassiek', 'claim', 'collectief'] as const;

const SYNC_TYPE_TO_BITS = {
  offline: 0,
  live: 1,
} as const;

const BITS_TO_SYNC_TYPE = ['offline', 'live'] as const;

const WINCONDITION_TO_BITS = {
  '1rij': 0,
  '2rijen': 1,
  'heel-blok': 2,
} as const;

const BITS_TO_WINCONDITION = ['1rij', '2rijen', 'heel-blok'] as const;

const THEME_BITS = 3;
const GAME_MODE_BITS = 2;
const SYNC_BITS = 1;
const WINCONDITION_BITS = 2;
const DIAGONAL_BITS = 1;
const CARD_LAYOUT_BITS = 1;
const DUTCH_BITS = 1;
const SEED_BITS = 16;
const SALT_BITS = 5;
const CHECKSUM_BITS = 8;

const SETTINGS_BITS = WINCONDITION_BITS + DIAGONAL_BITS + CARD_LAYOUT_BITS + DUTCH_BITS;
const PAYLOAD_BITS = THEME_BITS + GAME_MODE_BITS + SYNC_BITS + SETTINGS_BITS + SEED_BITS + SALT_BITS;
export const TOTAL_LOBBY_CODE_BITS = PAYLOAD_BITS + CHECKSUM_BITS;
export const LOBBY_CODE_SALT_ENTROPY_BITS = SALT_BITS;

export type ThemeId = keyof typeof THEME_TO_BITS;
export type GameModeId = keyof typeof GAME_MODE_TO_BITS;
export type SyncType = keyof typeof SYNC_TYPE_TO_BITS;
export type WinconditionId = keyof typeof WINCONDITION_TO_BITS;
export type CardLayoutId = 'zelfde' | 'anders' | 'ander-thema';

export type GameParams = {
  thema: ThemeId;
  gameMode: GameModeId;
  syncType: SyncType;
  seed: number;
  salt: number;
  wincondition?: WinconditionId;
  diagonaal?: boolean;
  kaartOpzet?: CardLayoutId;
  nederlands?: boolean;
};

export function generateLobbyCode(params: GameParams): string {
  const normalized = normalizeGameParams(params);
  if (!normalized) {
    throw new Error('Invalid game params for lobby code generation.');
  }

  const payload = packPayload(normalized);
  const checksum = computeChecksum(payload);
  const combined = (BigInt(payload) << BigInt(CHECKSUM_BITS)) | BigInt(checksum);

  return encodeBase32Fixed(combined, RAW_CODE_LENGTH);
}

export function decodeLobbyCode(code: string): GameParams | null {
  const normalizedCode = normalizeLobbyCode(code);
  const isLegacyCode = normalizedCode.length === LEGACY_RAW_CODE_LENGTH;
  if (normalizedCode.length !== RAW_CODE_LENGTH && !isLegacyCode) {
    return null;
  }

  const combined = decodeBase32(normalizedCode);
  if (combined === null) {
    return null;
  }

  const checksumMask = (1n << BigInt(CHECKSUM_BITS)) - 1n;
  const checksum = Number(combined & checksumMask);
  const payload = Number(combined >> BigInt(CHECKSUM_BITS));

  if (computeChecksum(payload) !== checksum) {
    return null;
  }

  const decoded = isLegacyCode ? unpackLegacyPayload(payload) : unpackPayload(payload);
  return decoded;
}

export function normalizeLobbyCode(code = ''): string {
  return code
    .toUpperCase()
    .replace(/[·.\-\s]/g, '')
    .split('')
    .filter((char) => LOBBY_CODE_ALPHABET.includes(char))
    .join('')
    .slice(0, RAW_CODE_LENGTH);
}

export function formatLobbyCodeForDisplay(code: string): string {
  const normalized = normalizeLobbyCode(code);

  if (normalized.length < 2) {
    return normalized;
  }

  if (normalized.length <= 5) {
    return `${normalized.slice(0, 2)}·${normalized.slice(2)}${normalized.length === 5 ? '·' : ''}`;
  }

  return `${normalized.slice(0, 2)}·${normalized.slice(2, 5)}·${normalized.slice(5)}`;
}

function normalizeGameParams(params: GameParams): GameParams | null {
  if (!(params.thema in THEME_TO_BITS)) {
    return null;
  }

  if (!(params.gameMode in GAME_MODE_TO_BITS)) {
    return null;
  }

  if (!(params.syncType in SYNC_TYPE_TO_BITS)) {
    return null;
  }

  const seed = clampToBits(params.seed, SEED_BITS);
  const salt = clampToBits(
    typeof params.salt === 'number' ? params.salt : randomInt(SALT_BITS),
    SALT_BITS
  );

  return {
    thema: normalizeThemeAlias(params.thema),
    gameMode: params.gameMode,
    syncType: params.syncType,
    seed,
    salt,
    wincondition: params.wincondition && params.wincondition in WINCONDITION_TO_BITS ? params.wincondition : '1rij',
    diagonaal: params.diagonaal !== false,
    kaartOpzet: params.kaartOpzet === 'anders' ? 'anders' : 'zelfde',
    nederlands: params.nederlands !== false,
  };
}

function packPayload(params: GameParams): number {
  let value = 0;

  value = appendBits(value, THEME_BITS, THEME_TO_BITS[params.thema]);
  value = appendBits(value, GAME_MODE_BITS, GAME_MODE_TO_BITS[params.gameMode]);
  value = appendBits(value, SYNC_BITS, SYNC_TYPE_TO_BITS[params.syncType]);
  value = appendBits(value, WINCONDITION_BITS, WINCONDITION_TO_BITS[params.wincondition ?? '1rij']);
  value = appendBits(value, DIAGONAL_BITS, params.diagonaal === false ? 0 : 1);
  value = appendBits(value, CARD_LAYOUT_BITS, params.kaartOpzet === 'anders' ? 1 : 0);
  value = appendBits(value, DUTCH_BITS, params.nederlands === false ? 0 : 1);
  value = appendBits(value, SEED_BITS, clampToBits(params.seed, SEED_BITS));
  value = appendBits(value, SALT_BITS, clampToBits(params.salt, SALT_BITS));

  return value;
}

function unpackPayload(payload: number): GameParams | null {
  let remaining = payload;

  const salt = readLowBits(remaining, SALT_BITS);
  remaining = dropLowBits(remaining, SALT_BITS);

  const seed = readLowBits(remaining, SEED_BITS);
  remaining = dropLowBits(remaining, SEED_BITS);

  const dutchBits = readLowBits(remaining, DUTCH_BITS);
  remaining = dropLowBits(remaining, DUTCH_BITS);

  const cardLayoutBits = readLowBits(remaining, CARD_LAYOUT_BITS);
  remaining = dropLowBits(remaining, CARD_LAYOUT_BITS);

  const diagonalBits = readLowBits(remaining, DIAGONAL_BITS);
  remaining = dropLowBits(remaining, DIAGONAL_BITS);

  const winconditionBits = readLowBits(remaining, WINCONDITION_BITS);
  remaining = dropLowBits(remaining, WINCONDITION_BITS);

  const syncBits = readLowBits(remaining, SYNC_BITS);
  remaining = dropLowBits(remaining, SYNC_BITS);

  const gameModeBits = readLowBits(remaining, GAME_MODE_BITS);
  remaining = dropLowBits(remaining, GAME_MODE_BITS);

  const themeBits = readLowBits(remaining, THEME_BITS);

  const thema = BITS_TO_THEME[themeBits];
  const gameMode = BITS_TO_GAME_MODE[gameModeBits];
  const syncType = BITS_TO_SYNC_TYPE[syncBits];
  const wincondition = BITS_TO_WINCONDITION[winconditionBits];

  if (!thema || !gameMode || !syncType || !wincondition) {
    return null;
  }

  return {
    thema,
    gameMode,
    syncType,
    seed,
    salt,
    wincondition,
    diagonaal: diagonalBits === 1,
    kaartOpzet: cardLayoutBits === 1 ? 'anders' : 'zelfde',
    nederlands: dutchBits === 1,
  };
}

function unpackLegacyPayload(payload: number): GameParams | null {
  let remaining = payload;

  const salt = readLowBits(remaining, LEGACY_SALT_BITS);
  remaining = dropLowBits(remaining, LEGACY_SALT_BITS);

  const seed = readLowBits(remaining, SEED_BITS);
  remaining = dropLowBits(remaining, SEED_BITS);

  const syncBits = readLowBits(remaining, SYNC_BITS);
  remaining = dropLowBits(remaining, SYNC_BITS);

  const gameModeBits = readLowBits(remaining, GAME_MODE_BITS);
  remaining = dropLowBits(remaining, GAME_MODE_BITS);

  const themeBits = readLowBits(remaining, LEGACY_THEME_BITS);

  const thema = BITS_TO_THEME[themeBits];
  const gameMode = BITS_TO_GAME_MODE[gameModeBits];
  const syncType = BITS_TO_SYNC_TYPE[syncBits];

  if (!thema || !gameMode || !syncType) {
    return null;
  }

  return {
    thema,
    gameMode,
    syncType,
    seed,
    salt,
    wincondition: '1rij',
    diagonaal: true,
    kaartOpzet: 'zelfde',
    nederlands: true,
  };
}

function normalizeThemeAlias(theme: ThemeId): ThemeId {
  return theme === 'natuur' ? 'platteland' : theme;
}

function computeChecksum(payload: number): number {
  const unsignedPayload = payload >>> 0;
  const bytes = [
    Math.floor(unsignedPayload / 2 ** 24) & 0xff,
    Math.floor(unsignedPayload / 2 ** 16) & 0xff,
    Math.floor(unsignedPayload / 2 ** 8) & 0xff,
    unsignedPayload & 0xff,
  ];

  let checksum = 0x5d;

  for (const byte of bytes) {
    checksum = (checksum * 131 + byte) & 0xff;
    checksum ^= (checksum >>> 4) & 0x0f;
  }

  return checksum & 0xff;
}

function appendBits(value: number, bits: number, addition: number): number {
  return value * 2 ** bits + addition;
}

function readLowBits(value: number, bits: number): number {
  return value % 2 ** bits;
}

function dropLowBits(value: number, bits: number): number {
  return Math.floor(value / 2 ** bits);
}

function encodeBase32Fixed(value: bigint, length: number): string {
  let remaining = value;
  let result = '';

  for (let index = 0; index < length; index += 1) {
    const charIndex = Number(remaining % LOBBY_CODE_BASE);
    result = LOBBY_CODE_ALPHABET[charIndex] + result;
    remaining /= LOBBY_CODE_BASE;
  }

  return result;
}

function decodeBase32(code: string): bigint | null {
  let value = 0n;

  for (const char of code) {
    const index = LOBBY_CODE_ALPHABET.indexOf(char);
    if (index === -1) {
      return null;
    }

    value = value * LOBBY_CODE_BASE + BigInt(index);
  }

  return value;
}

function clampToBits(value: number, bits: number): number {
  const maxValue = 2 ** bits;
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = Math.floor(Math.abs(value));
  return normalized % maxValue;
}

function randomInt(bits: number): number {
  return Math.floor(Math.random() * 2 ** bits);
}
