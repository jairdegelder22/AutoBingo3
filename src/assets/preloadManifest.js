import { Image } from 'react-native';
import { getPlayerThemes } from '../../screens/gameFlowConfig';
import { getRandomIcons, getThemeIcons } from '../../screens/themeIcons';
import {
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  PLAYER_IMAGES,
} from '../../assets/images/players/playerImages';
import {
  THEME_CARD_IMAGES,
  THEME_DETAIL_BACKGROUND_IMAGES,
  THEME_LOCK_OVERLAY_IMAGE,
  THEME_LOCK_OVERLAY_OVERVIEW_IMAGE,
  getThemeDetailBackgroundImage,
} from '../../assets/images/theme-cards/themeCardImages';

export const COMMON_NAV_ASSETS = [
  require('../../assets/images/navigation/back-button.png'),
  require('../../assets/images/navigation/back-button-pressed.png'),
  require('../../assets/images/navigation/settings-gear.png'),
];

export const HOME_ASSETS = [
  ...COMMON_NAV_ASSETS,
  require('../../assets/homepage.png'),
  require('../../assets/logo.png'),
  require('../../assets/images/home-online-button.png'),
  require('../../assets/images/online-car-yellow.png'),
  require('../../assets/images/online-car-blue.png'),
  require('../../assets/images/online-car-green.png'),
  require('../../assets/images/host-lock-chains.png'),
  require('../../assets/images/host-lock-padlock.png'),
  require('../../assets/images/license-plates/dutch-join-plate-cropped.png'),
  require('../../assets/images/premium/main-menu-premium-crown.png'),
  require('../../assets/images/ui/bug-report-button.png'),
  require('../../assets/images/ui/bug-report-menu.png'),
  require('../../assets/images/ui/bug-report-close.png'),
  require('../../assets/images/ui/driver-warning-menu.png'),
  require('../../assets/images/ui/driver-warning-icon.png'),
  require('../../assets/images/backgrounds/skin-road-background.png'),
  require('../../assets/images/backgrounds/theme-road-scroll-background-v4.png'),
  require('../../assets/images/players/challenge-skin-lock.png'),
  require('../../assets/images/nav-icons/nav-palette.png'),
  require('../../assets/images/nav-icons/nav-home.png'),
  require('../../assets/images/nav-icons/nav-cards.png'),
  THEME_LOCK_OVERLAY_OVERVIEW_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
];

export const HOME_CRITICAL_ASSETS = [
  require('../../assets/homepage.png'),
  require('../../assets/logo.png'),
  require('../../assets/images/home-online-button.png'),
  require('../../assets/images/navigation/settings-gear.png'),
  require('../../assets/images/premium/main-menu-premium-crown.png'),
  require('../../assets/images/ui/bug-report-button.png'),
  require('../../assets/images/nav-icons/nav-palette.png'),
  require('../../assets/images/nav-icons/nav-home.png'),
  require('../../assets/images/nav-icons/nav-cards.png'),
];

export const PREMIUM_MODAL_ASSETS = [
  require('../../assets/images/premium/premium-menu.png'),
  require('../../assets/images/premium/benefits/no-ads-user.png'),
  require('../../assets/images/premium/benefits/extra-themes-user.png'),
  require('../../assets/images/premium/benefits/host-bingo-user.png'),
  require('../../assets/images/premium/close-premium.png'),
  require('../../assets/images/premium/take-premium-button.png'),
  require('../../assets/images/premium/take-premium-button-pressed.png'),
  require('../../assets/images/premium/radio-unselected.png'),
  require('../../assets/images/premium/radio-selected.png'),
  require('../../assets/images/premium/main-menu-premium-crown.png'),
];

export const BUG_REPORT_MODAL_ASSETS = [
  require('../../assets/images/ui/bug-report-menu.png'),
  require('../../assets/images/ui/bug-report-close.png'),
];

