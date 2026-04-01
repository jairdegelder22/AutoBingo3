import { useMemo, useState } from 'react';
import { BackButton, InlineNote, PrimaryButton, ScreenLayout, TextField } from './flowComponents';
import { createPlaceholderJoinConfig, normalizeLobbyCode } from './gameFlowConfig';

export default function JoinScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const normalizedCode = useMemo(() => normalizeLobbyCode(code), [code]);

  function handleJoin() {
    if (normalizedCode.length !== 4) {
      setError('Voer een geldige code van 4 letters in.');
      return;
    }

    const config = createPlaceholderJoinConfig(normalizedCode);
    setError('');
    navigation.navigate('SpelerSetup', { config });
  }

  return (
    <ScreenLayout
      title="Code invoeren"
      footer={<PrimaryButton label="Joinen" onPress={handleJoin} />}
    >
      <BackButton onPress={navigation.goBack} />
      <TextField
        label="Lobby-code"
        value={normalizedCode}
        onChangeText={(value) => {
          setError('');
          setCode(normalizeLobbyCode(value));
        }}
        placeholder="WOLF"
        autoCapitalize="characters"
        maxLength={4}
      />
      {error ? <InlineNote>{error}</InlineNote> : null}
    </ScreenLayout>
  );
}
