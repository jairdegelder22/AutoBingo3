import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from 'react-native';
import { BackButton, OptionButton, PrimaryButton, ScreenLayout, Section, TextField } from './flowComponents';
import { PLAYER_SETUP_STORAGE_KEY, SKIN_OPTIONS, createPlayer } from './gameFlowConfig';

function SkinOptions({ selectedSkin, onSelect }) {
  return (
    <Section title="Skin kiezen">
      {SKIN_OPTIONS.map((skin) => (
        <OptionButton
          key={skin}
          label={skin}
          selected={selectedSkin === skin}
          onPress={() => onSelect(skin)}
        />
      ))}
    </Section>
  );
}

export default function LobbyScreen({ navigation, route }) {
  const [host, setHost] = useState(createPlayer({ skin: 'rood' }));
  const config = route.params?.config;

  useEffect(() => {
    AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY).then((storedValue) => {
      if (!storedValue) return;

      try {
        const parsed = JSON.parse(storedValue);
        setHost((current) => ({
          ...current,
          naam: parsed.spelers?.[0]?.naam ?? current.naam,
          skin: parsed.spelers?.[0]?.skin ?? current.skin,
        }));
      } catch (_error) {
        // Negeer corrupte placeholder-data.
      }
    });
  }, []);

  const deelnemers = useMemo(() => (
    config?.syncType === 'live'
      ? [
          { naam: host.naam || 'Host', skin: host.skin },
          { naam: 'Emma', skin: 'blauw' },
          { naam: 'Lars', skin: 'groen' },
        ]
      : []
  ), [config?.syncType, host.naam, host.skin]);

  async function handleStart() {
    const spelers = [
      {
        ...host,
        naam: host.naam.trim() || 'Host',
      },
    ];

    await AsyncStorage.setItem(
      PLAYER_SETUP_STORAGE_KEY,
      JSON.stringify({ spelers })
    );

    navigation.navigate('Spel', {
      config: {
        ...config,
        aantalSpelersOpDitApparaat: 1,
        spelers,
      },
    });
  }

  return (
    <ScreenLayout
      title="Lobby"
      footer={<PrimaryButton label="Start Spel" disabled={!host.naam.trim()} onPress={handleStart} />}
    >
      <BackButton onPress={navigation.goBack} />

      <Section title="Lobby-code">
        <View style={{ padding: 16, borderWidth: 1, borderColor: '#B8AF9B', borderRadius: 12, backgroundColor: '#FFFFFF' }}>
          <Text style={{ fontSize: 34, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
            {config?.lobbyCode ?? 'WOLF'}
          </Text>
          <Text style={{ marginTop: 8, color: '#4B5563', textAlign: 'center' }}>
            Geef deze code aan de andere spelers
          </Text>
        </View>
      </Section>

      <Section title="Deelnemers">
        {deelnemers.length > 0 ? deelnemers.map((deelnemer, index) => (
          <OptionButton
            key={`${deelnemer.naam}-${index}`}
            label={deelnemer.naam}
            subtitle={`Skin: ${deelnemer.skin}`}
            disabled
          />
        )) : (
          <OptionButton label="Nog geen live deelnemers" subtitle="Bij offline sync blijft deze lijst leeg." disabled />
        )}
      </Section>

      <TextField
        label="Jouw naam"
        value={host.naam}
        onChangeText={(value) => setHost((current) => ({ ...current, naam: value }))}
        placeholder="Naam host"
      />
      <SkinOptions
        selectedSkin={host.skin}
        onSelect={(skin) => setHost((current) => ({ ...current, skin }))}
      />
    </ScreenLayout>
  );
}