export const SETTINGS_ASSETS = [
  require('../../assets/images/settings/settings-menu-panel.png'),
  require('../../assets/images/settings/settings-language.png'),
  require('../../assets/images/settings/settings-tutorial.png'),
  require('../../assets/images/settings/settings-privacy.png'),
  require('../../assets/images/settings/settings-premium-restore.png'),
  require('../../assets/images/settings/code-invoeren-menu.png'),
  require('../../assets/images/premium/main-menu-premium-crown.png'),
  require('../../assets/images/settings/toggles/sfx-on.png'),
  require('../../assets/images/settings/toggles/sfx-off.png'),
  require('../../assets/images/settings/toggles/music-on.png'),
  require('../../assets/images/settings/toggles/music-off.png'),
  require('../../assets/images/settings/toggles/haptics-on.png'),
  require('../../assets/images/settings/toggles/haptics-off.png'),
  require('../../assets/images/settings/toggles/state-on.png'),
  require('../../assets/images/settings/toggles/state-off.png'),
];

export const POPUP_PANEL_ASSETS = [
  require('../../assets/images/ui/popups/popup-menu-panel.png'),
];

export const SETUP_RULE_ASSETS = [
  require('../../assets/images/settings/crown-logo.png'),
  require('../../assets/images/settings/diagonal-logo.png'),
  require('../../assets/images/settings/rules-menu-panel-v2.png'),
  require('../../assets/images/settings/rules-slider-frame-wincondition.png'),
  require('../../assets/images/settings/rules-slider-frame-diagonal.png'),
  require('../../assets/images/settings/win-condition-title.png'),
  require('../../assets/images/settings/diagonal-rule-title.png'),
  require('../../assets/images/settings/win-1-line.png'),
  require('../../assets/images/settings/win-2-lines.png'),
  require('../../assets/images/settings/win-full-card.png'),
  require('../../assets/images/settings/diagonal-on.png'),
  require('../../assets/images/settings/diagonal-off.png'),
];

export const SETUP_ASSETS = [
  ...COMMON_NAV_ASSETS,
  require('../../assets/images/backgrounds/game-setup-birds-eye-background-v4.png'),
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  require('../../assets/images/players/challenge-skin-lock.png'),
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
  THEME_LOCK_OVERLAY_IMAGE,
  ...SETUP_RULE_ASSETS,
  ...PREMIUM_MODAL_ASSETS,
];

export const GAME_MODE_ASSETS = [
  require('../../assets/images/game-mode-cards/wifi-required.png'),
  require('../../assets/images/game-mode-cards/wifi-not-required.png'),
  require('../../assets/images/game-mode-cards/offline-section-no-wifi.png'),
  require('../../assets/images/game-mode-cards/wifi-status-panel.png'),
  require('../../assets/images/game-mode-cards/klassiek-card-red.png'),
  require('../../assets/images/game-mode-cards/klassiek-card-green.png'),
  require('../../assets/images/game-mode-cards/klassiek-card-blue.png'),
  require('../../assets/images/game-mode-cards/klassiek-game-mode-base.png'),
  require('../../assets/images/game-mode-cards/claim-game-mode-base.png'),
  require('../../assets/images/game-mode-cards/collectief-game-mode-base.png'),
  require('../../assets/images/game-mode-cards/kaartcode-game-mode-base.png'),
  require('../../assets/images/game-mode-cards/kaartcode-card-yellow.png'),
  require('../../assets/images/game-mode-cards/kaartcode-card-blue.png'),
  require('../../assets/images/game-mode-cards/kaartcode-no-wifi.png'),
  require('../../assets/images/game-mode-cards/claim-bingo-board.png'),
  require('../../assets/images/game-mode-cards/claim-direct-bingo-board.png'),
  require('../../assets/images/game-mode-cards/collectief-bingo-board.png'),
  require('../../assets/images/license-plates/dutch-join-plate-cropped.png'),
];

export const HOST_ASSETS = [
  ...SETUP_ASSETS,
  ...GAME_MODE_ASSETS,
  require('../../assets/images/backgrounds/lobby-road-background.png'),
  require('../../assets/images/lobby/lobby-parking-grid.png'),
];

