import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CHALLENGE_SKIN_OPTIONS,
  PREMIUM_CHALLENGE_SKIN_OPTIONS,
} from '../skins/skinCatalog';
import { supabase } from '../services/supabaseClient';

const STORAGE_KEY = 'autobingo:skin-challenge-progress:v2';
const LEGACY_STORAGE_KEYS = [
  'autobingo:skin-challenge-progress:v1',
];
const REMOTE_PROGRESS_TABLE = 'account_skin_challenge_progress';
const RAINBOW_COLORS = ['rood', 'oranje', 'geel', 'groen', 'lichtblauw', 'blauw', 'paars'];
const TEN_MINUTES_MS = 10 * 60 * 1000;
const FULL_LOBBY_PLAYER_COUNT = 6;

const ITEM_SOURCES = {
  koe: [require('../../assets/images/Platteland/koe.png')],
  kat: [require('../../assets/images/Platteland/poes.png')],
  hond: [require('../../assets/images/Platteland/hond.png')],
  politie: [require('../../assets/images/stad/politie auto.png')],
  ambulance: [require('../../assets/images/stad/ambulance.png')],
  brandweer: [require('../../assets/images/stad/brandweerauto.png')],
};

const ITEM_ID_TARGETS = {
  locomotief: ['trein'],
  klassieke_brandweer: ['brandweerauto'],
  supercar_racer: ['sportauto'],
  strand_buggy: ['meeuwen', 'parasol', 'strandwachthut', 'tent', 'vuurtoren', 'zandkasteel'],
  sneeuwschuiver: ['slee', 'schaatser', 'sneeuwpop', 'snowcat'],
  piraten_wagen: [
    'cruise schip',
    'zielboot',
    'motorboot',
    'rubberboot',
    'zandkasteel',
    'parasol',
    'meer',
  ],
  safari_jeep: [
    'koe',
    'paard',
    'schaap',
    'hond',
    'meeuwen',
    'eend',
  ],
};

