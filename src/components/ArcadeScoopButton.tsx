import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from '../settings/haptics';
import Svg, { Defs, Ellipse, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { getResponsiveMetrics } from '../utils/responsive';

type ArcadeScoopButtonVariant = 'sky' | 'gold' | 'coral';
type ArcadeScoopButtonSize = 'normal' | 'large';

interface ArcadeScoopButtonProps {
  label: string;
  onPress: () => void;
  variant?: ArcadeScoopButtonVariant;
  size?: ArcadeScoopButtonSize;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VARIANT_TOKENS = {
  sky: {
    shell: '#11417a',
    shellShadow: '#072247',
    stroke: '#8de2ff',
    gradient: ['#7ae7ff', '#35bcff', '#1789ea', '#0f5ec2'] as const,
    gloss: ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0)'] as const,
    innerShadow: 'rgba(8, 44, 91, 0.34)',
    text: '#f8feff',
    textOutline: '#0f4c9c',
  },
  gold: {
    shell: '#9d4d00',
    shellShadow: '#6a2e00',
    stroke: '#fff1a4',
    gradient: ['#fff178', '#ffd63b', '#f2ab14', '#d07c00'] as const,
    gloss: ['rgba(255,255,255,0.86)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)'] as const,
    innerShadow: 'rgba(110, 57, 0, 0.28)',
    text: '#fffdf7',
    textOutline: '#a35600',
  },
  coral: {
    shell: '#8e1433',
    shellShadow: '#5e0a21',
    stroke: '#ffb6cb',
    gradient: ['#ff92bb', '#ff5d95', '#df2f69', '#b21d4d'] as const,
    gloss: ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] as const,
    innerShadow: 'rgba(93, 6, 33, 0.3)',
    text: '#fff9fc',
    textOutline: '#9d1c47',
  },
} satisfies Record<
  ArcadeScoopButtonVariant,
  {
    shell: string;
    shellShadow: string;
    stroke: string;
    gradient: readonly [string, string, string, string];
    gloss: readonly [string, string, string];
    innerShadow: string;
    text: string;
    textOutline: string;
  }
>;

const SIZE_TOKENS = {
  normal: {
    height: 82,
    minWidth: 220,
    fontSize: 24,
    depth: 7,
    textTopOffset: -2,
  },
  large: {
    height: 100,
    minWidth: 260,
    fontSize: 32,
    depth: 8,
    textTopOffset: -4,
  },
} satisfies Record<
  ArcadeScoopButtonSize,
  {
    height: number;
    minWidth: number;
    fontSize: number;
    depth: number;
    textTopOffset: number;
  }
>;

function buildScoopPath(width: number, height: number, inset = 0) {
  const left = inset;
  const top = inset;
  const right = Math.max(left + 1, width - inset);
  const bottom = Math.max(top + 1, height - inset);
  const buttonWidth = right - left;
  const buttonHeight = bottom - top;
  const corner = Math.min(24, buttonWidth * 0.12, buttonHeight * 0.34);
  const scoopWidth = Math.min(buttonWidth * 0.38, 124);
  const scoopDepth = Math.min(buttonHeight * 0.2, 18);
  const scoopLeft = left + (buttonWidth - scoopWidth) / 2;
  const scoopRight = scoopLeft + scoopWidth;
  const midX = left + buttonWidth / 2;

  return [
    `M ${left + corner} ${top}`,
    `L ${right - corner} ${top}`,
    `Q ${right} ${top} ${right} ${top + corner}`,
    `L ${right} ${bottom - corner}`,
    `Q ${right} ${bottom} ${right - corner} ${bottom}`,
    `L ${scoopRight} ${bottom}`,
    `Q ${midX} ${bottom - scoopDepth} ${scoopLeft} ${bottom}`,
    `L ${left + corner} ${bottom}`,
    `Q ${left} ${bottom} ${left} ${bottom - corner}`,
    `L ${left} ${top + corner}`,
    `Q ${left} ${top} ${left + corner} ${top}`,
    'Z',
  ].join(' ');
}

