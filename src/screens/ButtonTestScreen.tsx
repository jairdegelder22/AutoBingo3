import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlossyButton from '../components/GlossyButton';
import ArcadeScoopButton from '../components/ArcadeScoopButton';

type ButtonTestScreenProps = {
  navigation?: {
    goBack?: () => void;
  };
};

export default function ButtonTestScreen({ navigation }: ButtonTestScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Glossy button test</Text>
          <Text style={styles.subtitle}>
            Meer richting het echte AutoBingo-logo: dikkere randen, fellere highlights en een
            vloeiendere glossy body.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Normaal</Text>
          <GlossyButton label="Start spel" variant="blue" onPress={() => {}} />
          <GlossyButton label="BINGO!" variant="yellow" onPress={() => {}} />
          <GlossyButton label="Stop" variant="red" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Large</Text>
          <GlossyButton label="Start spel" variant="blue" size="large" onPress={() => {}} />
          <GlossyButton label="BINGO!" variant="yellow" size="large" onPress={() => {}} />
          <GlossyButton label="Stop" variant="red" size="large" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disabled</Text>
          <GlossyButton label="Niet beschikbaar" variant="blue" disabled onPress={() => {}} />
          <GlossyButton label="Nog niet klaar" variant="yellow" disabled onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speelse boogvorm</Text>
          <Text style={styles.sectionNote}>
            Test met rechtere zijkanten, ronde bovenhoeken en een ingesneden boog aan de onderkant.
          </Text>
          <ArcadeScoopButton label="Play" variant="sky" size="large" onPress={() => {}} />
          <ArcadeScoopButton label="Start spel" variant="gold" size="normal" onPress={() => {}} />
          <ArcadeScoopButton label="Live sync" variant="coral" size="normal" onPress={() => {}} />
        </View>

        {navigation?.goBack ? (
          <View style={styles.backWrap}>
            <GlossyButton label="Terug" variant="red" onPress={navigation.goBack} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08121f',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 28,
  },
  header: {
    gap: 6,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 140,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    color: '#e9f7ff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9c7da',
    textAlign: 'center',
  },
  section: {
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#f4fbff',
  },
  sectionNote: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9fc1d8',
  },
  backWrap: {
    marginTop: 4,
  },
});
