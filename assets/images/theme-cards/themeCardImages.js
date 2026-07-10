export const THEME_CARD_IMAGES = {
  platteland: require('./platteland-theme-card.png'),
  snelweg: require('./snelweg-theme-card.png'),
  stad: require('./stad-theme-card.png'),
  vakantie: require('./vakantie-theme-card.png'),
  winter: require('./winter-theme-card.png'),
  voertuigen: require('./voertuigen-theme-card.png'),
  verkeersborden: require('./verkeersborden-theme-card.png'),
};

export const THEME_BANNER_FRAME_IMAGES = {
  platteland: require('./banner-frames-v2/platteland-theme-banner-frame.png'),
  snelweg: require('./banner-frames-v2/snelweg-theme-banner-frame.png'),
  stad: require('./banner-frames-v2/stad-theme-banner-frame.png'),
};

export const THEME_DETAIL_BACKGROUND_IMAGES = {
  platteland: require('./detail-backgrounds/platteland-theme-detail-background.png'),
  snelweg: require('./detail-backgrounds/snelweg-theme-detail-background.png'),
  stad: require('./detail-backgrounds/stad-theme-detail-background.png'),
  vakantie: require('./detail-backgrounds/vakantie-theme-detail-background.png'),
  voertuigen: require('./detail-backgrounds/voertuigen-theme-detail-background.png'),
  winter: require('./detail-backgrounds/winter-theme-detail-background.png'),
  verkeersborden: require('./detail-backgrounds/verkeersborden-theme-detail-background.png'),
};

export const THEME_LOCK_OVERLAY_IMAGE = require('./theme-lock-overlay.png');
export const THEME_LOCK_OVERLAY_OVERVIEW_IMAGE = require('./theme-lock-overlay-overview.png');

export function getThemeCardImage(themeId) {
  return THEME_CARD_IMAGES[themeId] ?? null;
}

export function getThemeDetailBackgroundImage(themeId) {
  return THEME_DETAIL_BACKGROUND_IMAGES[themeId] ?? null;
}