export default function ArcadeScoopButton({
  label,
  onPress,
  variant = 'sky',
  size = 'normal',
  disabled = false,
}: ArcadeScoopButtonProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const pressAnim = useRef(new Animated.Value(0)).current;
  const tokens = VARIANT_TOKENS[variant];
  const sizeTokens = SIZE_TOKENS[size];
  const metrics = getResponsiveMetrics(screenWidth, screenHeight);
  const minWidth = metrics.s(sizeTokens.minWidth, Math.round(sizeTokens.minWidth * 0.9), Math.round(sizeTokens.minWidth * 1.18));
  const height = metrics.s(sizeTokens.height, Math.round(sizeTokens.height * 0.9), Math.round(sizeTokens.height * 1.18));
  const depth = metrics.s(sizeTokens.depth, Math.round(sizeTokens.depth * 0.9), Math.round(sizeTokens.depth * 1.18));
  const fontSize = metrics.font(sizeTokens.fontSize, Math.round(sizeTokens.fontSize * 0.9), Math.round(sizeTokens.fontSize * 1.12));
  const textTopOffset = metrics.s(sizeTokens.textTopOffset);
  const width = Math.max(layoutWidth, minWidth);

  const outerPath = useMemo(() => buildScoopPath(width, height, 0), [height, width]);
  const innerPath = useMemo(() => buildScoopPath(width, height - depth, 3), [depth, height, width]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth && nextWidth !== layoutWidth) {
      setLayoutWidth(nextWidth);
    }
  };

  const handlePressIn = (_event: GestureResponderEvent) => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 42,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (_event: GestureResponderEvent) => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 28,
      bounciness: 5,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animatedStyle = {
    transform: [
      {
        translateY: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 5],
        }),
      },
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.985],
        }),
      },
    ],
    opacity: disabled
      ? 0.45
      : pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.96],
        }),
  } as const;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <AnimatedPressable
        disabled={disabled}
        onLayout={handleLayout}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.pressable, { minHeight: height, minWidth }]}
      >
        <View style={[styles.glow, { shadowColor: tokens.stroke }]} />
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id={`shell-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.shell} />
              <Stop offset="1" stopColor={tokens.shellShadow} />
            </SvgLinearGradient>
            <SvgLinearGradient id={`body-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.gradient[0]} />
              <Stop offset="0.34" stopColor={tokens.gradient[1]} />
              <Stop offset="0.72" stopColor={tokens.gradient[2]} />
              <Stop offset="1" stopColor={tokens.gradient[3]} />
            </SvgLinearGradient>
            <SvgLinearGradient id={`gloss-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.gloss[0]} />
              <Stop offset="0.45" stopColor={tokens.gloss[1]} />
              <Stop offset="1" stopColor={tokens.gloss[2]} />
            </SvgLinearGradient>
            <SvgLinearGradient id={`gloss-line-${variant}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.58} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgLinearGradient>
            <SvgLinearGradient id={`inner-shadow-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(255,255,255,0)" />
              <Stop offset="0.68" stopColor="rgba(255,255,255,0)" />
              <Stop offset="1" stopColor={tokens.innerShadow} />
            </SvgLinearGradient>
          </Defs>

          <Path d={outerPath} fill={`url(#shell-${variant})`} />
          <Path d={innerPath} fill={`url(#body-${variant})`} />
          <Path d={innerPath} fill="none" stroke={tokens.stroke} strokeOpacity={0.58} strokeWidth={1.6} />
          <Path
            d={`M 18 8 H ${Math.max(18, width - 18)} V ${Math.round(height * 0.46)} H 18 Z`}
            fill={`url(#gloss-${variant})`}
            opacity={0.92}
          />
          <Ellipse
            cx={width / 2}
            cy={height * 0.22}
            rx={Math.max(36, width * 0.34)}
            ry={Math.max(12, height * 0.12)}
            fill={`url(#gloss-line-${variant})`}
          />
          <Path d={innerPath} fill={`url(#inner-shadow-${variant})`} />
        </Svg>

        <View pointerEvents="none" style={styles.labelWrap}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[
              styles.label,
              {
                top: textTopOffset,
                fontSize,
                color: tokens.text,
                textShadowColor: tokens.textOutline,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  pressable: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    position: 'relative',
    fontFamily: 'FredokaOne_400Regular',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
});
