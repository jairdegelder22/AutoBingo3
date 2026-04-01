import { BackHandler, Animated, ImageBackground, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { PrimaryButton } from './flowComponents';

export default function HomeScreen({ navigation }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      subscription.remove();
      animation.stop();
    };
  }, [pulse]);

  return (
    <ImageBackground
      source={require('../assets/homepage.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Animated.Image
          source={require('../assets/logo.png')}
          resizeMode="contain"
          style={[styles.logo, { transform: [{ scale: pulse }] }]}
        />

        <View style={styles.footer}>
          <PrimaryButton label="Spelen" onPress={() => navigation.navigate('ApparaatKeuze')} />
          <PrimaryButton label="Instellingen" onPress={() => navigation.navigate('Instellingen')} />
          <PrimaryButton label="Button test" onPress={() => navigation.navigate('ButtonTest')} />
          <PrimaryButton label="Carousel test" onPress={() => navigation.navigate('ThemeCarouselTest')} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  logo: {
    width: '100%',
    height: 380,
    alignSelf: 'center',
  },
  footer: {
    gap: 12,
  },
});
