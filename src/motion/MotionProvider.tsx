import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { getMotionPreference, MOTION_KEY, resolveReducedMotion, type MotionPreference } from './motionPreference';

interface MotionContextValue {
  preference: MotionPreference;
  setPreference: (preference: MotionPreference) => void;
  systemReducedMotion: boolean;
  reducedMotion: boolean;
}
const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(getMotionPreference);
  const [systemReducedMotion, setSystemReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reducedMotion = resolveReducedMotion(preference, systemReducedMotion);

  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setSystemReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useLayoutEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  const value = useMemo(() => ({
    preference, systemReducedMotion, reducedMotion,
    setPreference: (next: MotionPreference) => {
      try { localStorage.setItem(MOTION_KEY, next); } catch {}
      setPreferenceState(next);
    },
  }), [preference, systemReducedMotion, reducedMotion]);
  return <MotionContext.Provider value={value}>
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>{children}</MotionConfig>
  </MotionContext.Provider>;
}
export function useMotionPreference() {
  const context = useContext(MotionContext);
  if (!context) throw new Error('useMotionPreference requer MotionProvider.');
  return context;
}
export const useSiteReducedMotion = () => useMotionPreference().reducedMotion;
