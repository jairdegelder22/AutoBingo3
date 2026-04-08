import { StyleSheet, Text, View } from 'react-native';
import { formatLobbyCodeForDisplay } from '../src/utils/lobbyCode';

const STAR_COUNT = 12;
const STAR_RADIUS = 18;
const STAR_CENTER = 18;

function EuropeStars() {
  return (
    <View style={styles.starField}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const angle = (Math.PI * 2 * index) / STAR_COUNT - Math.PI / 2;
        const left = STAR_CENTER + STAR_RADIUS * Math.cos(angle) - 4;
        const top = STAR_CENTER + STAR_RADIUS * Math.sin(angle) - 4;

        return (
          <Text
            key={`star-${index}`}
            style={[styles.star, { left, top }]}
          >
            ★
          </Text>
        );
      })}
    </View>
  );
}

export default function LobbyCodePlate({ code, subtitle }) {
  const displayCode = (formatLobbyCodeForDisplay(code) || 'BG·47·KW').replaceAll('·', '-');

  return (
    <View style={styles.wrap}>
      <View style={styles.plate}>
        <View style={styles.countryBlock}>
          <EuropeStars />
          <Text style={styles.countryText}>NL</Text>
        </View>
        <View style={styles.codeWrap}>
          <Text style={styles.codeText}>{displayCode}</Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    alignItems: 'center',
  },
  plate: {
    width: '100%',
    minHeight: 92,
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 14,
    backgroundColor: '#F7C81D',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  countryBlock: {
    width: 74,
    backgroundColor: '#1C57B7',
    borderRightWidth: 3,
    borderRightColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  starField: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  star: {
    position: 'absolute',
    fontSize: 8,
    color: '#F7C81D',
    fontWeight: '700',
  },
  countryText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  codeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  codeText: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#111111',
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});
