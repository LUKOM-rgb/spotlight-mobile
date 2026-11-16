import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkPalette, lightPalette, ThemePalette } from '../theme/colors';

const DARK_MODE_STORAGE_KEY = '@spotlight_dark_mode';

interface ThemeContextValue {
  isDark: boolean;
  palette: ThemePalette;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(DARK_MODE_STORAGE_KEY)
      .then((stored) => {
        if (mounted && stored !== null) {
          setIsDark(stored === '1');
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setDarkMode = (value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, value ? '1' : '0').catch(() => undefined);
  };

  const toggleTheme = () => {
    setDarkMode(!isDark);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      palette: isDark ? darkPalette : lightPalette,
      toggleTheme,
      setDarkMode,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
