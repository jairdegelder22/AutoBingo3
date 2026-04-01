import { useMemo, useState } from 'react';
import { BackButton, OptionButton, PrimaryButton, ScreenLayout, Section, ToggleRow } from './flowComponents';
import {
  createGameConfig,
  createPlaceholderLobbyCode,
  DEFAULT_ZICHTBAARHEID,
  THEME_OPTIONS,
  WINCONDITION_OPTIONS,
} from './gameFlowConfig';

export default function HostSetupScreen({ navigation, route }) {
  const sync = route.params?.sync === 'live' ? 'live' : 'offline';
  const [modus, setModus] = useState('');
  const [thema, setThema] = useState('');
  const [wincondition, setWincondition] = useState('');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');
  const [zichtbaarheid, setZichtbaarheid] = useState(DEFAULT_ZICHTBAARHEID);

  const isReady = useMemo(
    () => Boolean(modus && thema && wincondition && kaartOpzet),
    [modus, thema, wincondition, kaartOpzet]
  );

  function handleGenerateCode() {
    const config = createGameConfig({
      thema,
      wincondition,
      diagonaal,
      kaartOpzet,
      modus,
      syncType: sync === 'live' ? 'live' : 'geen',
      lobbyCode: createPlaceholderLobbyCode(sync === 'live' ? 'live' : 'geen'),
      aantalSpelersOpDitApparaat: 1,
      zichtbaarheid: sync === 'live'
        ? zichtbaarheid
        : { eigenVoortgang: false, andermansVoortgang: false },
      spelers: [],
    });

    navigation.navigate('Lobby', { config });
  }

  return (
    <ScreenLayout
      title="Host setup"
      footer={<PrimaryButton label="Genereer Code" disabled={!isReady} onPress={handleGenerateCode} />}
    >
      <BackButton onPress={navigation.goBack} />

      <Section title="Stap 1 — Gamemode">
        <OptionButton
          label="Collectief"
          subtitle="Samen één kaart afvinken"
          selected={modus === 'collectief'}
          onPress={() => setModus('collectief')}
        />
        <OptionButton
          label="Klassiek"
          subtitle="Eigen kaart, wie heeft eerst bingo?"
          selected={modus === 'klassiek'}
          onPress={() => setModus('klassiek')}
        />
        <OptionButton
          label="Claim"
          subtitle="Claim tegels op een gedeelde kaart"
          selected={modus === 'claim'}
          disabled={sync !== 'live'}
          rightLabel={sync !== 'live' ? 'Vereist live sync' : undefined}
          onPress={() => setModus('claim')}
        />
      </Section>

      <Section title="Stap 2 — Thema kiezen">
        {THEME_OPTIONS.map((option) => (
          <OptionButton
            key={option.id}
            label={option.label}
            selected={thema === option.id}
            disabled={option.premium}
            rightLabel={option.premium ? 'Premium' : undefined}
            onPress={() => setThema(option.id)}
          />
        ))}
      </Section>

      <Section title="Stap 3 — Wincondition">
        {WINCONDITION_OPTIONS.map((option) => (
          <OptionButton
            key={option.id}
            label={option.label}
            selected={wincondition === option.id}
            onPress={() => setWincondition(option.id)}
          />
        ))}
        <ToggleRow label="Diagonaal telt mee" value={diagonaal} onValueChange={setDiagonaal} />
      </Section>

      <Section title="Stap 4 — Kaartopzet">
        <OptionButton
          label="Zelfde kaart"
          subtitle="Identieke items op identieke posities"
          selected={kaartOpzet === 'zelfde'}
          onPress={() => setKaartOpzet('zelfde')}
        />
        <OptionButton
          label="Andere kaart"
          subtitle="Zelfde thema, andere willekeurige mix"
          selected={kaartOpzet === 'anders'}
          onPress={() => setKaartOpzet('anders')}
        />
        <OptionButton
          label="Ander thema per speler"
          selected={kaartOpzet === 'ander-thema'}
          disabled={modus !== 'klassiek'}
          rightLabel={modus !== 'klassiek' ? 'Alleen bij Klassiek' : undefined}
          onPress={() => setKaartOpzet('ander-thema')}
        />
      </Section>

      {sync === 'live' ? (
        <Section title="Stap 5 — Zichtbaarheid">
          <ToggleRow
            label="Eigen voortgang tonen"
            value={zichtbaarheid.eigenVoortgang}
            onValueChange={(value) => setZichtbaarheid((current) => ({ ...current, eigenVoortgang: value }))}
          />
          <ToggleRow
            label="Voortgang van anderen tonen"
            value={zichtbaarheid.andermansVoortgang}
            onValueChange={(value) => setZichtbaarheid((current) => ({ ...current, andermansVoortgang: value }))}
          />
        </Section>
      ) : null}
    </ScreenLayout>
  );
}
