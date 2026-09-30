import type { FinancialSnapshot } from '../domain/models';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialRepository } from './financialRepository';

const STORAGE_KEY = 'ngb2:financial-snapshot:v3';
const LEGACY_STORAGE_KEYS = ['ngb2:financial-snapshot:v2', 'ngb2:financial-snapshot:v1'];

export const migrateFinancialSnapshot = (stored: Partial<FinancialSnapshot>): FinancialSnapshot => ({
  ...demoFinancialSnapshot,
  ...stored,
  schemaVersion: 3,
  account: { ...demoFinancialSnapshot.account, ...stored.account },
  balance: { ...demoFinancialSnapshot.balance, ...stored.balance },
  transactions: (stored.transactions ?? demoFinancialSnapshot.transactions).map((transaction) => ({
    ...transaction,
    type: transaction.type ?? (transaction.direction === 'in' ? 'income' : 'purchase'),
    description: transaction.description ?? transaction.title,
  })),
  cards: (stored.cards ?? demoFinancialSnapshot.cards).map((card, index) => ({
    ...(demoFinancialSnapshot.cards[index] ?? demoFinancialSnapshot.cards[0]),
    ...card,
  })),
  notifications: stored.notifications ?? demoFinancialSnapshot.notifications,
  preferences: { ...demoFinancialSnapshot.preferences, ...stored.preferences },
});

export const localFinancialRepository: FinancialRepository = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!stored) return null;
      const migrated = migrateFinancialSnapshot(JSON.parse(stored) as Partial<FinancialSnapshot>);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return null;
    }
  },
  save(snapshot) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // A UI permanece funcional em memória caso o armazenamento seja indisponível.
    }
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
