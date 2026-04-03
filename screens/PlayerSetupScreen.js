import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackButton, InlineNote, OptionButton, PrimaryButton, ScreenLayout, Section, TextField } from './flowComponents';
import { buildPlayerArray, PLAYER_SETUP_STORAGE_KEY, SKIN_OPTIONS } from './gameFlowConfig';
import { joinLobby } from '../src/services/liveLobbyService';

function SkinPicker({ selectedSkin, onSelect }) {
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

export default function PlayerSetupScreen({ navigation, route }) {
  const baseConfig = route.params?.config;
  const [aantalSpelers, setAantalSpelers] = useState(1);
  const [spelers, setSpelers] = useState(buildPlayerArray(2));

  useEffect(() => {
    AsyncStorage.getItem(PLAYER_SETUP_STORAGE_KEY).then((storedValue) => {
      if (!storedValue) return;

      try {
        const parsed = JSON.parse(storedValue);
        setSpelers((current) => current.map((player, index) => ({
          ...player,
          naam: parsed.spelers?.[index]?.naam ?? player.naam,
          skin: parsed.spelers?.[index]?.skin ?? player.skin,
        })));
      } catch (_error) {
        // Negeer corrupte placeholder-data.
      }
    });
  }, []);

  const klassiekModus = baseConfig?.modus === 'klassiek';
  const isReady = useMemo(() => {
    const actieveSpelers = spelers.slice(0, aantalSpelers);
    return actieveSpelers.every((speler) => speler.naam.trim() && speler.skin);
  }, [aantalSpelers, spelers]);

  function updateSpeler(index, patch) {
    setSpelers((current) => current.map((player, playerIndex) => (
      playerIndex === index ? { ...player, ...patch } : player
    )));
  }

  async function handleReady() {
    const geselecteerdeSpelers = spelers.slice(0, aantalSpelers).map((player) => ({
      ...player,
      naam: player.naam.trim(),
    }));

    await AsyncStorage.setItem(
      PLAYER_SETUP_STORAGE_KEY,
      JSON.stringify({ spelers: geselecteerdeSpelers })
    );

    if (baseConfig?.syncType === 'live') {
      await joinLobby({
        code: baseConfig.lobbyCode,
        config: {
          ...baseConfig,
          aantalSpelersOpDitApparaat: aantalSpelers,
          spelers: geselecteerdeSpelers,
        },
        players: geselecteerdeSpelers.map((player) => ({ ...player, role: 'guest' })),
      });
    }

    navigation.navigate('Wachten', {
      config: {
        ...baseConfig,
        aantalSpelersOpDitApparaat: aantalSpelers,
        spelers: geselecteerdeSpelers,
      },
    });
  }

  return (
    <ScreenLayout
      title="Speler setup"
      footer={<PrimaryButton label="Klaar — Wacht op host" disabled={!isReady} onPress={handleReady} />}
    >
      <BackButton onPress={navigation.goBack} />

      <TextField
        label="Jouw naam"
        value={spelers[0].naam}
        onChangeText={(value) => updateSpeler(0, { naam: value })}
        placeholder="Naam speler 1"
      />
      <SkinPicker selectedSkin={spelers[0].skin} onSelect={(skin) => updateSpeler(0, { skin })} />

      <Section title="Hoeveel spelers op dit apparaat?">
        <OptionButton
          label="1 speler"
          selected={aantalSpelers === 1}
          onPress={() => setAantalSpelers(1)}
        />
        <OptionButton
          label="2 spelers"
          selected={aantalSpelers === 2}
          disabled={!klassiekModus}
          rightLabel={!klassiekModus ? 'Alleen bij Klassiek' : undefined}
          onPress={() => setAantalSpelers(2)}
        />
      </Section>

      <Section title="Debug config">
        <InlineNote>
          Code: {baseConfig?.lobbyCode ?? '-'}{'\n'}
          Thema: {baseConfig?.thema ?? '-'}{'\n'}
          Mode: {baseConfig?.modus ?? '-'}{'\n'}
          Sync: {baseConfig?.syncType ?? '-'}{'\n'}
          Seed: {String(baseConfig?.seed ?? '-')}{'\n'}
          Salt: {String(baseConfig?.salt ?? '-')}
        </InlineNote>
      </Section>

      {aantalSpelers === 2 ? (
        <>
          <TextField
            label="Tweede naam"
            value={spelers[1].naam}
            onChangeText={(value) => updateSpeler(1, { naam: value })}
            placeholder="Naam speler 2"
          />
          <SkinPicker selectedSkin={spelers[1].skin} onSelect={(skin) => updateSpeler(1, { skin })} />
        </>
      ) : null}

      <InlineNote>
        Live sync gebruikt de lobby-code voor dezelfde spelinhoud en synchroniseert live deelnemers en voortgang.
      </InlineNote>
    </ScreenLayout>
  );
}
