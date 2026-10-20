import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resetSkinChallengeProgress,
  unlockAllSkinChallenges,
} from '../challenges/skinChallenges';
import { trackUnlockCodeRedemption } from '../services/usageTrackingService';

const PROGRESS_SAVE_AFTER_SKIN_UNLOCK_PROMPT_STORAGE_KEY = '@AutoBingo:progressSaveAfterSkinUnlockPromptSeen:v1';

const UNLOCK_CODES = {
  'AUTOBINGO-PREMIUM-2026': {
    title: 'Premium vrijgespeeld',
    message: 'Premium is nu actief op dit apparaat.',
    effects: ['premium'],
  },
  'AUTOBINGO-SKINS-2026': {
    title: 'Alle skins vrijgespeeld',
    message: 'Alle challenge-skins zijn nu beschikbaar.',
    effects: ['allSkins'],
  },
  'AUTOBINGO-ALLES-2026': {
    title: 'Alles vrijgespeeld',
    message: 'Premium en alle challenge-skins zijn nu beschikbaar.',
    effects: ['premium', 'allSkins'],
  },
  'AUTOBINGO-GRATIS-2026': {
    title: 'Premium uitgezet',
    message: 'De lokale premium-code is uitgezet. De app start opnieuw zonder code-premium.',
    effects: ['disablePremiumCode', 'appReset'],
  },
  'AUTOBINGO-TEST-SKINS-2026': {
    title: 'Alle skins testklaar',
    message: 'Premium, challenge-skins en betaalde skins zijn lokaal vrijgespeeld.',
    effects: ['premium', 'allSkins', 'allPaidSkins'],
  },
  'AUTOBINGO-LOCK-SKINS-2026': {
    title: 'Skins weer gelockt',
    message: 'Lokale test-unlocks zijn uitgezet. Echte aankopen blijven actief.',
    effects: ['disablePremiumCode', 'disablePaidSkins', 'resetChallengeSkins', 'resetProgressSavePrompt', 'appReset'],
  },
};

function normalizeUnlockCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

export async function redeemUnlockCode(code, {
  unlockPremiumWithCode,
  disablePremiumCodeUnlock,
  unlockAllPaidSkinsWithCode,
  disablePaidSkinCodeUnlock,
} = {}) {
  const normalizedCode = normalizeUnlockCode(code);
  const unlock = UNLOCK_CODES[normalizedCode];

  if (!unlock) {
    return {
      ok: false,
      title: 'Code niet gevonden',
      message: 'Controleer de code en probeer het opnieuw.',
    };
  }

  if (unlock.effects.includes('premium') && unlockPremiumWithCode) {
    await unlockPremiumWithCode(normalizedCode);
  }

  if (unlock.effects.includes('disablePremiumCode') && disablePremiumCodeUnlock) {
    await disablePremiumCodeUnlock();
  }

  if (unlock.effects.includes('allPaidSkins') && unlockAllPaidSkinsWithCode) {
    await unlockAllPaidSkinsWithCode();
  }

  if (unlock.effects.includes('disablePaidSkins') && disablePaidSkinCodeUnlock) {
    await disablePaidSkinCodeUnlock();
  }

  if (unlock.effects.includes('allSkins')) {
    await unlockAllSkinChallenges();
  }

  if (unlock.effects.includes('resetChallengeSkins')) {
    await resetSkinChallengeProgress();
  }

  if (unlock.effects.includes('resetProgressSavePrompt')) {
    await AsyncStorage.removeItem(PROGRESS_SAVE_AFTER_SKIN_UNLOCK_PROMPT_STORAGE_KEY);
  }

  try {
    await trackUnlockCodeRedemption(normalizedCode, unlock.effects);
  } catch (_error) {
    // Tracking should never block a valid unlock.
  }

  return {
    ok: true,
    code: normalizedCode,
    title: unlock.title,
    message: unlock.message,
    effects: unlock.effects,
  };
}
