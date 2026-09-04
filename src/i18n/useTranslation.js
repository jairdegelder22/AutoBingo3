import { useCallback, useMemo } from 'react';
import { useAppSettings } from '../settings/AppSettingsContext';
import { LANGUAGE_OPTIONS, normalizeLanguage, translate } from './languages';

export function useTranslation() {
  const { settings } = useAppSettings();
  const language = normalizeLanguage(settings.language);

  const t = useCallback((key, replacements) => (
    translate(language, key, replacements)
  ), [language]);

  const currentLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.id === language) ?? LANGUAGE_OPTIONS[0],
    [language]
  );

  return {
    language,
    currentLanguage,
    languageOptions: LANGUAGE_OPTIONS,
    t,
  };
}
