import { unlockAllSkinChallenges } from '../challenges/skinChallenges';

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
};

function normalizeUnlockCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

export async function redeemUnlockCode(code, { unlockPremiumWithCode } = {}) {
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
    await unlockPremiumWithCode();
  }

  if (unlock.effects.includes('allSkins')) {
    await unlockAllSkinChallenges();
  }

  return {
    ok: true,
    code: normalizedCode,
    title: unlock.title,
    message: unlock.message,
    effects: unlock.effects,
  };
}