export const WAITING_ROOM_ASSETS = [
  require('../../assets/images/backgrounds/lobby-road-background.png'),
  require('../../assets/images/lobby/lobby-parking-grid.png'),
  require('../../assets/images/game-mode-cards/kaartcode-no-wifi.png'),
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  require('../../assets/images/players/challenge-skin-lock.png'),
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
];

export const BINGO_BOARD_ASSET_BY_SKIN = {
  blauw: require('../../assets/images/bingo-boards/board-blauw.png'),
  geel: require('../../assets/images/bingo-boards/board-geel.png'),
  groen: require('../../assets/images/bingo-boards/board-groen.png'),
  lichtblauw: require('../../assets/images/bingo-boards/board-lichtblauw.png'),
  oranje: require('../../assets/images/bingo-boards/board-oranje.png'),
  paars: require('../../assets/images/bingo-boards/board-paars.png'),
  rood: require('../../assets/images/bingo-boards/board-rood.png'),
  roze: require('../../assets/images/bingo-boards/board-roze.png'),
  wit: require('../../assets/images/bingo-boards/board-wit.png'),
  zwart: require('../../assets/images/bingo-boards/board-zwart.png'),
  neutral: require('../../assets/images/bingo-boards/board-neutral.png'),
  regenboog: require('../../assets/images/bingo-boards/board-regenboog.png'),
  koe: require('../../assets/images/bingo-boards/board-koe.png'),
  kerst: require('../../assets/images/bingo-boards/board-kerst.png'),
  politie: require('../../assets/images/bingo-boards/board-politie.png'),
  ambulance: require('../../assets/images/bingo-boards/board-ambulance.png'),
  brandweer: require('../../assets/images/bingo-boards/board-brandweer.png'),
  brons: require('../../assets/images/bingo-boards/board-brons.png'),
  zilver: require('../../assets/images/bingo-boards/board-zilver.png'),
  goud: require('../../assets/images/bingo-boards/board-goud.png'),
  kat: require('../../assets/images/bingo-boards/board-kat.png'),
  hond: require('../../assets/images/bingo-boards/board-hond.png'),
  hartjes: require('../../assets/images/bingo-boards/board-hartjes.png'),
  taxi: require('../../assets/images/bingo-boards/board-taxi.png'),
  vlammen: require('../../assets/images/bingo-boards/board-vlammen.png'),
};

export const BINGO_BOARD_ASSETS = Object.values(BINGO_BOARD_ASSET_BY_SKIN);

export const CLAIM_PODIUM_ASSETS = [
  require('../../assets/images/claim-results/podium-blauw.png'),
  require('../../assets/images/claim-results/podium-geel.png'),
  require('../../assets/images/claim-results/podium-groen.png'),
  require('../../assets/images/claim-results/podium-lichtblauw.png'),
  require('../../assets/images/claim-results/podium-oranje.png'),
  require('../../assets/images/claim-results/podium-paars.png'),
  require('../../assets/images/claim-results/podium-red.png'),
  require('../../assets/images/claim-results/podium-roze.png'),
  require('../../assets/images/claim-results/podium-wit.png'),
  require('../../assets/images/claim-results/podium-zwart.png'),
  require('../../assets/images/claim-results/podium-regenboog.png'),
  require('../../assets/images/claim-results/podium-koe.png'),
  require('../../assets/images/claim-results/podium-kerst.png'),
  require('../../assets/images/claim-results/podium-politie.png'),
  require('../../assets/images/claim-results/podium-ambulance.png'),
  require('../../assets/images/claim-results/podium-brandweer.png'),
  require('../../assets/images/claim-results/podium-brons.png'),
  require('../../assets/images/claim-results/podium-zilver.png'),
  require('../../assets/images/claim-results/podium-goud.png'),
  require('../../assets/images/claim-results/podium-kat.png'),
  require('../../assets/images/claim-results/podium-hond.png'),
  require('../../assets/images/claim-results/podium-hartjes.png'),
  require('../../assets/images/claim-results/podium-taxi.png'),
  require('../../assets/images/claim-results/podium-vlammen.png'),
];

