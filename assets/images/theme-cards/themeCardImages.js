export const THEME_CARD_IMAGES = {
  platteland: require('./platteland-theme-card.png'),
  snelweg: require('./snelweg-theme-card.png'),
  stad: require('./stad-theme-card.png'),
  vakantie: require('./vakantie-theme-card.png'),
};

export function getThemeCardImage(themeId) {
  return THEME_CARD_IMAGES[themeId] ?? null;
}