export const CHALLENGE_SKINS = CHALLENGE_SKIN_OPTIONS;

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
    description: 'Spot en vink in totaal drie keer een koe aan.',
    target: 3,
    kind: 'count',
  },
  kerst: {
    skin: 'kerst',
    title: 'Kerst',
    description: 'Speel 5 potjes in december.',
    target: 5,
    kind: 'count',
  },
  politie: {
    skin: 'politie',
    title: 'Politie',
    description: 'Spot en vink in totaal drie keer een politieauto aan.',
    target: 3,
    kind: 'count',
  },
  ambulance: {
    skin: 'ambulance',
    title: 'Ambulance',
    description: 'Spot en vink in totaal drie keer een ambulance aan.',
    target: 3,
    kind: 'count',
  },
  brandweer: {
    skin: 'brandweer',
    title: 'Brandweer',
    description: 'Spot en vink in totaal drie keer een brandweerauto aan.',
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
    description: 'Spot en vink in totaal drie keer een kat aan.',
    target: 3,
    kind: 'count',
  },
  hond: {
    skin: 'hond',
    title: 'Hond',
    description: 'Spot en vink in totaal drie keer een hond aan.',
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
  eend: {
    skin: 'eend',
    title: 'Eend',
    description: 'Haal 7 dagen achter elkaar bingo.',
    target: 7,
    kind: 'count',
  },
  sport_coupe: {
    skin: 'sport_coupe',
    title: 'Sport Coupe',
    description: 'Haal 3 keer bingo met Hele kaart als winconditie.',
    target: 3,
    kind: 'count',
  },
  hot_rod: {
    skin: 'hot_rod',
    title: 'Hot Rod',
    description: 'Haal 10 keer bingo binnen 10 minuten.',
    target: 10,
    kind: 'count',
  },
  monstertruck: {
    skin: 'monstertruck',
    title: 'Monstertruck',
    description: 'Speel 25 potjes met 2 spelers op 1 apparaat.',
    target: 25,
    kind: 'count',
  },
  koninklijke_racer: {
    skin: 'koninklijke_racer',
    title: 'Koninklijke Racer',
    description: 'Haal 10 keer bingo met 2 rijen als winconditie.',
    target: 10,
    kind: 'count',
  },
  klassieke_brandweer: {
    skin: 'klassieke_brandweer',
    title: 'Klassieke Brandweer',
    description: 'Spot en vink 10 keer een brandweerauto aan.',
    target: 10,
    kind: 'count',
  },
  locomotief: {
    skin: 'locomotief',
    title: 'Locomotief',
    description: 'Spot en vink 15 keer een trein aan.',
    target: 15,
    kind: 'count',
  },
  supercar_racer: {
    skin: 'supercar_racer',
    title: 'Supercar Racer',
    description: 'Spot en vink 5 keer een sportauto aan.',
    target: 5,
    kind: 'count',
    premium: true,
  },
  neon_nacht: {
    skin: 'neon_nacht',
    title: 'Neon Nacht',
    description: 'Host 10 online potjes.',
    target: 10,
    kind: 'count',
    premium: true,
  },
  maanrijder: {
    skin: 'maanrijder',
    title: 'Maanrijder',
    description: 'Haal 10 dagen achter elkaar minimaal 1 keer bingo.',
    target: 10,
    kind: 'count',
    premium: true,
  },
  carbon_supercar: {
    skin: 'carbon_supercar',
    title: 'Carbon Supercar',
    description: 'Speel 5 potjes uit met een volle lobby.',
    target: 5,
    kind: 'count',
    premium: true,
  },
  ijsco_wagen: {
    skin: 'ijsco_wagen',
    title: 'IJsco Wagen',
    description: 'Haal 10 keer bingo met het thema Voertuigen.',
    target: 10,
    kind: 'count',
    premium: true,
  },
  piraten_wagen: {
    skin: 'piraten_wagen',
    title: 'Piraten Wagen',
    description: 'Spot 20 boot- of vakantie-items.',
    target: 20,
    kind: 'count',
    premium: true,
  },
  safari_jeep: {
    skin: 'safari_jeep',
    title: 'Safari Jeep',
    description: 'Spot 20 dieren-items.',
    target: 20,
    kind: 'count',
    premium: true,
  },
  strand_buggy: {
    skin: 'strand_buggy',
    title: 'Strand Buggy',
    description: 'Spot 20 vakantie- of strand-items.',
    target: 20,
    kind: 'count',
    premium: true,
  },
  sneeuwschuiver: {
    skin: 'sneeuwschuiver',
    title: 'Sneeuwschuiver',
    description: 'Spot 20 winter- of sneeuw-items.',
    target: 20,
    kind: 'count',
    premium: true,
  },
  ridder: {
    skin: 'ridder',
    title: 'Ridder',
    description: 'Win 10 potjes in Claim mode.',
    target: 10,
    kind: 'count',
    premium: true,
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
    meta: {
      bingoStreakLastDate: null,
      eendStreakLastDate: null,
      maanrijderStreakLastDate: null,
    },
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

  progress.meta = {
    ...progress.meta,
    bingoStreakLastDate: typeof rawProgress?.meta?.bingoStreakLastDate === 'string'
      ? rawProgress.meta.bingoStreakLastDate
      : null,
    eendStreakLastDate: typeof rawProgress?.meta?.eendStreakLastDate === 'string'
      ? rawProgress.meta.eendStreakLastDate
      : typeof rawProgress?.meta?.bingoStreakLastDate === 'string'
        ? rawProgress.meta.bingoStreakLastDate
        : null,
    maanrijderStreakLastDate: typeof rawProgress?.meta?.maanrijderStreakLastDate === 'string'
      ? rawProgress.meta.maanrijderStreakLastDate
      : null,
  };

  return progress;
}

function isSameProgress(leftProgress, rightProgress) {
  return JSON.stringify(normalizeProgress(leftProgress)) === JSON.stringify(normalizeProgress(rightProgress));
}

function getLatestDateKey(...dateKeys) {
  return dateKeys
    .filter((dateKey) => typeof dateKey === 'string' && dateKey.length > 0)
    .sort()
    .pop() ?? null;
}

function mergeSkinChallengeProgress(localProgress, remoteProgress) {
  const local = normalizeProgress(localProgress);
  const remote = normalizeProgress(remoteProgress);
  const merged = createDefaultProgress();

  Object.values(SKIN_CHALLENGES).forEach((challenge) => {
    const localChallenge = local.challenges[challenge.skin];
    const remoteChallenge = remote.challenges[challenge.skin];

    if (challenge.kind === 'set') {
      const completed = [
        ...(Array.isArray(localChallenge?.completed) ? localChallenge.completed : []),
        ...(Array.isArray(remoteChallenge?.completed) ? remoteChallenge.completed : []),
      ].filter((value, index, array) => (
        RAINBOW_COLORS.includes(value) && array.indexOf(value) === index
      ));

      merged.challenges[challenge.skin] = { completed };
      return;
    }

    merged.challenges[challenge.skin] = {
      count: clampProgress(
        Math.max(localChallenge?.count ?? 0, remoteChallenge?.count ?? 0),
        challenge.target
      ),
    };
  });

  merged.meta = {
    bingoStreakLastDate: getLatestDateKey(
      local.meta?.bingoStreakLastDate,
      remote.meta?.bingoStreakLastDate
    ),
    eendStreakLastDate: getLatestDateKey(
      local.meta?.eendStreakLastDate,
      remote.meta?.eendStreakLastDate
    ),
    maanrijderStreakLastDate: getLatestDateKey(
      local.meta?.maanrijderStreakLastDate,
      remote.meta?.maanrijderStreakLastDate
    ),
  };

  return normalizeProgress(merged);
}

async function getAuthenticatedUserId() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data?.user?.id ?? null;
  } catch (_error) {
    return null;
  }
}

