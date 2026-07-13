import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { getResponsiveMetrics } from '../utils/responsive';

const NO_WIFI_IMAGE = require('../../assets/images/game-mode-cards/kaartcode-no-wifi.png');

export default function ConnectionWarningOverlay({ visible, width = 390, height = 844 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const { isTablet } = getResponsiveMetrics(width, height);

  useEffect(() => {
    if (!visible) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 760,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse, visible]);

  if (!visible) {
    return null;
  }

  const imageSize = isTablet ? 112 : 82;

  return (
    <View pointerEvents="none" style={[styles.wrap, isTablet && styles.wrapTablet]}>
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.78, 1],
            }),
          },
        ]}
      >
        <Image
          source={NO_WIFI_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={{ width: imageSize, height: imageSize }}
        />
        <Text style={[styles.text, isTablet && styles.textTablet]}>
          Verbinding herstellen...
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 82,
    left: 0,
    right: 0,
    zIndex: 80,
    elevation: 80,
    alignItems: 'center',
  },
  wrapTablet: {
    top: 104,
  },
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(9, 28, 40, 0.62)',
  },
  text: {
    marginTop: 2,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  textTablet: {
    fontSize: 21,
    lineHeight: 27,
  },
});
