import { Asset } from 'expo-asset';
import { PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getThemeIcons } from '../screens/themeIcons';

const HOME_ASSETS = [
  require('../assets/homepage.png'),
  require('../assets/logo.png'),
];

const PLAYER_ASSETS = Object.values(PLAYER_IMAGES);

function uniqueAssets(assets) {
  return [...new Set(assets.filter(Boolean))];
}

export async function preloadAssets(assets = []) {
  const modules = uniqueAssets(assets);

  if (!modules.length) return;

  await Asset.loadAsync(modules);
}

export async function preloadHomeAssets() {
  await preloadAssets(HOME_ASSETS);
}

export async function preloadPlayerSelectAssets() {
  await preloadAssets(PLAYER_ASSETS);
}

export async function preloadColorSelectAssets() {
  await preloadAssets(PLAYER_ASSETS);
}

export async function preloadThemeSelectAssets() {
  await preloadAssets([]);
}

export async function preloadBingoAssets(theme, playerColors = []) {
  const themeIcons = getThemeIcons(theme);
  const playerAssets = playerColors
    .map((kleur) => PLAYER_IMAGES[kleur])
    .filter(Boolean);

  await preloadAssets([...themeIcons, ...playerAssets]);
}
