import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from 'react-native';
import { BackButton, OptionButton, PrimaryButton, ScreenLayout, Section, TextField } from './flowComponents';
import { PLAYER_SETUP_STORAGE_KEY, SKIN_OPTIONS, createPlayer } from './gameFlowConfig';
import { formatLobbyCodeForDisplay } from '../src/utils/lobbyCode';
import { ensureLobby, startLobby, subscribeToLobby, upsertPlayers } from '../src/services/liveLobbyService';

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
  const [liveLobby, setLiveLobby] = useState(null);
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

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    void ensureLobby({
      code: config.lobbyCode,
      config,
      hostPlayer: {
        ...host,
        playerId: host.playerId,
        naam: host.naam.trim() || 'Host',
        role: 'host',
      },
    });

    return undefined;
  }, [config?.lobbyCode, config?.syncType, host.playerId]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    void upsertPlayers(config.lobbyCode, [{
      ...host,
      playerId: host.playerId,
      naam: host.naam.trim() || 'Host',
      role: 'host',
    }]);

    return undefined;
  }, [config?.lobbyCode, config?.syncType, host]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    const unsubscribe = subscribeToLobby(config.lobbyCode, setLiveLobby);
    return unsubscribe;
  }, [config?.lobbyCode, config?.syncType]);

  const deelnemers = useMemo(() => {
    if (config?.syncType !== 'live') {
      return [];
    }

    return liveLobby?.players?.length ? liveLobby.players : [
      { naam: host.naam || 'Host', skin: host.skin, playerId: host.playerId, role: 'host' },
    ];
  }, [config?.syncType, host, liveLobby]);

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

    if (config?.syncType === 'live') {
      await upsertPlayers(config.lobbyCode, spelers.map((player) => ({ ...player, role: 'host' })));
      await startLobby(config.lobbyCode);
    }

    navigation.navigate('Spel', {
      config: {
        ...config,
        aantalSpelersOpDitApparaat: 1,
        spelers,
        liveLobbyPlayers: liveLobby?.players ?? spelers,
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
            {formatLobbyCodeForDisplay(config?.lobbyCode ?? '') || 'BG·47·KW'}
          </Text>
          <Text style={{ marginTop: 8, color: '#4B5563', textAlign: 'center' }}>
            Geef deze code aan de andere spelers
          </Text>
        </View>
      </Section>

      <Section title="Debug config">
        <View style={{ padding: 16, borderWidth: 1, borderColor: '#D7DEE6', borderRadius: 12, backgroundColor: '#F8FBFD', gap: 6 }}>
          <Text style={{ color: '#334155' }}>Code: {config?.lobbyCode ?? '-'}</Text>
          <Text style={{ color: '#334155' }}>Thema: {config?.thema ?? '-'}</Text>
          <Text style={{ color: '#334155' }}>Mode: {config?.modus ?? '-'}</Text>
          <Text style={{ color: '#334155' }}>Sync: {config?.syncType ?? '-'}</Text>
          <Text style={{ color: '#334155' }}>Seed: {String(config?.seed ?? '-')}</Text>
          <Text style={{ color: '#334155' }}>Salt: {String(config?.salt ?? '-')}</Text>
        </View>
      </Section>

      <Section title="Deelnemers">
        {deelnemers.length > 0 ? deelnemers.map((deelnemer, index) => (
          <OptionButton
            key={`${deelnemer.naam}-${index}`}
            label={deelnemer.naam}
            subtitle={`Skin: ${deelnemer.skin}${deelnemer.role === 'host' ? ' • host' : ''}`}
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
