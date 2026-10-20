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
  require('../../assets/images/ui/driver-warning-menu.png'),
  require('../../assets/images/ui/driver-warning-icon.png'),
  require('../../assets/images/backgrounds/skin-road-background.png'),
  require('../../assets/images/backgrounds/theme-road-scroll-background-v4.png'),
  require('../../assets/images/players/challenge-skin-lock.png'),
  require('../../assets/images/players/challenge-skin-lock-swing-open.png'),
  require('../../assets/images/players/challenge-unlock-star-blue.png'),
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
  require('../../assets/images/nav-icons/nav-palette.png'),
  require('../../assets/images/nav-icons/nav-home.png'),
  require('../../assets/images/nav-icons/nav-cards.png'),
  THEME_LOCK_OVERLAY_OVERVIEW_IMAGE,
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
  require('../../assets/images/premium/premium-skin-plus-badge.png'),
  require('../../assets/images/players/player-premium-racer.png'),
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
  require('../../assets/images/tutorial/tutorial-hand.png'),
  require('../../assets/images/tutorial/tutorial-speech-bubble.png'),
  require('../../assets/images/players/player-rood.png'),
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
  require('../../assets/images/settings/rules-slider-frame-dutch-items.png'),
  require('../../assets/images/settings/rules-slider-frame-card-layout.png'),
  require('../../assets/images/settings/win-condition-title.png'),
  require('../../assets/images/settings/diagonal-rule-title.png'),
  require('../../assets/images/settings/win-1-line.png'),
  require('../../assets/images/settings/win-2-lines.png'),
  require('../../assets/images/settings/win-full-card.png'),
  require('../../assets/images/settings/diagonal-on.png'),
  require('../../assets/images/settings/diagonal-off.png'),
  require('../../assets/images/settings/dutch-items-title.png'),
  require('../../assets/images/settings/dutch-items-on.png'),
  require('../../assets/images/settings/dutch-items-off.png'),
  require('../../assets/images/settings/card-layout-title.png'),
  require('../../assets/images/settings/card-layout-same.png'),
  require('../../assets/images/settings/card-layout-different.png'),
  require('../../assets/images/ui/info-button.png'),
];

export const SETUP_ASSETS = [
  ...COMMON_NAV_ASSETS,
  require('../../assets/images/backgrounds/game-setup-birds-eye-background-v4.png'),
  PLAYER_ADD_SILHOUETTE_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  require('../../assets/images/players/challenge-skin-lock.png'),
  require('../../assets/images/players/challenge-skin-lock-swing-open.png'),
  require('../../assets/images/players/challenge-unlock-star-blue.png'),
  ...Object.values(PLAYER_IMAGES),
  ...Object.values(THEME_CARD_IMAGES),
  THEME_LOCK_OVERLAY_IMAGE,
  ...SETUP_RULE_ASSETS,
  ...PREMIUM_MODAL_ASSETS,
];

export const GAME_MODE_ASSETS = [
  require('../../assets/images/game-mode-cards/wifi-required.png'),
  require('../../assets/images/game-mode-cards/wifi-not-required.png'),
  require('../../assets/images/game-mode-cards/wifi-not-required.png'),
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
  require('../../assets/images/players/challenge-skin-lock-swing-open.png'),
  require('../../assets/images/players/challenge-unlock-star-blue.png'),
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
  premium_racer: require('../../assets/images/bingo-boards/board-premium-racer.png'),
  eend: require('../../assets/images/bingo-boards/board-eend.png'),
  sport_coupe: require('../../assets/images/bingo-boards/board-sport-coupe.png'),
  neon_nacht: require('../../assets/images/bingo-boards/board-neon-nacht.png'),
  maanrijder: require('../../assets/images/bingo-boards/board-maanrijder.png'),
  hot_rod: require('../../assets/images/bingo-boards/board-hot-rod.png'),
  monstertruck: require('../../assets/images/bingo-boards/board-monstertruck.png'),
  carbon_supercar: require('../../assets/images/bingo-boards/board-carbon-supercar.png'),
  ijsco_wagen: require('../../assets/images/bingo-boards/board-ijsco-wagen.png'),
  piraten_wagen: require('../../assets/images/bingo-boards/board-piraten-wagen.png'),
  safari_jeep: require('../../assets/images/bingo-boards/board-safari-jeep.png'),
  koninklijke_racer: require('../../assets/images/bingo-boards/board-koninklijke-racer.png'),
  klassieke_brandweer: require('../../assets/images/bingo-boards/board-klassieke-brandweer.png'),
  supercar_racer: require('../../assets/images/bingo-boards/board-supercar-racer.png'),
  locomotief: require('../../assets/images/bingo-boards/board-locomotief.png'),
  strand_buggy: require('../../assets/images/bingo-boards/board-strand-buggy.png'),
  sneeuwschuiver: require('../../assets/images/bingo-boards/board-sneeuwschuiver.png'),
  ridder: require('../../assets/images/bingo-boards/board-ridder.png'),
};

