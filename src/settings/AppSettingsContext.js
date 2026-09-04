import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, normalizeLanguage } from '../i18n/languages';
import { setHapticsEnabled } from './haptics';

const STORAGE_KEY = 'autobingo:app-settings:v1';

export const DEFAULT_APP_SETTINGS = {
  masterSoundEnabled: true,
  musicEnabled: true,
  soundEffectsEnabled: true,
  musicVolume: 0.75,
  soundEffectsVolume: 0.85,
  hapticsEnabled: true,
  language: DEFAULT_LANGUAGE,
};

const AppSettingsContext = createContext({
  settings: DEFAULT_APP_SETTINGS,
  hydrated: false,
  updateSetting: () => {},
  updateSettings: () => {},
});

function normalizeSettings(value) {
  const nextSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...(value ?? {}),
  };

  nextSettings.musicVolume = clamp(Number(nextSettings.musicVolume), 0, 1);
  nextSettings.soundEffectsVolume = clamp(Number(nextSettings.soundEffectsVolume), 0, 1);
  nextSettings.masterSoundEnabled = nextSettings.masterSoundEnabled !== false;
  nextSettings.musicEnabled = nextSettings.musicEnabled !== false;
  nextSettings.soundEffectsEnabled = nextSettings.soundEffectsEnabled !== false;
  nextSettings.hapticsEnabled = nextSettings.hapticsEnabled !== false;
  nextSettings.language = normalizeLanguage(nextSettings.language);

  return nextSettings;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_APP_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [storedSettings, legacySound, legacyVibration] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem('sound'),
          AsyncStorage.getItem('vibration'),
        ]);
        const parsedSettings = storedSettings ? JSON.parse(storedSettings) : null;
        const nextSettings = normalizeSettings({
          ...parsedSettings,
          ...(legacySound !== null ? { masterSoundEnabled: legacySound === 'true' } : null),
          ...(legacyVibration !== null ? { hapticsEnabled: legacyVibration === 'true' } : null),
        });

        if (!cancelled) {
          setSettings(nextSettings);
          setHapticsEnabled(nextSettings.hapticsEnabled);
        }
      } catch (_error) {
        if (!cancelled) {
          setHapticsEnabled(DEFAULT_APP_SETTINGS.hapticsEnabled);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = useCallback((nextSettings) => {
    setHapticsEnabled(nextSettings.hapticsEnabled);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  }, []);

  const updateSettings = useCallback((updater) => {
    setSettings((currentSettings) => {
      const nextSettings = normalizeSettings(
        typeof updater === 'function' ? updater(currentSettings) : updater
      );
      persistSettings(nextSettings);
      return nextSettings;
    });
  }, [persistSettings]);

  const updateSetting = useCallback((key, value) => {
    updateSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }, [updateSettings]);

  const value = useMemo(() => ({
    settings,
    hydrated,
    updateSetting,
    updateSettings,
  }), [hydrated, settings, updateSetting, updateSettings]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
