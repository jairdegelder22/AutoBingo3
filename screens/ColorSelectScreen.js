import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions, Animated,
} from 'react-native';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import * as Haptics from 'expo-haptics';
import { PLAYER_IMAGES, ALLE_KLEUREN } from '../assets/images/players/playerImages';

const { width: W, height: H } = Dimensions.get('window');

const HEADER_H = 110;
const BUTTON_H = 110;
const BESCHIKBAAR = H - HEADER_H - BUTTON_H;

export default function ColorSelectScreen({ playerCount, onDone, onBack }) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const [indices, setIndices] = useState(
    Array.from({ length: playerCount }, (_, i) => i % ALLE_KLEUREN.length)
  );

  const klaarButtonRef = useRef(null);

  function wijzigKleur(speler, richting) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndices(prev => {
      const gekozenDoorAnderen = new Set(
        prev.filter((_, i) => i !== speler).map(idx => ALLE_KLEUREN[idx])
      );
      let volgende = prev[speler];
      let pogingen = 0;
      do {
        volgende = (volgende + richting + ALLE_KLEUREN.length) % ALLE_KLEUREN.length;
        pogingen++;
      } while (gekozenDoorAnderen.has(ALLE_KLEUREN[volgende]) && pogingen < ALLE_KLEUREN.length);
      const next = [...prev];
      next[speler] = volgende;
      return next;
    });
  }

  const fredoka = fontsLoaded ? 'FredokaOne_400Regular' : undefined;
  const rijHoogte = BESCHIKBAAR / playerCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitel, { fontFamily: fredoka }]}>Kleur kiezen</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.rijen}>
        {Array.from({ length: playerCount }, (_, i) => {
          const kleur = ALLE_KLEUREN[indices[i]];
          const imgGrootte = Math.min(rijHoogte * 0.75, 160);
          return (
            <View key={i} style={[styles.rij, { height: rijHoogte }]}>
              <TouchableOpacity
                style={styles.pijlKnop}
                onPress={() => wijzigKleur(i, -1)}
                activeOpacity={0.6}
              >
                <Text style={[styles.pijl, { fontFamily: fredoka }]}>‹</Text>
              </TouchableOpacity>

              <Image
                source={PLAYER_IMAGES[kleur]}
                style={{ width: imgGrootte, height: imgGrootte }}
                resizeMode="contain"
              />

              <TouchableOpacity
                style={styles.pijlKnop}
                onPress={() => wijzigKleur(i, 1)}
                activeOpacity={0.6}
              >
                <Text style={[styles.pijl, { fontFamily: fredoka }]}>›</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          ref={klaarButtonRef}
          collapsable={false}
          style={styles.klaarKnop}
          onPressIn={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDone(klaarButtonRef, indices.map(i => ALLE_KLEUREN[i]));
          }}
          activeOpacity={0.82}
        >
          <Text style={[styles.klaarTekst, { fontFamily: fredoka }]}>Klaar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4E8',
  },
  header: {
    height: HEADER_H,
    backgroundColor: '#1A5EA8',
    paddingTop: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerTitel: {
    fontSize: 24,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
  backButton: { width: 36 },
  backText: {
    fontSize: 24,
    color: '#FFFDF7',
    fontWeight: 'bold',
  },
  rijen: {
    flex: 1,
  },
  rij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8D5B0',
  },
  pijlKnop: {
    width: 52,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pijl: {
    fontSize: 48,
    color: '#2D2B55',
    lineHeight: 56,
  },
  footer: {
    height: BUTTON_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EDD8',
  },
  klaarKnop: {
    backgroundColor: '#D93B2B',
    paddingHorizontal: 64,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  klaarTekst: {
    fontSize: 24,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
});
