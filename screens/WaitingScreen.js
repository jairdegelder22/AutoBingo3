import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton, ScreenLayout, Section } from './flowComponents';
import { getLobbySnapshot, subscribeToLobby } from '../src/services/liveLobbyService';

export default function WaitingScreen({ navigation, route }) {
  const config = route.params?.config;
  const eersteSpeler = config?.spelers?.[0];
  const [liveLobby, setLiveLobby] = useState(null);

  useEffect(() => {
    if (config?.syncType === 'live') {
      return undefined;
    }

    const timeout = setTimeout(() => {
      navigation.replace('Spel', { config });
    }, 1800);

    return () => clearTimeout(timeout);
  }, [config, navigation]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !config?.lobbyCode) {
      return undefined;
    }

    void getLobbySnapshot(config.lobbyCode).then(setLiveLobby);
    return subscribeToLobby(config.lobbyCode, setLiveLobby);
  }, [config?.lobbyCode, config?.syncType]);

  useEffect(() => {
    if (config?.syncType !== 'live' || !liveLobby?.started) {
      return;
    }

    navigation.replace('Spel', {
      config: {
        ...config,
        ...liveLobby.config,
        liveLobbyPlayers: liveLobby.players,
      },
    });
  }, [config, liveLobby, navigation]);

  const andereDeelnemers = useMemo(
    () => (config?.syncType === 'live' ? liveLobby?.players ?? [] : []),
    [config?.syncType, liveLobby]
  );

  return (
    <ScreenLayout
      title="Wachten op de host..."
      footer={
        config?.syncType === 'live'
          ? <PrimaryButton label="Nog wachten op start" disabled onPress={() => {}} />
          : <PrimaryButton label="Start nu (placeholder)" onPress={() => navigation.replace('Spel', { config })} />
      }
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
            {andereDeelnemers.length > 0 ? andereDeelnemers.map((deelnemer) => (
              <Text key={deelnemer.playerId} style={{ color: '#111827' }}>
                {deelnemer.naam} — {deelnemer.skin}{deelnemer.role === 'host' ? ' (host)' : ''}
              </Text>
            )) : (
              <Text style={{ color: '#111827' }}>Nog geen live deelnemers zichtbaar.</Text>
            )}
          </View>
        </Section>
      ) : null}

      {config?.syncType === 'live' ? (
        <Section title="Lobby status">
          <View style={{ padding: 16, borderWidth: 1, borderColor: '#B8AF9B', borderRadius: 12, backgroundColor: '#FFFFFF', gap: 8 }}>
            <Text style={{ color: '#111827' }}>Code: {config?.lobbyCode ?? '-'}</Text>
            <Text style={{ color: '#111827' }}>Status: {liveLobby?.started ? 'gestart' : 'wachten op host'}</Text>
            <Text style={{ color: '#111827' }}>Spelers in lobby: {String(andereDeelnemers.length)}</Text>
          </View>
        </Section>
      ) : null}
    </ScreenLayout>
  );
}
