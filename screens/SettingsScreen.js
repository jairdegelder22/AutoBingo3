import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackButton, ScreenLayout, Section, ToggleRow } from './flowComponents';

export default function SettingsScreen({ navigation, onBack }) {
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['sound', 'vibration']).then((pairs) => {
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

  const handleBack = navigation?.goBack ?? onBack ?? (() => {});

  return (
    <ScreenLayout title="Instellingen">
      <BackButton onPress={handleBack} />
      <Section title="Algemeen">
        <ToggleRow label="Geluid aan" value={sound} onValueChange={toggleSound} />
        <ToggleRow label="Trillingen aan" value={vibration} onValueChange={toggleVibration} />
      </Section>
      <Section title="Premium">
        <ToggleRow label="Premium thema's zijn nog placeholder" value={false} onValueChange={() => {}} disabled />
      </Section>
    </ScreenLayout>
  );
}
