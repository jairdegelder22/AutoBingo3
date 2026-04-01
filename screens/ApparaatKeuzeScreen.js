import { View } from 'react-native';
import { BackButton, OptionButton, ScreenLayout } from './flowComponents';

export default function ApparaatKeuzeScreen({ navigation }) {
  return (
    <ScreenLayout title="Hoe wil je spelen?">
      <BackButton onPress={navigation.goBack} />
      <OptionButton
        label="Dit apparaat"
        subtitle="1 of 2 spelers op hetzelfde scherm"
        onPress={() => navigation.navigate('SoloSetup')}
      />
      <OptionButton
        label="Meerdere apparaten"
        subtitle="Tot 6 spelers, online of offline"
        onPress={() => navigation.navigate('MultiplayerKeuze')}
      />
      <OptionButton
        label="1 apparaat nieuw (test)"
        subtitle="Nieuwe setup met thema-carousel en instellingen-sheet"
        onPress={() => navigation.navigate('SingleDeviceSetupTest')}
      />
      <View />
    </ScreenLayout>
  );
}
