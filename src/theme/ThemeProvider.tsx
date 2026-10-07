import { useSiteReducedMotion } from '../motion/MotionProvider';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ThemePreference } from '../domain/models';
import { applyAccent, applyTheme, getAccentPreference, getThemePreference, type AccentPreference } from './theme';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  accent: AccentPreference;
  setAccent: (accent: AccentPreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getThemePreference);
  const [accent, setAccentState] = useState<AccentPreference>(getAccentPreference);
  const setPreference = (next: ThemePreference) => { applyTheme(next); setPreferenceState(next); };
  const setAccent = (next: AccentPreference) => { applyAccent(next); setAccentState(next); };
  const reduceMotion = useSiteReducedMotion();

  useEffect(() => {
    applyTheme(preference);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => preference === 'system' && applyTheme('system');
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [preference]);

  const value = useMemo(() => ({ preference, setPreference, accent, setAccent }), [accent, preference]);
  return <ThemeContext.Provider value={value}>
    {children}
    <AnimatePresence initial={false}>
      <motion.div
        key={`${preference}-${accent}`}
        className="theme-lighting-transition"
        aria-hidden="true"
        initial={{ opacity: reduceMotion ? 0 : .18 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : .9, ease: [.2, .72, .18, 1] }}
      />
    </AnimatePresence>
  </ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
