import type { ThemePreference } from '../domain/models';

export const THEME_KEY = 'ngb2:theme';

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

export const getThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
};
