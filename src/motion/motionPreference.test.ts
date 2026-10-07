import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotionPreference, parseMotionPreference, resolveReducedMotion } from './motionPreference';
afterEach(() => vi.unstubAllGlobals());
describe('Prefer?ncia de movimento', () => {
  it.each([
    ['system', false, false], ['system', true, true],
    ['reduced', false, true], ['reduced', true, true],
    ['full', false, false], ['full', true, false],
  ] as const)('%s com redu??o do sistema %s resolve para %s', (preference, systemReduced, expected) => {
    expect(resolveReducedMotion(preference, systemReduced)).toBe(expected);
  });
  it('usa o sistema quando n?o existe uma escolha v?lida', () => {
    expect(parseMotionPreference(null)).toBe('system');
    expect(parseMotionPreference('invalid')).toBe('system');
  });
  it('mant?m a escolha persistida', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'full' });
    expect(getMotionPreference()).toBe('full');
  });
  it('usa o sistema se o armazenamento estiver indispon?vel', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); } });
    expect(getMotionPreference()).toBe('system');
  });
});
