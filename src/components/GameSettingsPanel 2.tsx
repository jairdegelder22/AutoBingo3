import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GameSettingsPanelProps = {
  title?: string;
  expandedHeight?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HEADER_HEIGHT = 74;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function GameSettingsPanel({
  title = 'Spelregels',
  expandedHeight = 300,
  children,
  style,
}: GameSettingsPanelProps) {
  const { width, height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const scale = clamp(Math.min(width / 430, height / 932), 0.9, 1.18);
  const headerHeight = Math.round(HEADER_HEIGHT * scale);
  const resolvedExpandedHeight = Math.round(
    expandedHeight === 300
      ? clamp(height * 0.32, 270, 420)
      : expandedHeight * scale
  );

  const containerHeight = useMemo(
    () => headerHeight + resolvedExpandedHeight,
    [headerHeight, resolvedExpandedHeight]
  );

  const togglePanel = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    Animated.timing(progress, {
      toValue: nextExpanded ? 1 : 0,
      duration: nextExpanded ? 280 : 220,
      easing: nextExpanded
        ? Easing.out(Easing.cubic)
        : Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [resolvedExpandedHeight, 0],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlayRoot, { height: containerHeight }, style]}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            height: containerHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[
            styles.contentArea,
            {
              height: resolvedExpandedHeight,
              paddingHorizontal: Math.round(20 * scale),
              paddingTop: Math.round(18 * scale),
              paddingBottom: Math.round(12 * scale),
            },
          ]}
        >
          {children ?? (
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderTitle}>Instellingen</Text>
              <Text style={styles.placeholderText}>Winconditie: 1 rij</Text>
              <Text style={styles.placeholderText}>Diagonaal: aan</Text>
              <Text style={styles.placeholderText}>Kaartopzet: zelfde kaart</Text>
            </View>
          )}
        </View>

        <Pressable onPress={togglePanel} style={styles.headerPressable}>
          <LinearGradient
            colors={['#ffffff', '#f5f9fc']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.header,
              {
                minHeight: headerHeight,
                paddingHorizontal: Math.round(18 * scale),
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                {
                  top: Math.round(10 * scale),
                  width: Math.round(56 * scale),
                  height: Math.round(6 * scale),
                },
              ]}
            />
            <Text style={[styles.headerTitle, { fontSize: Math.round(18 * scale) }]}>{title}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 40,
    overflow: 'visible',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 41,
    overflow: 'visible',
  },
  contentArea: {
    backgroundColor: '#fbfdff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: -10,
  },
  placeholderContent: {
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#174963',
  },
  placeholderText: {
    fontSize: 16,
    color: '#355366',
  },
  headerPressable: {
    zIndex: 2,
  },
  header: {
    minHeight: HEADER_HEIGHT,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d4dde5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 9,
  },
  handle: {
    position: 'absolute',
    top: 10,
    width: 56,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#c9d6df',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b3242',
    letterSpacing: 0.2,
  },
});