export const BINGO_BOARD_ASSETS = Object.values(BINGO_BOARD_ASSET_BY_SKIN);

export const BINGO_SPLASH_ASSET_BY_SKIN = {
  blauw: require('../../assets/logo (bingo-blauw).png'),
  geel: require('../../assets/logo (bingo-geel).png'),
  groen: require('../../assets/logo (bingo-groen).png'),
  lichtblauw: require('../../assets/logo (bingo-lichtblauw).png'),
  oranje: require('../../assets/logo (bingo-oranje).png'),
  paars: require('../../assets/logo (bingo-paars).png'),
  rood: require('../../assets/logo (bingo-rood).png'),
  roze: require('../../assets/logo (bingo-roze).png'),
  wit: require('../../assets/logo (bingo-wit).png'),
  zwart: require('../../assets/logo (bingo-zwart).png'),
  regenboog: require('../../assets/logo (bingo-regenboog).png'),
  koe: require('../../assets/logo (bingo-koe).png'),
  kerst: require('../../assets/logo (bingo-kerst).png'),
  politie: require('../../assets/logo (bingo-politie).png'),
  ambulance: require('../../assets/logo (bingo-ambulance).png'),
  brandweer: require('../../assets/logo (bingo-brandweer).png'),
  brons: require('../../assets/logo (bingo-brons).png'),
  zilver: require('../../assets/logo (bingo-zilver).png'),
  goud: require('../../assets/logo (bingo-goud).png'),
  kat: require('../../assets/logo (bingo-kat).png'),
  hond: require('../../assets/logo (bingo-hond).png'),
  hartjes: require('../../assets/logo (bingo-hartjes).png'),
  taxi: require('../../assets/logo (bingo-taxi).png'),
  vlammen: require('../../assets/logo (bingo-vlammen).png'),
  premium_racer: require('../../assets/logo (bingo-premium-racer).png'),
  eend: require('../../assets/logo (bingo-eend).png'),
  sport_coupe: require('../../assets/logo (bingo-sport-coupe).png'),
  neon_nacht: require('../../assets/logo (bingo-neon-nacht).png'),
  maanrijder: require('../../assets/logo (bingo-maanrijder).png'),
  hot_rod: require('../../assets/logo (bingo-hot-rod).png'),
  monstertruck: require('../../assets/logo (bingo-monstertruck).png'),
  carbon_supercar: require('../../assets/logo (bingo-carbon-supercar).png'),
  ijsco_wagen: require('../../assets/logo (bingo-ijsco-wagen).png'),
  piraten_wagen: require('../../assets/logo (bingo-piraten-wagen).png'),
  safari_jeep: require('../../assets/logo (bingo-safari-jeep).png'),
  koninklijke_racer: require('../../assets/logo (bingo-koninklijke-racer).png'),
  klassieke_brandweer: require('../../assets/logo (bingo-klassieke-brandweer).png'),
  supercar_racer: require('../../assets/logo (bingo-supercar-racer).png'),
  locomotief: require('../../assets/logo (bingo-locomotief).png'),
  strand_buggy: require('../../assets/logo (bingo-strand-buggy).png'),
  sneeuwschuiver: require('../../assets/logo (bingo-sneeuwschuiver).png'),
  ridder: require('../../assets/logo (bingo-ridder).png'),
};

