import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'autobingo:skin-challenge-progress:v2';
const LEGACY_STORAGE_KEYS = [
  'autobingo:skin-challenge-progress:v1',
];
const RAINBOW_COLORS = ['rood', 'oranje', 'geel', 'groen', 'lichtblauw', 'blauw', 'paars'];
const TEN_MINUTES_MS = 10 * 60 * 1000;

const ITEM_SOURCES = {
  koe: [require('../../assets/images/Platteland/koe.png')],
  kat: [require('../../assets/images/Platteland/poes.png')],
  hond: [require('../../assets/images/Platteland/hond.png')],
  politie: [require('../../assets/images/stad/politie auto.png')],
  ambulance: [require('../../assets/images/stad/ambulance.png')],
  brandweer: [require('../../assets/images/stad/brandweerauto.png')],
  kerst: [],
};

export const CHALLENGE_SKINS = [
  'regenboog',
  'koe',
  'kerst',
  'politie',
  'ambulance',
  'brandweer',
  'brons',
  'zilver',
  'goud',
  'kat',
  'hond',
  'hartjes',
  'taxi',
  'vlammen',
];

export const SKIN_CHALLENGES = {
  regenboog: {
    skin: 'regenboog',
    title: 'Regenboog',
    description: 'Haal bingo met elke regenboogkleur.',
    target: RAINBOW_COLORS.length,
    kind: 'set',
  },
  koe: {
    skin: 'koe',
    title: 'Koe',
    description: 'Spot in totaal 3 keer een koe (thema: Platteland).',
    target: 3,
    kind: 'count',
  },
  kerst: {
    skin: 'kerst',
    title: 'Kerst',
    description: 'Spot in totaal 3 keer een kerst-item.',
    target: 3,
    kind: 'count',
  },
  politie: {
    skin: 'politie',
    title: 'Politie',
    description: 'Spot in totaal 3 keer een politieauto (thema: Stad).',
    target: 3,
    kind: 'count',
  },
  ambulance: {
    skin: 'ambulance',
    title: 'Ambulance',
    description: 'Spot in totaal 3 keer een ambulance (thema: Stad).',
    target: 3,
    kind: 'count',
  },
  brandweer: {
    skin: 'brandweer',
    title: 'Brandweer',
    description: 'Spot in totaal 3 keer een brandweerauto (thema: Stad).',
    target: 3,
    kind: 'count',
  },
  brons: {
    skin: 'brons',
    title: 'Brons',
    description: 'Haal in totaal 5 bingo’s.',
    target: 5,
    kind: 'count',
  },
  zilver: {
    skin: 'zilver',
    title: 'Zilver',
    description: 'Haal in totaal 15 bingo’s.',
    target: 15,
    kind: 'count',
  },
  goud: {
    skin: 'goud',
    title: 'Goud',
    description: 'Haal in totaal 30 bingo’s.',
    target: 30,
    kind: 'count',
  },
  kat: {
    skin: 'kat',
    title: 'Kat',
    description: 'Spot in totaal 3 keer een kat (thema: Platteland).',
    target: 3,
    kind: 'count',
  },
  hond: {
    skin: 'hond',
    title: 'Hond',
    description: 'Spot in totaal 3 keer een hond (thema: Platteland).',
    target: 3,
    kind: 'count',
  },
  hartjes: {
    skin: 'hartjes',
    title: 'Hartjes',
    description: 'Speel 1 bingo potje met 2 spelers op 1 apparaat.',
    target: 1,
    kind: 'count',
  },
  taxi: {
    skin: 'taxi',
    title: 'Taxi',
    description: 'Speel een pot met de gele autokleur.',
    target: 1,
    kind: 'count',
  },
  vlammen: {
    skin: 'vlammen',
    title: 'Vlammen',
    description: 'Haal bingo binnen 10 minuten.',
    target: 1,
    kind: 'count',
  },
};

export function isChallengeSkin(skin) {
  return Boolean(SKIN_CHALLENGES[skin]);
}

function clampProgress(value, target) {
  return Math.max(0, Math.min(target, Number(value) || 0));
}

function createDefaultProgress() {
  const challenges = {};

  Object.values(SKIN_CHALLENGES).forEach((challenge) => {
    challenges[challenge.skin] = challenge.kind === 'set'
      ? { completed: [] }
      : { count: 0 };
  });

  return {
    version: 1,
    challenges,
  };
}

