import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateFinancialSnapshot, localFinancialRepository } from './localFinancialRepository';

const memory = new Map<string, string>();
const storage = {
  getItem: vi.fn((key: string) => memory.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { memory.set(key, value); }),
  removeItem: vi.fn((key: string) => { memory.delete(key); }),
};

afterEach(() => {
  memory.clear();
  vi.restoreAllMocks();
});

describe('migração e persistência financeira v5', () => {
  it('migra snapshot anterior preservando saldo, histórico e notificação', () => {
    const migrated = migrateFinancialSnapshot({
      schemaVersion: 4,
      balance: { available: 321.45, previousMonth: 300, currency: 'BRL', updatedAt: '2026-09-30T10:00:00-03:00' },
      transactions: [],
      notifications: [{ id: 'legacy', title: 'Pix enviado', body: 'Anterior', createdAt: '2026-09-30T10:00:00-03:00', read: false, transactionId: 'old-tx' }],
    } as never);
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.balance.available).toBe(321.45);
    expect(migrated.charges).toEqual([]);
    expect(migrated.notifications[0]).toMatchObject({ id: 'legacy', type: 'pix', targetPath: '/movimentos/old-tx' });
  });

  it('salva e recarrega cobranças e preferências no schema atual', () => {
    vi.stubGlobal('localStorage', storage);
    const migrated = migrateFinancialSnapshot({ preferences: { theme: 'dark', concealBalance: true, reduceMotion: false } });
    localFinancialRepository.save(migrated);
    expect(localFinancialRepository.load()).toMatchObject({ schemaVersion: 5, preferences: { theme: 'dark', concealBalance: true } });
  });
});
