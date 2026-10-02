import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCENT_KEY, applyAccent, applyTheme, resolveTheme, THEME_KEY } from './theme';

afterEach(() => vi.unstubAllGlobals());

describe('Theme Engine', () => {
  it('resolve sistema conforme a preferência do dispositivo', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: true })) });
    expect(resolveTheme('system')).toBe('dark');
  });

  it('aplica o acento sem alterar a preferência de luminosidade', () => {
    const setItem = vi.fn();
    const documentElement = { dataset: { theme: 'dark' } as Record<string, string> };
    vi.stubGlobal('document', { documentElement });
    vi.stubGlobal('localStorage', { setItem });
    applyAccent('violet');
    expect(documentElement.dataset).toMatchObject({ theme: 'dark', accent: 'violet' });
    expect(setItem).toHaveBeenCalledWith(ACCENT_KEY, 'violet');
  });
  it('aplica e persiste uma preferência explícita', () => {
    const setItem = vi.fn();
    const documentElement = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: false })) });
    vi.stubGlobal('document', { documentElement });
    vi.stubGlobal('localStorage', { setItem });
    applyTheme('light');
    expect(documentElement.dataset).toMatchObject({ theme: 'light', themePreference: 'light' });
    expect(setItem).toHaveBeenCalledWith(THEME_KEY, 'light');
  });

});
