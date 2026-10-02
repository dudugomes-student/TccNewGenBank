import type { ThemePreference } from '../domain/models';

export const THEME_KEY = 'ngb2:theme';
export const ACCENT_KEY = 'ngb2:accent';

export const accentPreferences = ['green', 'electric-blue', 'violet', 'crimson', 'amber-gold', 'ice-cyan'] as const;
export type AccentPreference = (typeof accentPreferences)[number];
export const resolveTheme = (preference: ThemePreference): 'light' | 'dark' =>
  preference === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : preference;

export const applyTheme = (preference: ThemePreference) => {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(THEME_KEY, preference);
};

export const applyAccent = (accent: AccentPreference) => {
  document.documentElement.dataset.accent = accent;
  localStorage.setItem(ACCENT_KEY, accent);
};

export const getThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
};

export const getAccentPreference = (): AccentPreference => {
  const stored = localStorage.getItem(ACCENT_KEY);
  return accentPreferences.includes(stored as AccentPreference) ? stored as AccentPreference : 'green';
};
