export const PREMIUM_SKIN_OPTIONS = [
  'premium_racer',
];

export const STANDARD_CHALLENGE_SKIN_OPTIONS = [
  'koe',
  'kat',
  'hond',
  'brons',
  'zilver',
  'goud',
  'brandweer',
  'politie',
  'ambulance',
  'hartjes',
  'taxi',
  'vlammen',
  'regenboog',
  'kerst',
];

export const FREE_EPIC_CHALLENGE_SKIN_OPTIONS = [
  'eend',
  'sport_coupe',
  'hot_rod',
  'monstertruck',
  'koninklijke_racer',
  'klassieke_brandweer',
  'locomotief',
];

export const PREMIUM_CHALLENGE_SKIN_OPTIONS = [
  'supercar_racer',
  'neon_nacht',
  'maanrijder',
  'carbon_supercar',
  'ijsco_wagen',
  'piraten_wagen',
  'safari_jeep',
  'strand_buggy',
  'sneeuwschuiver',
  'ridder',
];

export const CHALLENGE_SKIN_OPTIONS = [
  ...STANDARD_CHALLENGE_SKIN_OPTIONS,
  ...FREE_EPIC_CHALLENGE_SKIN_OPTIONS,
  ...PREMIUM_CHALLENGE_SKIN_OPTIONS,
];

export const PAID_SKIN_OPTIONS = [];

export const PAID_SKIN_PRODUCT_IDS = {
};

export const PAID_SKIN_ENTITLEMENT_IDS = Object.fromEntries(
  Object.keys(PAID_SKIN_PRODUCT_IDS).map((skin) => [skin, `skin_${skin}`])
);

export function isPremiumSkin(skin) {
  return PREMIUM_SKIN_OPTIONS.includes(skin);
}

export function isPremiumChallengeSkin(skin) {
  return PREMIUM_CHALLENGE_SKIN_OPTIONS.includes(skin);
}

export function isPaidSkin(skin) {
  return PAID_SKIN_OPTIONS.includes(skin);
}

export function isSkinAvailableForPlayer(skin, { isPremium = false, ownedPaidSkins = [] } = {}) {
  if (isPremiumSkin(skin)) {
    return Boolean(isPremium);
  }

  if (isPremiumChallengeSkin(skin)) {
    return Boolean(isPremium);
  }

  if (isPaidSkin(skin)) {
    return ownedPaidSkins.includes(skin);
  }

  return true;
}