export const BINGO_SPLASH_ASSETS = Object.values(BINGO_SPLASH_ASSET_BY_SKIN);

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
  require('../../assets/images/claim-results/podium-premium-racer.png'),
  require('../../assets/images/claim-results/podium-eend.png'),
  require('../../assets/images/claim-results/podium-sport-coupe.png'),
  require('../../assets/images/claim-results/podium-neon-nacht.png'),
  require('../../assets/images/claim-results/podium-maanrijder.png'),
  require('../../assets/images/claim-results/podium-hot-rod.png'),
  require('../../assets/images/claim-results/podium-monstertruck.png'),
  require('../../assets/images/claim-results/podium-carbon-supercar.png'),
  require('../../assets/images/claim-results/podium-ijsco-wagen.png'),
  require('../../assets/images/claim-results/podium-piraten-wagen.png'),
  require('../../assets/images/claim-results/podium-safari-jeep.png'),
  require('../../assets/images/claim-results/podium-koninklijke-racer.png'),
  require('../../assets/images/claim-results/podium-klassieke-brandweer.png'),
  require('../../assets/images/claim-results/podium-supercar-racer.png'),
  require('../../assets/images/claim-results/podium-locomotief.png'),
  require('../../assets/images/claim-results/podium-strand-buggy.png'),
  require('../../assets/images/claim-results/podium-sneeuwschuiver.png'),
  require('../../assets/images/claim-results/podium-ridder.png'),
];

export const GAME_BASE_ASSETS = [
  require('../../assets/images/backgrounds/bingo-original-background.png'),
  ...COMMON_NAV_ASSETS,
];

export const BOOT_ASSETS = [
  ...HOME_CRITICAL_ASSETS,
  require('../../assets/images/ui/driver-warning-menu.png'),
  require('../../assets/images/ui/driver-warning-icon.png'),
  ...POPUP_PANEL_ASSETS,
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
  const seenAssetKeys = new Set();
  const unique = [];

  assets.filter(Boolean).forEach((asset) => {
    const key = getAssetKey(asset);
    if (seenAssetKeys.has(key)) {
      return;
    }

    seenAssetKeys.add(key);
    unique.push(asset);
  });

  return unique;
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
  const itemOptions = {
    nederlands: config.nederlands !== false,
  };
  const boardIconAssets = config.kaartOpzet === 'ander-thema'
    ? getPlayerThemes(config.thema, playerCount)
      .flatMap((themeId, index) => getRandomIcons(themeId, boardCellCount, seed + index, itemOptions))
    : config.kaartOpzet === 'zelfde'
      ? getRandomIcons(config.thema, boardCellCount, seed, itemOptions)
      : Array.from({ length: playerCount }, (_, index) =>
        getRandomIcons(config.thema, boardCellCount, seed + index, itemOptions)
      ).flat();
  const playerBoardAssets = uniqueAssets([
    ...(normalizedMode === 'claim' ? [BINGO_BOARD_ASSET_BY_SKIN.neutral] : []),
    ...warmupSkinIds
      .map((skin) => BINGO_BOARD_ASSET_BY_SKIN[skin])
      .filter(Boolean),
  ]);
  const playerBingoSplashAssets = uniqueAssets(
    warmupSkinIds
      .map((skin) => BINGO_SPLASH_ASSET_BY_SKIN[skin])
      .filter(Boolean)
  );

  return uniqueAssets([
    ...GAME_BASE_ASSETS,
    ...playerSkins,
    ...playerBoardAssets,
    ...playerBingoSplashAssets,
    ...boardIconAssets,
  ]);
}

export function getRouteAssets(routeName, params = {}) {
  if (routeName === 'Spel') {
    return getGameAssets(params);
  }

  return ROUTE_PRELOADERS[routeName] ?? [];
}
