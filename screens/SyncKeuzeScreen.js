import { BackButton, OptionButton, ScreenLayout } from './flowComponents';

export default function SyncKeuzeScreen({ navigation }) {
  return (
    <ScreenLayout title="Verbinding kiezen">
      <BackButton onPress={navigation.goBack} />
      <OptionButton
        label="Live sync"
        subtitle="Vereist internet — iedereen ziet elkaars voortgang"
        onPress={() => navigation.navigate('HostSetup', { sync: 'live' })}
      />
      <OptionButton
        label="Geen sync"
        subtitle="Werkt offline — code bevat alle instellingen"
        onPress={() => navigation.navigate('HostSetup', { sync: 'offline' })}
      />
    </ScreenLayout>
  );
}
