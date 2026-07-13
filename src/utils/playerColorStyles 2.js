import { PLAYER_HEX } from '../../assets/images/players/playerImages';

function hexToRgb(hexColor = '#000000') {
  const normalized = hexColor.replace('#', '');
  const fullHex = normalized.length === 3
    ? normalized.split('').map((value) => value + value).join('')
    : normalized;

  const parsed = Number.parseInt(fullHex, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function toRgba(hexColor, alpha) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getPlayerSurfaceColors(skin = 'rood') {
  const baseHex = PLAYER_HEX[skin] ?? PLAYER_HEX.rood;
  const isLightColor = skin === 'wit' || skin === 'geel';

  return {
    tint: toRgba(baseHex, isLightColor ? 0.26 : 0.18),
    strongTint: toRgba(baseHex, isLightColor ? 0.34 : 0.24),
    border: toRgba(baseHex, isLightColor ? 0.5 : 0.42),
    text: '#111111',
    placeholderText: 'rgba(17, 17, 17, 0.45)',
  };
}
