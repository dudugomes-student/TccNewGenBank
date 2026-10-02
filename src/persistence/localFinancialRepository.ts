import type { BankCard, FinancialSnapshot, Notification, NotificationType, Transaction } from '../domain/models';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialRepository } from './financialRepository';

const STORAGE_KEY = 'ngb2:financial-snapshot:v5';
const LEGACY_STORAGE_KEYS = ['ngb2:financial-snapshot:v4', 'ngb2:financial-snapshot:v3', 'ngb2:financial-snapshot:v2', 'ngb2:financial-snapshot:v1'];

type StoredFinancialSnapshot = Partial<Omit<FinancialSnapshot, 'schemaVersion'>> & { schemaVersion?: number };

const categoryAliases: Record<string, string> = {
  Receita: 'Receitas',
  Transferência: 'Transferências',
  Serviços: 'Outros',
};

const migrateTransaction = (transaction: Transaction): Transaction => ({
  ...transaction,
  category: categoryAliases[transaction.category] ?? transaction.category,
  type: transaction.type ?? (transaction.direction === 'in' ? 'income' : 'purchase'),
  description: transaction.description ?? transaction.title,
});

const mergeDemoHistory = (transactions: Transaction[]) => {
  const ids = new Set(transactions.map((transaction) => transaction.id));
  const historicalDemo = demoFinancialSnapshot.transactions.filter((transaction) => transaction.id.startsWith('hist-'));
  return [...transactions, ...historicalDemo.filter((transaction) => !ids.has(transaction.id))]
    .map(migrateTransaction)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
};

const inferNotificationType = (notification: Partial<Notification>): NotificationType => {
  const title = notification.title?.toLocaleLowerCase('pt-BR') ?? '';
  if (title.includes('cartão') || title.includes('aproximação') || title.includes('online')) return 'card';
  if (title.includes('pagamento')) return 'payment';
  if (title.includes('pix')) return 'pix';
  if (title.includes('recebid') || title.includes('cobrança')) return 'receipt';
  return 'pix';
};

const migrateNotification = (notification: Partial<Notification> & Pick<Notification, 'id' | 'title' | 'body' | 'createdAt' | 'read'>): Notification => ({
  ...notification,
  type: notification.type ?? inferNotificationType(notification),
  targetPath: notification.targetPath ?? (notification.transactionId ? `/movimentos/${notification.transactionId}` : undefined),
});

export const migrateFinancialSnapshot = (stored: StoredFinancialSnapshot): FinancialSnapshot => ({
  ...demoFinancialSnapshot,
  ...stored,
  schemaVersion: 5,
  account: { ...demoFinancialSnapshot.account, ...stored.account },
  balance: { ...demoFinancialSnapshot.balance, ...stored.balance },
  transactions: mergeDemoHistory(stored.transactions ?? demoFinancialSnapshot.transactions),
  cards: (stored.cards ?? demoFinancialSnapshot.cards).map((card, index) => {
    const { qualityTier: _legacyQualityTier, ...compatibleCard } = card as Partial<BankCard> & { qualityTier?: unknown };
    return {
      ...(demoFinancialSnapshot.cards[index] ?? demoFinancialSnapshot.cards[0]),
      ...compatibleCard,
    };
  }),
  notifications: (stored.notifications ?? demoFinancialSnapshot.notifications).map((notification) => migrateNotification(notification)),
  charges: stored.charges ?? [],
  preferences: { ...demoFinancialSnapshot.preferences, ...stored.preferences },
});

export const localFinancialRepository: FinancialRepository = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!stored) return null;
      const migrated = migrateFinancialSnapshot(JSON.parse(stored) as StoredFinancialSnapshot);
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
    [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach((key) => localStorage.removeItem(key));
  },
};
