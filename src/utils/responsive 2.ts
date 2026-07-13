type ResponsiveMetrics = {
  isTablet: boolean;
  tabletScale: number;
};

export function getResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);
  const isTablet = shortestSide >= 744 && longestSide >= 1000;
  const tabletScale = isTablet
    ? Math.min(1.24, Math.max(1.12, shortestSide / 680))
    : 1;

  return {
    isTablet,
    tabletScale,
  };
}

export function tabletScaleValue(width: number, height: number, value: number, maxScale = 1.24): number {
  const { isTablet, tabletScale } = getResponsiveMetrics(width, height);
  return isTablet ? value * Math.min(tabletScale, maxScale) : value;
}
