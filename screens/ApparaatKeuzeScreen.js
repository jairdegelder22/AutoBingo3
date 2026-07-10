import { View } from 'react-native';
import { BackButton, OptionButton, ScreenLayout } from './flowComponents';

export default function ApparaatKeuzeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <BackButton navigation={navigation} />
      <ScreenLayout title="Hoe wil je spelen?">
        <OptionButton
          label="Dit apparaat"
          subtitle="1 of 2 spelers op hetzelfde scherm met de nieuwe setup"
          onPress={() => navigation.navigate('SingleDeviceSetupTest')}
        />
        <OptionButton
          label="Meerdere apparaten"
          subtitle="Tot 6 spelers, online of offline"
          onPress={() => navigation.navigate('MultiplayerKeuze')}
        />
        <View />
      </ScreenLayout>
    </View>
  );
}
