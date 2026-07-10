import { useState } from 'react';
import { View } from 'react-native';
import { BackButton, OptionButton, ScreenLayout } from './flowComponents';
import PremiumPaywallModal from '../src/premium/PremiumPaywallModal';
import { usePremium } from '../src/premium/PremiumContext';

function withRouteLoader(routeName) {
  return {
    transition: {
      color: '#E03030',
      routeName,
      pauseMs: 0,
      transitionKey: `${routeName}-${Date.now()}`,
    },
  };
}

export default function MultiplayerKeuzeScreen({ navigation }) {
  const { isPremium } = usePremium();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  function openHostSetup() {
    navigation.navigate('HostSetup', withRouteLoader('HostSetup'));
  }

  function handleHostPress() {
    if (!isPremium) {
      setPremiumModalVisible(true);
      return;
    }

    openHostSetup();
  }

  return (
    <View style={{ flex: 1 }}>
      <BackButton navigation={navigation} />
      <ScreenLayout title="Online spelen">
        <OptionButton
          label="Host — Maak een spel aan"
          subtitle={isPremium ? 'Maak een lobby aan' : 'Premium nodig om te hosten'}
          rightLabel={isPremium ? undefined : 'Premium'}
          onPress={handleHostPress}
        />
        <OptionButton
          label="Join — Voer een code in"
          subtitle="Gratis — join met een lobbycode"
          onPress={() => navigation.navigate('Join', withRouteLoader('Join'))}
        />
      </ScreenLayout>
      <PremiumPaywallModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUnlocked={() => {
          setPremiumModalVisible(false);
          openHostSetup();
        }}
        title="Hosten is Premium"
        message="Een familielid met Premium kan de lobby hosten. Iedereen anders kan gratis joinen."
      />
    </View>
  );
}
