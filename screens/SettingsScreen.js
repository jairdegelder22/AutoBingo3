import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import { useFonts as useFredoka, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { useFonts as useNunito, Nunito_700Bold, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ onBack }) {
  const [fredokaLoaded] = useFredoka({ FredokaOne_400Regular });
  const [nunitoLoaded]  = useNunito({ Nunito_700Bold, Nunito_600SemiBold });
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['sound', 'vibration']).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v !== null ? v === 'true' : true]));
      setSound(map.sound);
      setVibration(map.vibration);
    });
  }, []);

  function toggleSound(val) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSound(val);
    AsyncStorage.setItem('sound', String(val));
  }

  function toggleVibration(val) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVibration(val);
    AsyncStorage.setItem('vibration', String(val));
  }

  const fredoka  = fredokaLoaded ? 'FredokaOne_400Regular' : undefined;
  const nunitoB  = nunitoLoaded  ? 'Nunito_700Bold'        : undefined;
  const nunitoSB = nunitoLoaded  ? 'Nunito_600SemiBold'    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: fredoka }]}>Instellingen</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { fontFamily: nunitoB }]}>Geluid aan</Text>
          <Switch
            value={sound}
            onValueChange={toggleSound}
            trackColor={{ false: '#E8D5B0', true: '#2E8B3F' }}
            thumbColor="#FFFDF7"
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { fontFamily: nunitoB }]}>Trillingen aan</Text>
          <Switch
            value={vibration}
            onValueChange={toggleVibration}
            trackColor={{ false: '#E8D5B0', true: '#2E8B3F' }}
            thumbColor="#FFFDF7"
          />
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.premiumSection}>
        <Text style={[styles.premiumLabel, { fontFamily: nunitoSB }]}>Premium</Text>
        <TouchableOpacity
          style={styles.premiumButton}
          activeOpacity={0.82}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Text style={[styles.premiumButtonText, { fontFamily: fredoka }]}>Koop Premium  👑</Text>
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
    backgroundColor: '#1A5EA8',
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerText: {
    fontSize: 22,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
  backButton: { width: 40 },
  backText: {
    fontSize: 24,
    color: '#FFFDF7',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  rowLabel: {
    fontSize: 18,
    color: '#2D2B55',
  },
  separator: {
    height: 1.5,
    backgroundColor: '#E8D5B0',
    marginHorizontal: 24,
  },
  premiumSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  premiumLabel: {
    fontSize: 14,
    color: '#2D2B55',
    marginBottom: 16,
    letterSpacing: 1,
    opacity: 0.55,
    textTransform: 'uppercase',
  },
  premiumButton: {
    backgroundColor: '#D93B2B',
    width: '80%',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#2D2B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  premiumButtonText: {
    fontSize: 20,
    color: '#FFFDF7',
    letterSpacing: 0.5,
  },
});
