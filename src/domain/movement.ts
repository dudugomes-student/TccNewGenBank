import type { MoneyDirection, Transaction } from './models';

export type LedgerDirectionFilter = 'all' | MoneyDirection;

export interface LedgerFilters {
  query: string;
  month: 'all' | string;
  direction: LedgerDirectionFilter;
  category: 'all' | string;
}

export interface CategoryTotal {
  category: string;
  amount: number;
  share: number;
}

export interface MonthSummary {
  monthKey: string;
  incoming: number;
  outgoing: number;
  net: number;
  movement: number;
  transactionCount: number;
  categories: CategoryTotal[];
  leadingCategory: CategoryTotal | null;
}

export interface MonthComparison {
  current: MonthSummary;
  previous: MonthSummary | null;
  incomingPercent: number | null;
  outgoingPercent: number | null;
  netPercent: number | null;
  categoryPercent: Record<string, number | null>;
}

export interface BalancePoint {
  transactionId: string;
  occurredAt: string;
  balance: number;
}

export interface MonthlyBalancePoint {
  monthKey: string;
  balance: number;
}

export interface RecurringMovement {
  key: string;
  label: string;
  category: string;
  direction: MoneyDirection;
  averageAmount: number;
  occurrences: number;
  months: string[];
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const transactionMonthKey = (transaction: Transaction) => transaction.occurredAt.slice(0, 7);

export const previousMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const availableTransactionMonths = (transactions: Transaction[]) =>
  [...new Set(transactions.map(transactionMonthKey))].sort();

const normalizeText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/\s+/g, ' ')
  .trim();

export const filterTransactions = (transactions: Transaction[], filters: LedgerFilters) => {
  const query = normalizeText(filters.query);

  return [...transactions]
    .filter((transaction) => filters.month === 'all' || transactionMonthKey(transaction) === filters.month)
    .filter((transaction) => filters.direction === 'all' || transaction.direction === filters.direction)
    .filter((transaction) => filters.category === 'all' || transaction.category === filters.category)
    .filter((transaction) => {
      if (!query) return true;
      const searchable = [
        transaction.title,
        transaction.description,
        transaction.category,
        transaction.recipient,
        transaction.institution,
        transaction.origin,
      ].filter(Boolean).join(' ');
      return normalizeText(searchable).includes(query);
    })
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
};

export const groupTransactionsByDate = (transactions: Transaction[]) => {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((transaction) => {
    const dateKey = transaction.occurredAt.slice(0, 10);
    groups.set(dateKey, [...(groups.get(dateKey) ?? []), transaction]);
  });
  return [...groups].map(([dateKey, items]) => ({ dateKey, transactions: items }));
};

export const aggregateMonth = (transactions: Transaction[], monthKey: string): MonthSummary => {
  const completed = transactions.filter((transaction) =>
    transaction.status === 'completed' && transactionMonthKey(transaction) === monthKey,
  );
  const incoming = completed
    .filter((transaction) => transaction.direction === 'in')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const outgoingTransactions = completed.filter((transaction) => transaction.direction === 'out');
  const outgoing = outgoingTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const categoryAmounts = outgoingTransactions.reduce<Record<string, number>>((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
    return totals;
  }, {});
  const categories = Object.entries(categoryAmounts)
    .map(([category, amount]) => ({
      category,
      amount: roundMoney(amount),
      share: outgoing === 0 ? 0 : amount / outgoing,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthKey,
    incoming: roundMoney(incoming),
    outgoing: roundMoney(outgoing),
    net: roundMoney(incoming - outgoing),
    movement: roundMoney(incoming + outgoing),
    transactionCount: completed.length,
    categories,
    leadingCategory: categories[0] ?? null,
  };
};

export const percentageChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export const compareMonth = (transactions: Transaction[], monthKey: string): MonthComparison => {
  const current = aggregateMonth(transactions, monthKey);
  const priorKey = previousMonthKey(monthKey);
  const hasPrevious = transactions.some((transaction) => transactionMonthKey(transaction) === priorKey);
  const previous = hasPrevious ? aggregateMonth(transactions, priorKey) : null;
  const categoryPercent = Object.fromEntries(current.categories.map(({ category, amount }) => {
    const priorAmount = previous?.categories.find((item) => item.category === category)?.amount ?? 0;
    return [category, previous ? percentageChange(amount, priorAmount) : null];
  }));

  return {
    current,
    previous,
    incomingPercent: previous ? percentageChange(current.incoming, previous.incoming) : null,
    outgoingPercent: previous ? percentageChange(current.outgoing, previous.outgoing) : null,
    netPercent: previous ? percentageChange(current.net, previous.net) : null,
    categoryPercent,
  };
};

export const deriveBalanceHistory = (transactions: Transaction[], currentBalance: number): BalancePoint[] => {
  const completed = transactions
    .filter((transaction) => transaction.status === 'completed')
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  const netMovement = completed.reduce((total, transaction) =>
    total + (transaction.direction === 'in' ? transaction.amount : -transaction.amount), 0);
  let balance = roundMoney(currentBalance - netMovement);

  return completed.map((transaction) => {
    balance = roundMoney(balance + (transaction.direction === 'in' ? transaction.amount : -transaction.amount));
    return { transactionId: transaction.id, occurredAt: transaction.occurredAt, balance };
  });
};

export const deriveMonthlyClosingBalances = (transactions: Transaction[], currentBalance: number) => {
  const closingByMonth = new Map<string, MonthlyBalancePoint>();
  deriveBalanceHistory(transactions, currentBalance).forEach((point) => {
    const monthKey = point.occurredAt.slice(0, 7);
    closingByMonth.set(monthKey, { monthKey, balance: point.balance });
  });
  return [...closingByMonth.values()];
};

export const findRecurringMovements = (transactions: Transaction[], minimumMonths = 3): RecurringMovement[] => {
  const groups = new Map<string, Transaction[]>();
  transactions
    .filter((transaction) => transaction.status === 'completed')
    .forEach((transaction) => {
      const counterpart = transaction.recipient ? normalizeText(transaction.recipient) : '';
      const key = [normalizeText(transaction.title), counterpart, normalizeText(transaction.category), transaction.direction].join('|');
      groups.set(key, [...(groups.get(key) ?? []), transaction]);
    });

  return [...groups.entries()].flatMap(([key, items]) => {
    const months = [...new Set(items.map(transactionMonthKey))].sort();
    if (months.length < minimumMonths) return [];
    const averageAmount = items.reduce((total, item) => total + item.amount, 0) / items.length;
    const spread = Math.max(...items.map((item) => item.amount)) - Math.min(...items.map((item) => item.amount));
    if (averageAmount > 0 && spread / averageAmount > 0.15) return [];
    const latest = [...items].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0];
    return [{
      key,
      label: latest.title,
      category: latest.category,
      direction: latest.direction,
      averageAmount: roundMoney(averageAmount),
      occurrences: items.length,
      months,
    }];
  }).sort((a, b) => b.occurrences - a.occurrences || b.averageAmount - a.averageAmount);
};
