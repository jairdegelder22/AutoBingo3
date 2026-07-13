import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BackButton, InlineNote, PrimaryButton, ScreenLayout, TextField } from './flowComponents';
import { createGameConfig, DEFAULT_ZICHTBAARHEID } from './gameFlowConfig';
import { decodeLobbyCode, formatLobbyCodeForDisplay, normalizeLobbyCode } from '../src/utils/lobbyCode';
import { getLobbySnapshot } from '../src/services/liveLobbyService';

export default function JoinScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const normalizedCode = useMemo(() => normalizeLobbyCode(code), [code]);

  async function handleJoin() {
    if (normalizedCode.length !== 7) {
      setError('Voer een geldige code van 7 tekens in.');
      return;
    }

    const decoded = decodeLobbyCode(normalizedCode);
    if (!decoded) {
      setError('Deze code is ongeldig of beschadigd.');
      return;
    }

    const syncType = decoded.syncType === 'live' ? 'live' : 'geen';
    const liveLobby = syncType === 'live' ? await getLobbySnapshot(normalizedCode) : null;
    if (syncType === 'live' && !liveLobby) {
      setError('Deze live lobby is niet gevonden of niet meer beschikbaar.');
      return;
    }

    const config = createGameConfig({
      thema: liveLobby?.config?.thema ?? decoded.thema,
      modus: liveLobby?.config?.modus ?? decoded.gameMode,
      syncType,
      lobbyCode: normalizedCode,
      seed: liveLobby?.config?.seed ?? decoded.seed,
      salt: liveLobby?.config?.salt ?? decoded.salt,
      wincondition: liveLobby?.config?.wincondition ?? '1rij',
      diagonaal: typeof liveLobby?.config?.diagonaal === 'boolean' ? liveLobby.config.diagonaal : true,
      kaartOpzet: liveLobby?.config?.kaartOpzet ?? 'zelfde',
      zichtbaarheid: decoded.syncType === 'live'
        ? { ...DEFAULT_ZICHTBAARHEID }
        : { eigenVoortgang: false, andermansVoortgang: false },
    });

    setError('');
    navigation.navigate('Wachten', { config });
  }

  return (
    <View style={{ flex: 1 }}>
      <BackButton navigation={navigation} />
      <ScreenLayout
        title="Code invoeren"
        footer={<PrimaryButton label="Joinen" onPress={handleJoin} />}
      >
        <TextField
          label="Lobby-code"
          value={formatLobbyCodeForDisplay(normalizedCode)}
          onChangeText={(value) => {
            setError('');
            setCode(value);
          }}
          placeholder="BG·47·KW"
          autoCapitalize="characters"
          maxLength={9}
        />
        {error ? <InlineNote>{error}</InlineNote> : null}
      </ScreenLayout>
    </View>
  );
}
