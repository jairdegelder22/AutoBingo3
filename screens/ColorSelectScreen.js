import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import { PLAYER_IMAGES, ALLE_KLEUREN } from '../assets/images/players/playerImages';

const { width: W, height: H } = Dimensions.get('window');

const HEADER_H = 110;
const BUTTON_H = 110;
const BESCHIKBAAR = H - HEADER_H - BUTTON_H;

export default function ColorSelectScreen({ playerCount, onDone, onBack }) {
  // Elke speler begint op een andere kleurindex
  const [indices, setIndices] = useState(
    Array.from({ length: playerCount }, (_, i) => i % ALLE_KLEUREN.length)
  );

  function wijzigKleur(speler, richting) {
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

  function bevestig() {
    onDone(indices.map(i => ALLE_KLEUREN[i]));
  }

  const rijHoogte = BESCHIKBAAR / playerCount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitel}>Kleur kiezen</Text>
        <View style={styles.backButton} />
      </View>

      {/* Speler rijen */}
      <View style={styles.rijen}>
        {Array.from({ length: playerCount }, (_, i) => {
          const kleur = ALLE_KLEUREN[indices[i]];
          const imgGrootte = Math.min(rijHoogte * 0.75, 160);

          return (
            <View key={i} style={[styles.rij, { height: rijHoogte }]}>
              {/* Pijl links */}
              <TouchableOpacity
                style={styles.pijlKnop}
                onPress={() => wijzigKleur(i, -1)}
                activeOpacity={0.5}
              >
                <Text style={styles.pijl}>{'<'}</Text>
              </TouchableOpacity>

              {/* Logo afbeelding */}
              <Image
                source={PLAYER_IMAGES[kleur]}
                style={{ width: imgGrootte, height: imgGrootte }}
                resizeMode="contain"
              />

              {/* Pijl rechts */}
              <TouchableOpacity
                style={styles.pijlKnop}
                onPress={() => wijzigKleur(i, 1)}
                activeOpacity={0.5}
              >
                <Text style={styles.pijl}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Klaar knop */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.klaarKnop} onPress={bevestig} activeOpacity={0.82}>
          <Text style={styles.klaarTekst}>Klaar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: HEADER_H,
    backgroundColor: '#F5C400',
    paddingTop: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: { width: 36 },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },

  pijlKnop: {
    width: 48,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pijl: {
    fontSize: 36,
    fontWeight: '300',
    color: '#1A1A1A',
    lineHeight: 40,
  },

  footer: {
    height: BUTTON_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  klaarKnop: {
    backgroundColor: '#F5C400',
    paddingHorizontal: 64,
    paddingVertical: 18,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  klaarTekst: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
