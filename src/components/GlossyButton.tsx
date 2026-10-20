import React, { useEffect, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from '../settings/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { getResponsiveMetrics } from '../utils/responsive';
import { useAppSettings } from '../settings/AppSettingsContext';
import { playSoundEffect, preloadSoundEffect } from '../audio/soundEffects';

type GlossyButtonVariant = 'blue' | 'yellow' | 'red' | 'green';
type GlossyButtonSize = 'normal' | 'large';
type ImpactFeedbackStyleValue = typeof Haptics.ImpactFeedbackStyle[keyof typeof Haptics.ImpactFeedbackStyle];
type NotificationFeedbackTypeValue = typeof Haptics.NotificationFeedbackType[keyof typeof Haptics.NotificationFeedbackType];

interface GlossyButtonProps {
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  variant: GlossyButtonVariant;
  icon?: string;
  size?: GlossyButtonSize;
  disabled?: boolean;
  labelOffsetY?: number;
  horizontalPadding?: number;
  heightOverride?: number;
  contentOffsetY?: number;
  labelFontScale?: number;
  labelNumberOfLines?: number;
  hapticStyle?: ImpactFeedbackStyleValue;
  hapticNotificationType?: NotificationFeedbackTypeValue;
  disableHaptics?: boolean;
  soundEffectName?: string | null;
  disableSound?: boolean;
}

const VARIANT_TOKENS = {
  blue: {
    gradient: ['#7dd4f8', '#4aadee', '#1a7bd4', '#0f5aaa'] as const,
    outline: '#1a3a6e',
    textColor: '#ffffff',
    textOutline: '#15539d',
  },
  yellow: {
    gradient: ['#ffe566', '#f5c400', '#d4970a', '#b87800'] as const,
    outline: '#7a4800',
    textColor: '#3d2000',
    textOutline: '#a95d00',
  },
  red: {
    gradient: ['#f57070', '#e03030', '#c01818', '#9e0f0f'] as const,
    outline: '#6b0e0e',
    textColor: '#ffffff',
    textOutline: '#8e1212',
  },
  green: {
    gradient: ['#b9ff6b', '#48d846', '#159b3b', '#08722d'] as const,
    outline: '#063f1d',
    textColor: '#ffffff',
    textOutline: '#087233',
  },
} satisfies Record<
  GlossyButtonVariant,
  {
    gradient: readonly [string, string, string, string];
    outline: string;
    textColor: string;
    textOutline: string;
  }
>;

const SIZE_TOKENS = {
  normal: {
    height: 60,
    borderRadius: 18,
    fontSize: 20,
    paddingHorizontal: 28,
  },
  large: {
    height: 76,
    borderRadius: 24,
    fontSize: 28,
    paddingHorizontal: 48,
  },
} satisfies Record<
  GlossyButtonSize,
  {
    height: number;
    borderRadius: number;
    fontSize: number;
    paddingHorizontal: number;
  }
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlossyButton({
  label,
  onPress,
  onPressIn,
  onPressOut,
  variant,
  icon,
  size = 'normal',
  disabled = false,
  labelOffsetY = 0,
  horizontalPadding,
  heightOverride,
  contentOffsetY = 0,
  labelFontScale = 1,
  labelNumberOfLines = 1,
  hapticStyle = Haptics.ImpactFeedbackStyle.Medium,
  hapticNotificationType,
  disableHaptics = false,
  soundEffectName = 'glossyButtonClick',
  disableSound = false,
}: GlossyButtonProps) {
  const { width, height } = useWindowDimensions();
  const { settings } = useAppSettings();
  const pressAnim = useRef(new Animated.Value(0)).current;
  const metrics = getResponsiveMetrics(width, height);
  const { isTablet } = metrics;

  const variantTokens = VARIANT_TOKENS[variant];
  const sizeTokens = SIZE_TOKENS[size];
  const minimumFontSize = Math.round(sizeTokens.fontSize * 0.9 * labelFontScale);
  const maximumFontSize = isTablet
    ? Math.round(sizeTokens.fontSize * 1.24 * labelFontScale)
    : Math.round(sizeTokens.fontSize * 1.12 * labelFontScale);
  const responsiveHeight = metrics.s(sizeTokens.height, Math.round(sizeTokens.height * 0.9), isTablet ? Math.round(sizeTokens.height * 1.28) : Math.round(sizeTokens.height * 1.18));
  const responsiveRadius = metrics.s(sizeTokens.borderRadius, Math.round(sizeTokens.borderRadius * 0.9), isTablet ? Math.round(sizeTokens.borderRadius * 1.28) : Math.round(sizeTokens.borderRadius * 1.18));
  const responsiveFontSize = metrics.font(sizeTokens.fontSize * labelFontScale, minimumFontSize, maximumFontSize);
  const responsivePadding = metrics.s(sizeTokens.paddingHorizontal, Math.round(sizeTokens.paddingHorizontal * 0.9), isTablet ? Math.round(sizeTokens.paddingHorizontal * 1.28) : Math.round(sizeTokens.paddingHorizontal * 1.18));
  const buttonHeight = heightOverride ?? responsiveHeight;
  const innerRadius = responsiveRadius - 2;

  useEffect(() => {
    if (!disableSound && soundEffectName) {
      preloadSoundEffect(soundEffectName);
    }
  }, [disableSound, soundEffectName]);

  const handlePressIn = (_event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }

    if (!disableSound && soundEffectName) {
      void playSoundEffect(soundEffectName, settings);
    }

    onPressIn?.(_event);

    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (_event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }

    onPressOut?.(_event);

    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: false,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }

    if (!disableHaptics) {
      if (hapticNotificationType) {
        void Haptics.notificationAsync(hapticNotificationType);
      } else {
        void Haptics.impactAsync(hapticStyle);
      }
    }
    onPress(event);
  };

  const transformStyle = {
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
          outputRange: [1, 0.97],
        }),
      },
    ],
  } as const;

  const brightnessStyle = {
    opacity: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.85],
    }),
  } as const;

  const outlineStyle = {
    backgroundColor: variantTokens.outline,
    borderRadius: responsiveRadius,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 1],
    }),
    shadowColor: variantTokens.outline,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  } as const;

  return (
    <Animated.View style={[styles.wrapper, disabled && styles.disabled, transformStyle]}>
      <Animated.View style={brightnessStyle}>
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.pressable}
        >
          <Animated.View style={outlineStyle}>
            <LinearGradient
              colors={variantTokens.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.gradientBody,
                {
                  borderRadius: innerRadius,
                  height: buttonHeight,
                  paddingHorizontal: horizontalPadding ?? responsivePadding,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                locations={[0, 0.62, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.glossBody,
                  {
                    borderTopLeftRadius: innerRadius,
                    borderTopRightRadius: innerRadius,
                    borderBottomLeftRadius: innerRadius * 1.5,
                    borderBottomRightRadius: innerRadius * 1.5,
                  }
                ]}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.glossPill,
                  {
                    top: 4,
                    left: 16,
                    right: 16,
                  }
                ]}
              />
              <View
                style={[
                  styles.content,
                  {
                    transform: [{ translateY: contentOffsetY }],
                  },
                ]}
              >
                {icon ? <Text style={[styles.icon, { fontSize: responsiveFontSize - 1 }]}>{icon}</Text> : null}
                <Text
                  numberOfLines={labelNumberOfLines}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.label,
                    {
                      color: variantTokens.textColor,
                      fontSize: responsiveFontSize,
                      textShadowColor: variantTokens.textOutline,
                      transform: [{ translateY: labelOffsetY }],
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  pressable: {
    alignSelf: 'stretch',
  },
  gradientBody: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glossBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  glossPill: {
    position: 'absolute',
    height: 10,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 2,
  },
  icon: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  label: {
    fontFamily: 'FredokaOne_400Regular',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
