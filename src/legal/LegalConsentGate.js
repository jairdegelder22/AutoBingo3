import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_ACCEPTANCE_STORAGE_KEY, LEGAL_TERMS_VERSION, LEGAL_URLS } from './legalConfig';

export async function hasAcceptedCurrentLegalTerms() {
  try {
    const storedValue = await AsyncStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
    const acceptance = storedValue ? JSON.parse(storedValue) : null;

    return acceptance?.termsVersion === LEGAL_TERMS_VERSION;
  } catch (_error) {
    return false;
  }
}

export default function LegalConsentGate({ onAccepted, backgroundColor = 'rgba(0, 0, 0, 0.48)' }) {
  const [accepting, setAccepting] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const scrollableDistance = Math.max(scrollContentHeight - scrollViewHeight, 0);
  const canScroll = scrollableDistance > 8;
  const scrollProgress = scrollableDistance > 0
    ? Math.min(Math.max(scrollOffset / scrollableDistance, 0), 1)
    : 0;
  const scrollbarTrackHeight = Math.max(scrollViewHeight - 18, 0);
  const scrollbarThumbHeight = canScroll
    ? Math.max(42, scrollbarTrackHeight * (scrollViewHeight / scrollContentHeight))
    : 0;
  const scrollbarThumbTop = canScroll
    ? 9 + (scrollbarTrackHeight - scrollbarThumbHeight) * scrollProgress
    : 0;

  async function openLegalUrl(url) {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert('Link openen lukt niet', 'Probeer het later opnieuw.');
    }
  }

  async function acceptTerms() {
    if (accepting || !hasRead) {
      return;
    }

    setAccepting(true);

    try {
      await AsyncStorage.setItem(
        LEGAL_ACCEPTANCE_STORAGE_KEY,
        JSON.stringify({
          hasAcceptedTerms: true,
          termsVersion: LEGAL_TERMS_VERSION,
          acceptedAt: new Date().toISOString(),
        })
      );
      onAccepted();
    } catch (_error) {
      Alert.alert('Opslaan lukt niet', 'We kunnen je akkoord nu niet bewaren. Probeer het opnieuw.');
      setAccepting(false);
    }
  }

  function handleScroll(event) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const reachedBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;

    setScrollOffset(contentOffset.y);

    if (reachedBottom) {
      setHasRead(true);
    }
  }

  function handleContentSizeChange(_contentWidth, contentHeight) {
    setScrollContentHeight(contentHeight);

    if (scrollViewHeight > 0 && contentHeight <= scrollViewHeight + 8) {
      setHasRead(true);
    }
  }

  function handleScrollLayout(event) {
    const nextScrollViewHeight = event.nativeEvent.layout.height;

    setScrollViewHeight(nextScrollViewHeight);

    if (scrollContentHeight > 0 && scrollContentHeight <= nextScrollViewHeight + 8) {
      setHasRead(true);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <View style={styles.panel}>
        <Text style={styles.title}>AutoBingo</Text>
        <View style={styles.scrollArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onLayout={handleScrollLayout}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            persistentScrollbar
            scrollEventThrottle={16}
            showsVerticalScrollIndicator
          >
            <Text style={styles.heading}>Gebruiksvoorwaarden en privacy</Text>
            <Text style={styles.body}>
              Door verder te gaan ga je akkoord met onze Gebruiksvoorwaarden en ons Privacybeleid.
            </Text>
            <Text style={styles.body}>
              AutoBingo is bedoeld voor <Text style={styles.bold}>passagiers</Text>.{' '}
              <Text style={styles.bold}>Bestuurders mogen de app niet bedienen tijdens het rijden.</Text>{' '}
              Gebruik de app alleen op een veilige manier en volg altijd de verkeersregels.
            </Text>
            <Text style={styles.body}>
              We bewaren je akkoord lokaal op dit apparaat met versie {LEGAL_TERMS_VERSION}. Als de voorwaarden later
              wijzigen, vragen we opnieuw om akkoord.
            </Text>
            <View style={styles.linkStack}>
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.terms);
                }}
                style={styles.linkButton}
              >
                <Text style={styles.link}>Lees de Gebruiksvoorwaarden</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.privacy);
                }}
                style={styles.linkButton}
              >
                <Text style={styles.link}>Lees het Privacybeleid</Text>
              </Pressable>
            </View>
            <Text style={styles.footerText}>Scroll naar beneden om akkoord te kunnen gaan.</Text>
          </ScrollView>
          {canScroll ? (
            <View pointerEvents="none" style={styles.scrollbarTrack}>
              <View
                style={[
                  styles.scrollbarThumb,
                  {
                    height: scrollbarThumbHeight,
                    top: scrollbarThumbTop,
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: accepting || !hasRead }}
          disabled={accepting || !hasRead}
          onPress={() => {
            void acceptTerms();
          }}
          style={({ pressed }) => [
            styles.button,
            (accepting || !hasRead) && styles.buttonDisabled,
            pressed && !accepting && hasRead && styles.buttonPressed,
          ]}
        >
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Akkoord en verdergaan</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    zIndex: 9800,
    elevation: 9800,
  },
  panel: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '82%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#6B1010',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    marginBottom: 16,
    color: '#E03030',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  scrollArea: {
    maxHeight: 330,
    position: 'relative',
  },
  scrollView: {
    maxHeight: 330,
  },
  scrollContent: {
    paddingBottom: 8,
    paddingRight: 18,
  },
  scrollbarTrack: {
    position: 'absolute',
    top: 0,
    right: 2,
    bottom: 0,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#D8DEE8',
  },
  scrollbarThumb: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderRadius: 3,
    backgroundColor: '#E03030',
  },
  heading: {
    marginBottom: 10,
    color: '#263046',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  body: {
    color: '#263046',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '800',
  },
  linkStack: {
    gap: 8,
    marginTop: 2,
    marginBottom: 12,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  link: {
    color: '#0B72D9',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  footerText: {
    color: '#778092',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: '#168B4D',
    paddingHorizontal: 18,
    shadowColor: '#0B4C2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ translateY: 3 }],
    shadowOffset: { width: 0, height: 1 },
  },
  buttonDisabled: {
    backgroundColor: '#9AA3B2',
    opacity: 0.82,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
  },
});