export const GAME_BASE_ASSETS = [
  require('../../assets/images/backgrounds/bingo-original-background.png'),
  ...COMMON_NAV_ASSETS,
];

export const BOOT_ASSETS = [
  ...HOME_CRITICAL_ASSETS,
  ...POPUP_PANEL_ASSETS,
  ...SETTINGS_ASSETS,
  ...PREMIUM_MODAL_ASSETS,
];

export const ROUTE_PRELOADERS = {
  Home: HOME_ASSETS,
  SingleDeviceSetupTest: SETUP_ASSETS,
  HostSetup: HOST_ASSETS,
  Wachten: WAITING_ROOM_ASSETS,
  Lobby: WAITING_ROOM_ASSETS,
  Instellingen: SETTINGS_ASSETS,
};

export const BOOT_WARMUP_ROUTE_NAMES = [
  'Home',
  'SingleDeviceSetupTest',
  'HostSetup',
  'Wachten',
  'Lobby',
];

export function uniqueAssets(assets) {
  return [...new Set(assets.filter(Boolean))];
}

export function getAssetKey(source) {
  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? String(source);
}

export function getThemeDetailAssets(themeId, extraAssets = []) {
  return uniqueAssets([
    getThemeDetailBackgroundImage(themeId),
    THEME_CARD_IMAGES[themeId],
    ...extraAssets,
    ...getThemeIcons(themeId),
  ]);
}

export function getAllThemeDetailAssets() {
  return uniqueAssets([
    ...Object.values(THEME_DETAIL_BACKGROUND_IMAGES),
    ...Object.values(THEME_CARD_IMAGES),
    ...Object.keys(THEME_DETAIL_BACKGROUND_IMAGES).flatMap((themeId) => getThemeIcons(themeId)),
  ]);
}

export function getGameAssets(params = {}) {
  const config = params.config ?? params.preloadConfig ?? {};
  const playerCount = Math.max(
    1,
    config.aantalSpelersOpDitApparaat ?? config.spelers?.length ?? 1
  );
  const fallbackSkinIds = Array.from({ length: playerCount }, (_, index) => (
    index === 0 ? 'rood' : 'blauw'
  ));
  const playerSkinIds = (config.spelers ?? [])
    .map((player) => player?.skin)
    .filter(Boolean);
  const warmupSkinIds = playerSkinIds.length ? playerSkinIds : fallbackSkinIds;
  const playerSkins = warmupSkinIds
    .map((skin) => PLAYER_IMAGES[skin])
    .filter(Boolean);
  const normalizedMode = String(config.modus ?? config.gameMode ?? '').toLowerCase();
  const boardCellCount = 16;
  const seed = Number.isFinite(config.seed) ? config.seed : 0;
  const boardIconAssets = config.kaartOpzet === 'ander-thema'
    ? getPlayerThemes(config.thema, playerCount)
      .flatMap((themeId, index) => getRandomIcons(themeId, boardCellCount, seed + index))
    : config.kaartOpzet === 'zelfde'
      ? getRandomIcons(config.thema, boardCellCount, seed)
      : Array.from({ length: playerCount }, (_, index) =>
        getRandomIcons(config.thema, boardCellCount, seed + index)
      ).flat();
  const playerBoardAssets = uniqueAssets([
    ...(normalizedMode === 'claim' ? [BINGO_BOARD_ASSET_BY_SKIN.neutral] : []),
    ...warmupSkinIds
      .map((skin) => BINGO_BOARD_ASSET_BY_SKIN[skin])
      .filter(Boolean),
  ]);

  return uniqueAssets([
    ...GAME_BASE_ASSETS,
    ...playerSkins,
    ...playerBoardAssets,
    ...boardIconAssets,
  ]);
}

export function getRouteAssets(routeName, params = {}) {
  if (routeName === 'Spel') {
    return getGameAssets(params);
  }

  return ROUTE_PRELOADERS[routeName] ?? [];
}
