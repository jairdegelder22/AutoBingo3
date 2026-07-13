import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function LegalConsentGate({ onAccepted }) {
  const [accepting, setAccepting] = useState(false);

  async function openLegalUrl(url) {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert('Link openen lukt niet', 'Probeer het later opnieuw.');
    }
  }

  async function acceptTerms() {
    if (accepting) {
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

  return (
    <View style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.title}>AutoBingo</Text>
        <Text style={styles.body}>
          Door verder te gaan ga je akkoord met onze{' '}
          <Text
            accessibilityRole="link"
            style={styles.link}
            onPress={() => {
              void openLegalUrl(LEGAL_URLS.terms);
            }}
          >
            Gebruiksvoorwaarden
          </Text>
          {' '}en{' '}
          <Text
            accessibilityRole="link"
            style={styles.link}
            onPress={() => {
              void openLegalUrl(LEGAL_URLS.privacy);
            }}
          >
            Privacybeleid
          </Text>
          .
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={accepting}
          onPress={() => {
            void acceptTerms();
          }}
          style={({ pressed }) => [
            styles.button,
            accepting && styles.buttonDisabled,
            pressed && !accepting && styles.buttonPressed,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E03030',
    padding: 22,
  },
  panel: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 26,
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
  body: {
    color: '#263046',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
  },
  link: {
    color: '#0B72D9',
    fontWeight: '800',
    textDecorationLine: 'underline',
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
    opacity: 0.72,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
  },
});
