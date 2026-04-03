export const THEMES = [
  {
    id: 'snelweg',
    label: 'Snelweg',
    premium: false,
    emoji: '🛣️',
    bg: '#D93B2B',
    textColor: '#FFFDF7',
    cardSurface: '#2b7898',
    cardBorder: '#123d51',
  },
  {
    id: 'stad',
    label: 'Stad',
    premium: false,
    emoji: '🏙️',
    bg: '#1A5EA8',
    textColor: '#FFFDF7',
    cardSurface: '#d28b2f',
    cardBorder: '#7a4700',
  },
  {
    id: 'platteland',
    label: 'Platteland',
    premium: false,
    emoji: '🌾',
    bg: '#2E8B3F',
    textColor: '#FFFDF7',
    cardSurface: '#4f9c65',
    cardBorder: '#1f5d36',
  },
  {
    id: 'vakantie',
    label: 'Vakantie',
    premium: false,
    emoji: '🌴',
    bg: '#E8622A',
    textColor: '#FFFDF7',
    cardSurface: '#d06b42',
    cardBorder: '#7e3518',
  },
  {
    id: 'winter',
    label: 'Winter',
    premium: true,
    emoji: '❄️',
    bg: '#6EB5FF',
    textColor: '#2D2B55',
    cardSurface: '#d8ecff',
    cardBorder: '#78aede',
  },
  {
    id: 'voertuigen',
    label: 'Voertuigen',
    premium: true,
    emoji: '🚗',
    bg: '#2D2B55',
    textColor: '#F5C400',
    cardSurface: '#44516b',
    cardBorder: '#202b3f',
  },
  {
    id: 'verkeersborden',
    label: 'Verkeersborden',
    premium: true,
    emoji: '⚠️',
    bg: '#FFFDF7',
    textColor: '#2D2B55',
    border: '#D93B2B',
    cardSurface: '#fffaf2',
    cardBorder: '#d93b2b',
  },
];

export const FREE_THEMES = THEMES.filter((theme) => !theme.premium);
export const PREMIUM_THEMES = THEMES.filter((theme) => theme.premium);

export function getThemeById(themeId) {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}