async function loadRemoteSkinChallengeProgress() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from(REMOTE_PROGRESS_TABLE)
      .select('progress')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.progress ? normalizeProgress(data.progress) : null;
  } catch (_error) {
    return undefined;
  }
}

async function saveRemoteSkinChallengeProgress(progress) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return false;
  }

  const normalizedProgress = normalizeProgress(progress);

  try {
    const { error } = await supabase
      .from(REMOTE_PROGRESS_TABLE)
      .upsert({
        user_id: userId,
        progress: normalizedProgress,
      }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    return true;
  } catch (_error) {
    return false;
  }
}

async function loadLocalSkinChallengeProgress() {
  try {
    await AsyncStorage.multiRemove(LEGACY_STORAGE_KEYS);
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeProgress(storedValue ? JSON.parse(storedValue) : null);
  } catch (_error) {
    return createDefaultProgress();
  }
}

async function saveLocalSkinChallengeProgress(progress) {
  const normalizedProgress = normalizeProgress(progress);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProgress));
  return normalizedProgress;
}

export async function loadSkinChallengeProgress() {
  const localProgress = await loadLocalSkinChallengeProgress();
  const remoteProgress = await loadRemoteSkinChallengeProgress();

  if (remoteProgress === undefined) {
    return localProgress;
  }

  if (remoteProgress === null) {
    void saveRemoteSkinChallengeProgress(localProgress);
    return localProgress;
  }

  const mergedProgress = mergeSkinChallengeProgress(localProgress, remoteProgress);

  if (!isSameProgress(localProgress, mergedProgress)) {
    await saveLocalSkinChallengeProgress(mergedProgress);
  }

  if (!isSameProgress(remoteProgress, mergedProgress)) {
    void saveRemoteSkinChallengeProgress(mergedProgress);
  }

  return mergedProgress;
}

