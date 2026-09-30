export type MoneyDirection = 'in' | 'out';
export type TransactionStatus = 'completed' | 'scheduled' | 'processing';
export type TransactionType = 'pix' | 'purchase' | 'income' | 'service';
export type PixKeyType = 'cpf' | 'phone' | 'email' | 'random';

export interface Account {
  id: string;
  ownerName: string;
  firstName: string;
  branch: string;
  number: string;
  institution: string;
  pixDailyLimit: number;
}

export interface Balance {
  available: number;
  previousMonth: number;
  currency: 'BRL';
  updatedAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  occurredAt: string;
  amount: number;
  direction: MoneyDirection;
  status: TransactionStatus;
  type: TransactionType;
  description: string;
  operationId?: string;
  recipient?: string;
  institution?: string;
  maskedKey?: string;
  origin?: string;
  cardId?: string;
}

export type CardQualityTier = 'lite' | 'essential';

export interface BankCard {
  id: string;
  label: string;
  lastFour: string;
  holderName: string;
  expiresAt: string;
  network: string;
  virtualNumber: string;
  virtualCvv: string;
  limitTotal: number;
  limitAllocated: number;
  status: 'active' | 'locked';
  invoiceClosingDay: number;
  invoiceDueDay: number;
  contactlessEnabled: boolean;
  onlinePurchasesEnabled: boolean;
  virtualCardEnabled: boolean;
  qualityTier: CardQualityTier;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  transactionId?: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Preferences {
  theme: ThemePreference;
  concealBalance: boolean;
  reduceMotion: boolean;
}

export interface FinancialSnapshot {
  schemaVersion: 3;
  account: Account;
  balance: Balance;
  transactions: Transaction[];
  cards: BankCard[];
  notifications: Notification[];
  preferences: Preferences;
}

export interface PixRecipient {
  id: string;
  name: string;
  key: string;
  keyType: PixKeyType;
  maskedKey: string;
  institution: string;
  taxIdSuffix: string;
  available: boolean;
}
