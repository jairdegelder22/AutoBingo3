import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton, ScreenLayout, Section } from './flowComponents';

export default function WaitingScreen({ navigation, route }) {
  const config = route.params?.config;
  const eersteSpeler = config?.spelers?.[0];

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Spel', { config });
    }, 1800);

    return () => clearTimeout(timeout);
  }, [config, navigation]);

  return (
    <ScreenLayout
      title="Wachten op de host..."
      footer={<PrimaryButton label="Start nu (placeholder)" onPress={() => navigation.replace('Spel', { config })} />}
    >
      <Section title="Jouw gegevens">
        <View style={{ padding: 16, borderWidth: 1, borderColor: '#B8AF9B', borderRadius: 12, backgroundColor: '#FFFFFF', gap: 8 }}>
          <Text style={{ fontSize: 16, color: '#111827' }}>
            Naam: {eersteSpeler?.naam ?? 'Onbekend'}
          </Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>
            Skin: {eersteSpeler?.skin ?? 'Onbekend'}
          </Text>
        </View>
      </Section>

      {config?.syncType === 'live' ? (
        <Section title="Andere deelnemers">
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#111827' }}>Emma — blauw</Text>
            <Text style={{ color: '#111827' }}>Lars — groen</Text>
          </View>
        </Section>
      ) : null}
    </ScreenLayout>
  );
}
