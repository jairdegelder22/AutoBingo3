import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { normalizeLobbyCode } from '../src/utils/lobbyCode';
import { getResponsiveMetrics } from '../src/utils/responsive';

const LOBBY_LICENSE_PLATE_IMAGE = require('../assets/images/license-plates/dutch-join-plate-cropped.png');
const PLATE_IMAGE_RATIO = 1870 / 520;

function buildCodeSlots(code) {
  const chars = normalizeLobbyCode(code).split('');

  return [
    { key: 'char-0', type: 'char', value: chars[0] ?? '' },
    { key: 'char-1', type: 'char', value: chars[1] ?? '' },
    { key: 'dash-0', type: 'dash', value: '-' },
    { key: 'char-2', type: 'char', value: chars[2] ?? '' },
    { key: 'char-3', type: 'char', value: chars[3] ?? '' },
    { key: 'dash-1', type: 'dash', value: '-' },
    { key: 'char-4', type: 'char', value: chars[4] ?? '' },
    { key: 'char-5', type: 'char', value: chars[5] ?? '' },
    { key: 'char-6', type: 'char', value: chars[6] ?? '' },
  ];
}

export default function LobbyCodePlate({ code, title = 'Lobbycode' }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(windowWidth, windowHeight);
  const plateWidth = isTablet
    ? Math.min(windowWidth - 64, 760)
    : Math.min(windowWidth - 12, 470);
  const plateHeight = plateWidth / PLATE_IMAGE_RATIO;
  const fontSize = Math.min(isTablet ? 72 : 46, Math.max(isTablet ? 48 : 32, plateWidth * 0.098));
  const slots = buildCodeSlots(code || 'BG47KW0');

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={[styles.titleArrow, isTablet && styles.titleArrowTablet]}>▼</Text>
        <Text style={[styles.title, isTablet && styles.titleTablet]}>{title}</Text>
        <Text style={[styles.titleArrow, isTablet && styles.titleArrowTablet]}>▼</Text>
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.plate,
          {
            width: plateWidth,
            height: plateHeight,
          },
        ]}
      >
        <Image
          source={LOBBY_LICENSE_PLATE_IMAGE}
          resizeMode="contain"
          style={styles.plateImage}
        />
        <View
          style={[
            styles.codeRow,
            {
              height: fontSize * 1.34,
            },
          ]}
        >
          {slots.map((slot) => (
            <View
              key={slot.key}
              style={[
                styles.codeSlot,
                slot.type === 'dash' ? styles.dashSlot : styles.charSlot,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.codeText,
                  slot.type === 'dash' && styles.dashText,
                  {
                    fontSize,
                    lineHeight: fontSize * 1.24,
                  },
                ]}
              >
                {slot.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: -2,
  },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(18, 53, 77, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  titleTablet: {
    fontSize: 34,
    lineHeight: 42,
  },
  titleArrow: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(18, 53, 77, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  titleArrowTablet: {
    fontSize: 28,
    lineHeight: 34,
  },
  plate: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  plateImage: {
    width: '100%',
    height: '100%',
  },
  codeRow: {
    position: 'absolute',
    left: '18.2%',
    right: '8.2%',
    top: '25.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  codeSlot: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charSlot: {
    flex: 1,
  },
  dashSlot: {
    flex: 0.36,
  },
  codeText: {
    width: '100%',
    fontFamily: 'KentekenSmits1951',
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(17,17,17,0.42)',
    textShadowOffset: { width: 0.6, height: 0 },
    textShadowRadius: 0.2,
  },
  dashText: {
    opacity: 0.78,
  },
});
