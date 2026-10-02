import { describe, expect, it } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from './models';
import { updateAccountName, updatePreferences } from './account';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);

describe('perfil e preferências', () => {
  it('atualiza nome e saudação derivada', () => {
    const next = updateAccountName(fresh(), '  Vanessa   Silva  ');
    expect(next?.account).toMatchObject({ ownerName: 'Vanessa Silva', firstName: 'Vanessa' });
  });

  it('rejeita nome vazio sem alterar o snapshot', () => {
    expect(updateAccountName(fresh(), ' ')).toBeNull();
  });

  it('preserva preferências funcionais de tema e ocultação', () => {
    const next = updatePreferences(fresh(), { theme: 'dark', concealBalance: true });
    expect(next.preferences).toMatchObject({ theme: 'dark', concealBalance: true });
  });
});
