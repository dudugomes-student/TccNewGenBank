import type { Transaction } from './models';

export const sumTransactions = (transactions: Transaction[], direction: 'in' | 'out') =>
  transactions
    .filter((transaction) => transaction.direction === direction)
    .reduce((total, transaction) => total + transaction.amount, 0);

export const recentTransactions = (transactions: Transaction[], limit = 5) =>
  [...transactions]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);
