import { useMemo, useState } from 'react';
import { BackButton, OptionButton, PrimaryButton, ScreenLayout, Section, ToggleRow } from './flowComponents';
import { createGameConfig, THEME_OPTIONS, WINCONDITION_OPTIONS } from './gameFlowConfig';

export default function SoloSetupScreen({ navigation }) {
  const [aantalSpelers, setAantalSpelers] = useState(null);
  const [thema, setThema] = useState('');
  const [wincondition, setWincondition] = useState('');
  const [diagonaal, setDiagonaal] = useState(true);
  const [kaartOpzet, setKaartOpzet] = useState('zelfde');

  const isReady = useMemo(
    () => Boolean(aantalSpelers && thema && wincondition && (aantalSpelers === 1 || kaartOpzet)),
    [aantalSpelers, thema, wincondition, kaartOpzet]
  );

  function handleStart() {
    const config = createGameConfig({
      thema,
      wincondition,
      diagonaal,
      kaartOpzet: aantalSpelers === 2 ? kaartOpzet : 'zelfde',
      modus: 'solo',
      syncType: 'geen',
      aantalSpelersOpDitApparaat: aantalSpelers,
      spelers: [],
    });

    navigation.navigate('Spel', { config });
  }

  return (
    <ScreenLayout
      title="Solo setup"
      footer={<PrimaryButton label="Start Spel" disabled={!isReady} onPress={handleStart} />}
    >
      <BackButton onPress={navigation.goBack} />

      <Section title="Stap 1 — Aantal spelers">
        <OptionButton label="1 speler" selected={aantalSpelers === 1} onPress={() => setAantalSpelers(1)} />
        <OptionButton label="2 spelers" selected={aantalSpelers === 2} onPress={() => setAantalSpelers(2)} />
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

      {aantalSpelers === 2 ? (
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
        </Section>
      ) : null}
    </ScreenLayout>
  );
}
