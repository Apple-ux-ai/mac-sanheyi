import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  getLocale as getCurrentLocale,
  setLocale as setI18nLocale,
  getAvailableLocales
} from '@/i18n';

const LocaleContext = createContext(null);

const ensureLocaleKey = (locales, value) => {
  if (!locales || locales.length === 0) return undefined;
  if (locales.includes(value)) return value;
  return locales[0];
};

export const LocaleProvider = ({ children }) => {
  const availableLocales = useMemo(() => getAvailableLocales(), []);
  const [locale, setLocaleState] = useState(() => ensureLocaleKey(availableLocales, getCurrentLocale()));

  const updateLocale = useCallback(
    (nextLocale) => {
      const finalLocale = ensureLocaleKey(availableLocales, nextLocale);
      if (!finalLocale || finalLocale === locale) return;
      setI18nLocale(finalLocale);
      setLocaleState(finalLocale);
    },
    [availableLocales, locale]
  );

  const cycleLocale = useCallback(() => {
    if (!availableLocales || availableLocales.length <= 1) return;
    setLocaleState((prev) => {
      const currentIndex = Math.max(availableLocales.indexOf(prev), 0);
      const nextIndex = (currentIndex + 1) % availableLocales.length;
      const nextLocale = availableLocales[nextIndex];
      if (nextLocale === prev) return prev;
      setI18nLocale(nextLocale);
      return nextLocale;
    });
  }, [availableLocales]);

  const value = useMemo(
    () => ({
      locale,
      availableLocales,
      setLocale: updateLocale,
      cycleLocale
    }),
    [locale, availableLocales, updateLocale, cycleLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return ctx;
};
