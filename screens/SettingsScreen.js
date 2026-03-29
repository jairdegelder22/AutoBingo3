import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ onBack }) {
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
    setSound(val);
    AsyncStorage.setItem('sound', String(val));
  }

  function toggleVibration(val) {
    setVibration(val);
    AsyncStorage.setItem('vibration', String(val));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Instellingen</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Geluid aan</Text>
          <Switch
            value={sound}
            onValueChange={toggleSound}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Trillingen aan</Text>
          <Switch
            value={vibration}
            onValueChange={toggleVibration}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.premiumSection}>
        <Text style={styles.premiumLabel}>Premium kopen</Text>
        <TouchableOpacity style={styles.premiumButton}>
          <Text style={styles.premiumButtonText}>Premium  👑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F5C400',
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  premiumSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  premiumLabel: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: '#FF6B6B',
    width: '80%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