export async function resetSkinChallengeProgress() {
  await AsyncStorage.multiRemove([STORAGE_KEY, ...LEGACY_STORAGE_KEYS]);
  const defaultProgress = createDefaultProgress();
  await saveRemoteSkinChallengeProgress(defaultProgress);
  return defaultProgress;
}

export async function saveSkinChallengeProgress(progress) {
  const normalizedProgress = normalizeProgress(progress);
  await saveLocalSkinChallengeProgress(normalizedProgress);
  void saveRemoteSkinChallengeProgress(normalizedProgress);
  return normalizedProgress;
}

export async function unlockAllSkinChallenges() {
  const nextProgress = createDefaultProgress();
  const today = getLocalDateKey();

  Object.values(SKIN_CHALLENGES).forEach((challenge) => {
    nextProgress.challenges[challenge.skin] = challenge.kind === 'set'
      ? { completed: [...RAINBOW_COLORS] }
      : { count: challenge.target };
  });

  nextProgress.meta = {
    ...(nextProgress.meta ?? {}),
    bingoStreakLastDate: today,
    eendStreakLastDate: today,
    maanrijderStreakLastDate: today,
  };

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

function getCompletedChallengeUnlocks(previousProgress, nextProgress) {
  return Object.values(SKIN_CHALLENGES)
    .map((challenge) => {
      const previous = getChallengeProgressValue(previousProgress, challenge.skin);
      const current = getChallengeProgressValue(nextProgress, challenge.skin);

      if (previous.completed || !current.completed) {
        return null;
      }

      return {
        skin: challenge.skin,
        title: challenge.title,
        description: challenge.description,
        previous,
        current,
      };
    })
    .filter(Boolean);
}

function hasCheckedTargetIcon({ checked = [], icons = [], targets = [] }) {
  if (!targets.length) {
    return false;
  }

  return icons.some((icon, index) => checked[index] && targets.includes(icon));
}

function countCheckedTargetIcons({ checked = [], icons = [], targets = [] }) {
  if (!targets.length) {
    return 0;
  }

  return icons.reduce((count, icon, index) => (
    checked[index] && targets.includes(icon) ? count + 1 : count
  ), 0);
}

function countCheckedTargetItemIds({ checked = [], itemIds = [], targets = [] }) {
  if (!targets.length) {
    return 0;
  }

  return itemIds.reduce((count, itemId, index) => (
    checked[index] && targets.includes(itemId) ? count + 1 : count
  ), 0);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

function updateBingoStreakChallenges(nextProgress, now = new Date(), isPremium = false) {
  const today = getLocalDateKey(now);
  const yesterday = getPreviousLocalDateKey(now);

  const eendLastDate = nextProgress.meta?.eendStreakLastDate;
  if (eendLastDate !== today) {
    const previousEendStreak = Math.max(nextProgress.challenges.eend?.count ?? 0, 0);
    const nextEendStreak = previousEendStreak >= SKIN_CHALLENGES.eend.target
      ? previousEendStreak
      : eendLastDate === yesterday
        ? previousEendStreak + 1
        : 1;
    nextProgress.challenges.eend = {
      count: clampProgress(nextEendStreak, SKIN_CHALLENGES.eend.target),
    };
    nextProgress.meta = {
      ...(nextProgress.meta ?? {}),
      bingoStreakLastDate: today,
      eendStreakLastDate: today,
    };
  }

  if (isPremium) {
    const maanrijderLastDate = nextProgress.meta?.maanrijderStreakLastDate;
    if (maanrijderLastDate === today) {
      return;
    }

    const previousMaanrijderStreak = Math.max(nextProgress.challenges.maanrijder?.count ?? 0, 0);
    const nextMaanrijderStreak = previousMaanrijderStreak >= SKIN_CHALLENGES.maanrijder.target
      ? previousMaanrijderStreak
      : maanrijderLastDate === yesterday
        ? previousMaanrijderStreak + 1
        : 1;
    nextProgress.challenges.maanrijder = {
      count: clampProgress(nextMaanrijderStreak, SKIN_CHALLENGES.maanrijder.target),
    };
    nextProgress.meta = {
      ...(nextProgress.meta ?? {}),
      maanrijderStreakLastDate: today,
    };
  }
}

function incrementCount(nextProgress, skin, amount = 1) {
  const challenge = SKIN_CHALLENGES[skin];
  if (!challenge) {
    return;
  }

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
  const now = gameResult?.finishedAt ? new Date(gameResult.finishedAt) : new Date();
  const isPremium = Boolean(gameResult?.isPremium);
  const mode = String(gameResult?.mode ?? '').toLowerCase();
  const theme = String(gameResult?.theme ?? '').toLowerCase();
  const wincondition = String(gameResult?.wincondition ?? '').toLowerCase();
  const syncType = String(gameResult?.syncType ?? '').toLowerCase();
  const finishedWithBingo = completedBingos.length > 0;

  completedBingos.forEach((bingo) => {
    const skin = bingo?.skin;
    addRainbowSkin(nextProgress, skin);
  });

  if (completedBingos.length > 0) {
    incrementCount(nextProgress, 'brons', completedBingos.length);
    incrementCount(nextProgress, 'zilver', completedBingos.length);
    incrementCount(nextProgress, 'goud', completedBingos.length);
    updateBingoStreakChallenges(nextProgress, now, isPremium);
  }

  if (completedBingos.length > 0 && elapsedMs > 0 && elapsedMs <= TEN_MINUTES_MS) {
    incrementCount(nextProgress, 'vlammen');
    incrementCount(nextProgress, 'hot_rod');
  }

  if (players.length >= 2 && syncType === 'geen') {
    incrementCount(nextProgress, 'hartjes');
    incrementCount(nextProgress, 'monstertruck');
  }

  if (playerSkins.includes('geel')) {
    incrementCount(nextProgress, 'taxi');
  }

  if (finishedWithBingo && wincondition === 'heel-blok') {
    incrementCount(nextProgress, 'sport_coupe', completedBingos.length);
  }

  if (finishedWithBingo && wincondition === '2rijen') {
    incrementCount(nextProgress, 'koninklijke_racer', completedBingos.length);
  }

  if (finishedWithBingo && isPremium && theme === 'voertuigen') {
    incrementCount(nextProgress, 'ijsco_wagen', completedBingos.length);
  }

  Object.entries(ITEM_SOURCES).forEach(([skin, targets]) => {
    if (boards.some((board) => hasCheckedTargetIcon({ ...board, targets }))) {
      incrementCount(nextProgress, skin);
    }
  });

  Object.entries(ITEM_ID_TARGETS).forEach(([skin, targets]) => {
    if (PREMIUM_CHALLENGE_SKIN_OPTIONS.includes(skin) && !isPremium) {
      return;
    }

    const checkedCount = boards.reduce((count, board) => (
      count + countCheckedTargetItemIds({ ...board, targets })
    ), 0);

    if (checkedCount > 0) {
      incrementCount(nextProgress, skin, checkedCount);
    }
  });

  if (now.getMonth() === 11) {
    incrementCount(nextProgress, 'kerst');
  }

  if (isPremium && gameResult?.hostedOnline) {
    incrementCount(nextProgress, 'neon_nacht');
  }

  if (isPremium && syncType === 'live' && players.length >= FULL_LOBBY_PLAYER_COUNT) {
    incrementCount(nextProgress, 'carbon_supercar');
  }

  if (isPremium && mode === 'claim' && gameResult?.claimWon) {
    incrementCount(nextProgress, 'ridder');
  }

  const savedProgress = await saveSkinChallengeProgress(nextProgress);

  return {
    progress: savedProgress,
    unlockedSkins: getCompletedChallengeUnlocks(currentProgress, savedProgress),
  };
}
