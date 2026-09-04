import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DESIGN_BASELINE_HEIGHT, DESIGN_BASELINE_WIDTH } from '../src/utils/responsive';

const SCREEN_W = DESIGN_BASELINE_WIDTH;
const SCREEN_H = DESIGN_BASELINE_HEIGHT;

const BIG_HOLE = {
  x: -SCREEN_W,
  y: -SCREEN_H,
  width: SCREEN_W * 3,
  height: SCREEN_H * 3,
  radius: 48,
};

export const CENTER_CIRCLE = {
  x: SCREEN_W / 2 - 12,
  y: SCREEN_H / 2 - 12,
  width: 24,
  height: 24,
  radius: 999,
};

export function getCircleFromRect(rect, size = 24) {
  const base = rect ?? CENTER_CIRCLE;
  const safeSize = Math.max(size, 12);
  const centerX = base.x + base.width / 2;
  const centerY = base.y + base.height / 2;

  return {
    x: centerX - safeSize / 2,
    y: centerY - safeSize / 2,
    width: safeSize,
    height: safeSize,
    radius: safeSize / 2,
  };
}

export function getCoverCircleFromRect(rect, viewportWidth = SCREEN_W, viewportHeight = SCREEN_H) {
  const base = rect ?? CENTER_CIRCLE;
  const centerX = base.x + base.width / 2;
  const centerY = base.y + base.height / 2;

  const distances = [
    Math.hypot(centerX, centerY),
    Math.hypot(viewportWidth - centerX, centerY),
    Math.hypot(centerX, viewportHeight - centerY),
    Math.hypot(viewportWidth - centerX, viewportHeight - centerY),
  ];

  const radius = Math.max(...distances);
  const diameter = radius * 2;

  return {
    x: centerX - radius,
    y: centerY - radius,
    width: diameter,
    height: diameter,
    radius,
  };
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function roundedRectPath(x, y, width, height, radius) {
  const safeWidth = Math.max(width, 0.001);
  const safeHeight = Math.max(height, 0.001);
  const safeRadius = Math.max(0, Math.min(radius, safeWidth / 2, safeHeight / 2));
  const right = x + safeWidth;
  const bottom = y + safeHeight;

  return [
    `M ${x + safeRadius} ${y}`,
    `L ${right - safeRadius} ${y}`,
    `Q ${right} ${y} ${right} ${y + safeRadius}`,
    `L ${right} ${bottom - safeRadius}`,
    `Q ${right} ${bottom} ${right - safeRadius} ${bottom}`,
    `L ${x + safeRadius} ${bottom}`,
    `Q ${x} ${bottom} ${x} ${bottom - safeRadius}`,
    `L ${x} ${y + safeRadius}`,
    `Q ${x} ${y} ${x + safeRadius} ${y}`,
    'Z',
  ].join(' ');
}

function buildMaskPath(holeRect, viewportWidth = SCREEN_W, viewportHeight = SCREEN_H) {
  const outer = `M 0 0 H ${viewportWidth} V ${viewportHeight} H 0 Z`;
  const inner = roundedRectPath(
    holeRect.x,
    holeRect.y,
    holeRect.width,
    holeRect.height,
    holeRect.radius
  );

  return `${outer} ${inner}`;
}

function normalizeRect(rect) {
  return {
    x: rect?.x ?? CENTER_CIRCLE.x,
    y: rect?.y ?? CENTER_CIRCLE.y,
    width: rect?.width ?? CENTER_CIRCLE.width,
    height: rect?.height ?? CENTER_CIRCLE.height,
    radius: rect?.radius ?? CENTER_CIRCLE.radius,
  };
}

export function getBigHoleRect() {
  return BIG_HOLE;
}

export async function measureNodeRect(targetRef, fallback = CENTER_CIRCLE) {
  const node = targetRef?.current;

  if (!node?.measureInWindow) {
    return fallback;
  }

  return new Promise((resolve) => {
    node.measureInWindow((x, y, width, height) => {
      if (!width || !height) {
        resolve(fallback);
        return;
      }

      resolve({
        x,
        y,
        width,
        height,
        radius: Math.min(height / 2, width / 2, 28),
      });
    });
  });
}

export default function ScreenTransitionLayer({ progress, color, fromRect, toRect }) {
  const { width, height } = useWindowDimensions();
  const [maskPath, setMaskPath] = useState(() => buildMaskPath(normalizeRect(fromRect), width, height));

  useEffect(() => {
    if (!fromRect || !toRect) {
      return undefined;
    }

    const start = normalizeRect(fromRect);
    const end = normalizeRect(toRect);

    const id = progress.addListener(({ value }) => {
      const nextRect = {
        x: lerp(start.x, end.x, value),
        y: lerp(start.y, end.y, value),
        width: lerp(start.width, end.width, value),
        height: lerp(start.height, end.height, value),
        radius: lerp(start.radius, end.radius, value),
      };

      setMaskPath(buildMaskPath(nextRect, width, height));
    });

    setMaskPath(buildMaskPath(start, width, height));

    return () => {
      progress.removeListener(id);
    };
  }, [fromRect, height, progress, toRect, width]);

  if (!fromRect || !toRect) {
    return <View pointerEvents="none" style={[styles.overlay, { backgroundColor: color }]} />;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg width={width} height={height}>
        <Path d={maskPath} fill={color} fillRule="evenodd" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
