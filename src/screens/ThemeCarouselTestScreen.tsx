import React, { useMemo, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeCarousel from '../components/ThemeCarousel';
import GlossyButton from '../components/GlossyButton';

type ThemeCard = {
  id: string;
  title: string;
  subtitle: string;
  surface: string;
  border: string;
};

type ThemeCarouselTestScreenProps = {
  navigation?: {
    goBack?: () => void;
  };
};

const THEME_CARDS: ThemeCard[] = [
  {
    id: 'roadtrip',
    title: 'Roadtrip',
    subtitle: 'Snelle wegen, borden en verrassingen onderweg.',
    surface: '#2b7898',
    border: '#123d51',
  },
  {
    id: 'city',
    title: 'Stad',
    subtitle: 'Trams, zebrapaden en drukke kruispunten.',
    surface: '#d28b2f',
    border: '#7a4700',
  },
  {
    id: 'country',
    title: 'Platteland',
    subtitle: 'Dieren, tractors en slingerwegen in de polder.',
    surface: '#4f9c65',
    border: '#1f5d36',
  },
  {
    id: 'holiday',
    title: 'Vakantie',
    subtitle: 'Campers, strandspullen en zonnige stops.',
    surface: '#d06b42',
    border: '#7e3518',
  },
  {
    id: 'signs',
    title: 'Verkeersborden',
    subtitle: 'Herken borden sneller met een speelse twist.',
    surface: '#b95353',
    border: '#6c2222',
  },
];

export default function ThemeCarouselTestScreen({ navigation }: ThemeCarouselTestScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTheme = THEME_CARDS[activeIndex] ?? THEME_CARDS[0];

  const cards = useMemo(() => THEME_CARDS, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#08121f', '#0d1b2f', '#10243e']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.background}
      >
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Theme coverflow</Text>
          <Text style={styles.subtitle}>
            Swipe horizontaal en laat de middelste kaart de show stelen.
          </Text>
        </View>

        <ThemeCarousel
          items={cards}
          itemSpacing={10}
          itemWidth={214}
          keyExtractor={(item) => item.id}
          onSnapToItem={setActiveIndex}
          containerStyle={styles.carousel}
          renderCard={({ item }) => <ThemePreviewCard item={item} />}
        />

        <View style={styles.captionPanel}>
          <Text style={styles.captionLabel}>In focus</Text>
          <Text style={styles.captionTitle}>{activeTheme.title}</Text>
          <Text style={styles.captionText}>{activeTheme.subtitle}</Text>
        </View>

        {navigation?.goBack ? (
          <View style={styles.footer}>
            <GlossyButton label="Terug" variant="blue" onPress={navigation.goBack} />
          </View>
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

function ThemePreviewCard({ item }: { item: ThemeCard }) {
  return (
    <View style={[styles.cardShell, { shadowColor: item.border }]}>
      <View style={[styles.cardOutline, { backgroundColor: item.border }]}>
        <View style={[styles.cardBody, { backgroundColor: item.surface }]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08121f',
  },
  background: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  logo: {
    width: 170,
    height: 96,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    color: '#eef9ff',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#bdd6e8',
    maxWidth: 290,
  },
  carousel: {
    marginTop: 10,
  },
  cardShell: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 7,
  },
  cardOutline: {
    padding: 3,
    borderRadius: 26,
  },
  cardBody: {
    width: 214,
    height: 290,
    borderRadius: 23,
    paddingHorizontal: 18,
    paddingVertical: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 30,
    lineHeight: 34,
    color: '#fffaf0',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255, 250, 240, 0.92)',
    maxWidth: 165,
    textAlign: 'center',
  },
  captionPanel: {
    marginHorizontal: 24,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  captionLabel: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8baac0',
  },
  captionTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 24,
    color: '#f3fbff',
  },
  captionText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#c6dcec',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
});
