import { BackButton, OptionButton, ScreenLayout } from './flowComponents';

export default function MultiplayerKeuzeScreen({ navigation }) {
  return (
    <ScreenLayout title="Online spelen">
      <BackButton onPress={navigation.goBack} />
      <OptionButton
        label="Host — Maak een spel aan"
        onPress={() => navigation.navigate('SyncKeuze')}
      />
      <OptionButton
        label="Join — Voer een code in"
        onPress={() => navigation.navigate('Join')}
      />
    </ScreenLayout>
  );
}
