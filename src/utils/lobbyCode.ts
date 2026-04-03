export const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_BASE = BigInt(LOBBY_CODE_ALPHABET.length);
const RAW_CODE_LENGTH = 7;

const THEME_TO_BITS = {
  snelweg: 0,
  stad: 1,
  natuur: 2,
  platteland: 2,
  vakantie: 3,
} as const;

const BITS_TO_THEME = ['snelweg', 'stad', 'platteland', 'vakantie'] as const;

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

const THEME_BITS = 2;
const GAME_MODE_BITS = 2;
const SYNC_BITS = 1;
const SEED_BITS = 16;
const SALT_BITS = 6;
const CHECKSUM_BITS = 8;

const PAYLOAD_BITS = THEME_BITS + GAME_MODE_BITS + SYNC_BITS + SEED_BITS + SALT_BITS;
export const TOTAL_LOBBY_CODE_BITS = PAYLOAD_BITS + CHECKSUM_BITS;
export const LOBBY_CODE_SALT_ENTROPY_BITS = SALT_BITS;

const SEED_MASK = (1 << SEED_BITS) - 1;
const SALT_MASK = (1 << SALT_BITS) - 1;

export type ThemeId = keyof typeof THEME_TO_BITS;
export type GameModeId = keyof typeof GAME_MODE_TO_BITS;
export type SyncType = keyof typeof SYNC_TYPE_TO_BITS;

export type GameParams = {
  thema: ThemeId;
  gameMode: GameModeId;
  syncType: SyncType;
  seed: number;
  salt: number;
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
  if (normalizedCode.length !== RAW_CODE_LENGTH) {
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

  const decoded = unpackPayload(payload);
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
  if (normalized.length !== RAW_CODE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, 2)}·${normalized.slice(2, 4)}·${normalized.slice(4)}`;
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
  };
}

function packPayload(params: GameParams): number {
  let value = 0;

  value = (value << THEME_BITS) | THEME_TO_BITS[params.thema];
  value = (value << GAME_MODE_BITS) | GAME_MODE_TO_BITS[params.gameMode];
  value = (value << SYNC_BITS) | SYNC_TYPE_TO_BITS[params.syncType];
  value = (value << SEED_BITS) | clampToBits(params.seed, SEED_BITS);
  value = (value << SALT_BITS) | clampToBits(params.salt, SALT_BITS);

  return value;
}

function unpackPayload(payload: number): GameParams | null {
  let remaining = payload;

  const salt = remaining & SALT_MASK;
  remaining >>= SALT_BITS;

  const seed = remaining & SEED_MASK;
  remaining >>= SEED_BITS;

  const syncBits = remaining & 0b1;
  remaining >>= SYNC_BITS;

  const gameModeBits = remaining & 0b11;
  remaining >>= GAME_MODE_BITS;

  const themeBits = remaining & 0b11;

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
  };
}

function normalizeThemeAlias(theme: ThemeId): ThemeId {
  return theme === 'natuur' ? 'platteland' : theme;
}

function computeChecksum(payload: number): number {
  const bytes = [
    (payload >>> 24) & 0xff,
    (payload >>> 16) & 0xff,
    (payload >>> 8) & 0xff,
    payload & 0xff,
  ];

  let checksum = 0x5d;

  for (const byte of bytes) {
    checksum = (checksum * 131 + byte) & 0xff;
    checksum ^= (checksum >>> 4) & 0x0f;
  }

  return checksum & 0xff;
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