function normalizeProgress(rawProgress) {
  const progress = createDefaultProgress();
  const rawChallenges = rawProgress?.challenges ?? {};

  Object.values(SKIN_CHALLENGES).forEach((challenge) => {
    const stored = rawChallenges[challenge.skin];

    if (challenge.kind === 'set') {
      const completed = Array.isArray(stored?.completed) ? stored.completed : [];
      progress.challenges[challenge.skin] = {
        completed: completed.filter((value, index, array) => (
          RAINBOW_COLORS.includes(value) && array.indexOf(value) === index
        )),
      };
      return;
    }

    progress.challenges[challenge.skin] = {
      count: clampProgress(stored?.count, challenge.target),
    };
  });

  return progress;
}

export async function loadSkinChallengeProgress() {
  try {
    await AsyncStorage.multiRemove(LEGACY_STORAGE_KEYS);
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeProgress(storedValue ? JSON.parse(storedValue) : null);
  } catch (_error) {
    return createDefaultProgress();
  }
}

export async function resetSkinChallengeProgress() {
  await AsyncStorage.multiRemove([STORAGE_KEY, ...LEGACY_STORAGE_KEYS]);
  return createDefaultProgress();
}

export async function saveSkinChallengeProgress(progress) {
  const normalizedProgress = normalizeProgress(progress);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProgress));
  return normalizedProgress;
}

export async function unlockAllSkinChallenges() {
  const nextProgress = createDefaultProgress();

  Object.values(SKIN_CHALLENGES).forEach((challenge) => {
    nextProgress.challenges[challenge.skin] = challenge.kind === 'set'
      ? { completed: [...RAINBOW_COLORS] }
      : { count: challenge.target };
  });

  return saveSkinChallengeProgress(nextProgress);
}

export function getChallengeProgressValue(progress, skin) {
  const challenge = SKIN_CHALLENGES[skin];
  const stored = progress?.challenges?.[skin];

  if (!challenge) {
    return {
      current: 1,
      target: 1,
      completed: true,
    };
  }

  const current = challenge.kind === 'set'
    ? (Array.isArray(stored?.completed) ? stored.completed.length : 0)
    : clampProgress(stored?.count, challenge.target);

  return {
    current: clampProgress(current, challenge.target),
    target: challenge.target,
    completed: current >= challenge.target,
  };
}

export function isSkinUnlocked(progress, skin) {
  if (!isChallengeSkin(skin)) {
    return true;
  }

  return getChallengeProgressValue(progress, skin).completed;
}

function hasCheckedTargetIcon({ checked = [], icons = [], targets = [] }) {
  if (!targets.length) {
    return false;
  }

  return icons.some((icon, index) => checked[index] && targets.includes(icon));
}

function incrementCount(nextProgress, skin, amount = 1) {
  const challenge = SKIN_CHALLENGES[skin];
  const stored = nextProgress.challenges[skin] ?? { count: 0 };
  nextProgress.challenges[skin] = {
    count: clampProgress((stored.count ?? 0) + amount, challenge.target),
  };
}

function addRainbowSkin(nextProgress, skin) {
  if (!RAINBOW_COLORS.includes(skin)) {
    return;
  }

  const stored = nextProgress.challenges.regenboog ?? { completed: [] };
  const completed = Array.isArray(stored.completed) ? stored.completed : [];
  if (!completed.includes(skin)) {
    nextProgress.challenges.regenboog = {
      completed: [...completed, skin],
    };
  }
}

export async function recordFinishedGameForSkinChallenges(gameResult) {
  const currentProgress = await loadSkinChallengeProgress();
  const nextProgress = normalizeProgress(currentProgress);
  const completedBingos = gameResult?.completedBingos ?? [];
  const players = gameResult?.players ?? [];
  const boards = gameResult?.boards ?? [];
  const playerSkins = players.map((player) => player?.skin).filter(Boolean);
  const elapsedMs = Number(gameResult?.elapsedMs) || 0;

  completedBingos.forEach((bingo) => {
    const skin = bingo?.skin;
    addRainbowSkin(nextProgress, skin);
  });

  if (completedBingos.length > 0) {
    incrementCount(nextProgress, 'brons', completedBingos.length);
    incrementCount(nextProgress, 'zilver', completedBingos.length);
    incrementCount(nextProgress, 'goud', completedBingos.length);
  }

  if (completedBingos.length > 0 && elapsedMs > 0 && elapsedMs <= TEN_MINUTES_MS) {
    incrementCount(nextProgress, 'vlammen');
  }

  if (players.length >= 2 && gameResult?.syncType === 'geen') {
    incrementCount(nextProgress, 'hartjes');
  }

  if (playerSkins.includes('geel')) {
    incrementCount(nextProgress, 'taxi');
  }

  Object.entries(ITEM_SOURCES).forEach(([skin, targets]) => {
    if (boards.some((board) => hasCheckedTargetIcon({ ...board, targets }))) {
      incrementCount(nextProgress, skin);
    }
  });

  return saveSkinChallengeProgress(nextProgress);
}
