export const DESIGN_BASELINE_WIDTH = 430;
export const DESIGN_BASELINE_HEIGHT = 932;

export type ScreenClass = 'compactPhone' | 'phone' | 'largePhone' | 'tablet';

type ResponsiveMetrics = {
  isTablet: boolean;
  tabletScale: number;
  screenClass: ScreenClass;
  shortestSide: number;
  longestSide: number;
  scaleX: number;
  scaleY: number;
  scale: number;
  fontScale: number;
  spacingScale: number;
  contentMaxWidth: number;
  horizontalGutter: number;
  s: (value: number, min?: number, max?: number) => number;
  sx: (value: number, min?: number, max?: number) => number;
  sy: (value: number, min?: number, max?: number) => number;
  font: (value: number, min?: number, max?: number) => number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundScaled(value: number, scale: number, min?: number, max?: number): number {
  const scaledValue = value * scale;
  const clampedValue = typeof min === 'number' && typeof max === 'number'
    ? clamp(scaledValue, min, max)
    : typeof min === 'number'
      ? Math.max(min, scaledValue)
      : typeof max === 'number'
        ? Math.min(max, scaledValue)
        : scaledValue;

  return Math.round(clampedValue);
}

export function getResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);
  const isTablet = shortestSide >= 744 && longestSide >= 1000;
  const screenClass: ScreenClass = isTablet
    ? 'tablet'
    : shortestSide < 390 || longestSide < 812
      ? 'compactPhone'
      : shortestSide >= 430 && longestSide >= 920
        ? 'largePhone'
        : 'phone';
  const scaleX = width / DESIGN_BASELINE_WIDTH;
  const scaleY = height / DESIGN_BASELINE_HEIGHT;
  const phoneMaxScale = screenClass === 'compactPhone' ? 1 : 1.18;
  const scale = clamp(Math.min(scaleX, scaleY), 0.84, isTablet ? 1.34 : phoneMaxScale);
  const fontScale = clamp(scale, 0.9, isTablet ? 1.24 : 1.12);
  const spacingScale = clamp(scale, 0.86, isTablet ? 1.22 : 1.14);
  const tabletScale = isTablet
    ? Math.min(1.24, Math.max(1.12, shortestSide / 680))
    : 1;
  const contentMaxWidth = isTablet
    ? Math.round(clamp(shortestSide * 0.72, 560, 760))
    : Math.min(width, DESIGN_BASELINE_WIDTH);
  const horizontalGutter = Math.round(clamp(width * (isTablet ? 0.055 : 0.058), isTablet ? 36 : 18, isTablet ? 72 : 28));

  return {
    isTablet,
    tabletScale,
    screenClass,
    shortestSide,
    longestSide,
    scaleX,
    scaleY,
    scale,
    fontScale,
    spacingScale,
    contentMaxWidth,
    horizontalGutter,
    s: (value: number, min?: number, max?: number) => roundScaled(value, scale, min, max),
    sx: (value: number, min?: number, max?: number) => roundScaled(value, scaleX, min, max),
    sy: (value: number, min?: number, max?: number) => roundScaled(value, scaleY, min, max),
    font: (value: number, min?: number, max?: number) => roundScaled(value, fontScale, min, max),
  };
}

export function tabletScaleValue(width: number, height: number, value: number, maxScale = 1.24): number {
  const { isTablet, tabletScale } = getResponsiveMetrics(width, height);
  return isTablet ? value * Math.min(tabletScale, maxScale) : value;
}

export function getGameModePickerMetrics(width: number, height: number) {
  const metrics = getResponsiveMetrics(width, height);
  const { isTablet, scale } = metrics;

  return {
    scale,
    pickerPaddingHorizontal: Math.round(clamp(width * 0.047, 18, 52)),
    pickerPaddingTop: Math.round(clamp(height * 0.084, 64, 94)) + Math.round(8 * scale),
    pickerPaddingBottom: Math.round(clamp(height * 0.099, 78, 112)),
    pickerGap: Math.round(clamp(height * 0.017, 13, 20)),
    pickerPanelToChoiceGap: Math.round(10 * scale),
    pickerChoiceGap: Math.round(clamp(width * 0.033, 12, 20)),
    pickerIconWidth: Math.round(clamp(width * 0.274, 106, 142)),
    pickerIconHeight: Math.round(clamp(height * 0.137, 116, 152)),
    pickerStatusPanelWidth: Math.round(clamp(width * 0.70, 268, 326)),
    pickerStatusPanelHeight: Math.round(clamp(width * 0.70 / (1672 / 941), 150, 184)),
    pickerStatusPanelIconSize: Math.round(clamp(width * 0.235, 90, 112)),
    pickerChoiceHeight: Math.round(clamp(height * (isTablet ? 0.175 : 0.133), 114, isTablet ? 244 : 156)),
    pickerFeaturedChoiceHeight: Math.round(clamp(height * (isTablet ? 0.188 : 0.144), 124, isTablet ? 262 : 170)),
  };
}

export function getRulesPanelMetrics(width: number, height: number) {
  const metrics = getResponsiveMetrics(width, height);
  const { isTablet, scale } = metrics;
  const collapsedPanelHeight = Math.round(clamp(height * (isTablet ? 0.09 : 0.078), 66, isTablet ? 118 : 88));

  return {
    scale,
    collapsedPanelHeight,
    expandedPanelHeight: Math.round(clamp(height * (isTablet ? 0.79 : 0.74), isTablet ? 720 : 560, height * (isTablet ? 0.86 : 0.82))),
    contentBottom: Math.max(0, collapsedPanelHeight - (height >= 812 ? Math.round(clamp(height * 0.034, 24, 34)) : 0)),
    settingsTitleIconSize: Math.round(clamp(width * 0.118, 46, isTablet ? 88 : 66)),
    settingsSliderHeight: Math.round(clamp(height * (isTablet ? 0.18 : 0.156), 126, isTablet ? 210 : 156)),
    settingsSliderImageSize: Math.round(clamp(width * 0.155, 58, isTablet ? 108 : 78)),
    settingsSliderDiagonalImageSize: Math.round(clamp(width * 0.178, 68, isTablet ? 124 : 92)),
    settingsSectionGap: Math.round(clamp(height * (isTablet ? 0.046 : 0.038), 28, isTablet ? 64 : 42)),
  };
}

export function getAssetPanelWidth(width: number, height: number, aspectRatio: number, maxPhoneWidth = 430, maxTabletWidth = 760) {
  const { isTablet } = getResponsiveMetrics(width, height);
  const horizontalInset = isTablet ? 48 : 10;
  const heightScale = isTablet ? 0.88 : 0.94;
  return Math.round(Math.min(width - horizontalInset, height * aspectRatio * heightScale, isTablet ? maxTabletWidth : maxPhoneWidth));
}

export function getDriverWarningMetrics(width: number, height: number) {
  const metrics = getResponsiveMetrics(width, height);
  const menuWidth = getAssetPanelWidth(width, height, 1122 / 1402, 430, 560);

  return {
    ...metrics,
    menuWidth,
    menuTranslateY: metrics.sy(-58, -64, -40),
    iconSize: metrics.isTablet
      ? Math.round(clamp(width * 0.395, 326, 372))
      : Math.round(Math.min(224, width * 0.532)),
    buttonHeight: metrics.s(54, 50, metrics.isTablet ? 66 : 58),
    buttonPaddingHorizontal: metrics.s(22, 20, metrics.isTablet ? 34 : 26),
    buttonLabelScale: metrics.isTablet ? 0.82 : 0.72,
  };
}
