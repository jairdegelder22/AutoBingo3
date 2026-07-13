import { View } from 'react-native';
import { BackButton, OptionButton, ScreenLayout } from './flowComponents';

function withHostSetupLoader(params) {
  return {
    ...params,
    transition: {
      color: '#E03030',
      routeName: 'HostSetup',
      pauseMs: 0,
      transitionKey: `HostSetup-${Date.now()}`,
    },
  };
}

export default function SyncKeuzeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <BackButton navigation={navigation} />
      <ScreenLayout title="Verbinding kiezen">
        <OptionButton
          label="Live sync"
          subtitle="Vereist internet — iedereen ziet elkaars voortgang"
          onPress={() => navigation.navigate('HostSetup', withHostSetupLoader({ sync: 'live' }))}
        />
        <OptionButton
          label="Geen sync"
          subtitle="Werkt offline — code bevat alle instellingen"
          onPress={() => navigation.navigate('HostSetup', withHostSetupLoader({ sync: 'offline' }))}
        />
      </ScreenLayout>
    </View>
  );
}
