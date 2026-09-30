import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemePreference } from '../domain/models';
import { applyTheme, getThemePreference } from './theme';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getThemePreference);

  useEffect(() => {
    applyTheme(preference);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => preference === 'system' && applyTheme('system');
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [preference]);

  const value = useMemo(() => ({ preference, setPreference: setPreferenceState }), [preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
