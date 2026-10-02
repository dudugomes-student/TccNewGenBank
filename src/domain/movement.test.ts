import { describe, expect, it } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import { demoPixRecipients } from '../data/pixRecipients';
import { migrateFinancialSnapshot } from '../persistence/localFinancialRepository';
import type { FinancialSnapshot } from './models';
import {
  aggregateMonth,
  availableTransactionMonths,
  compareMonth,
  deriveBalanceHistory,
  deriveMonthlyClosingBalances,
  filterTransactions,
  findRecurringMovements,
  percentageChange,
} from './movement';
import { executePix } from './pix';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);

describe('movement and monthly understanding', () => {
  it('agrega o mês a partir do ledger', () => {
    const summary = aggregateMonth(fresh().transactions, '2026-09');
    expect(summary).toMatchObject({ monthKey: '2026-09', transactionCount: 14, movement: 9029.7 });
  });

  it('soma as entradas mensais', () => {
    expect(aggregateMonth(fresh().transactions, '2026-09').incoming).toBe(4950);
  });

  it('soma as saídas mensais', () => {
    expect(aggregateMonth(fresh().transactions, '2026-09').outgoing).toBe(4079.7);
  });

  it('calcula o resultado líquido mensal', () => {
    expect(aggregateMonth(fresh().transactions, '2026-09').net).toBe(870.3);
  });

  it('agrupa gastos por categoria e identifica a predominante', () => {
    const summary = aggregateMonth(fresh().transactions, '2026-09');
    expect(summary.leadingCategory).toMatchObject({ category: 'Casa', amount: 1918.3 });
    expect(summary.categories.reduce((total, item) => total + item.amount, 0)).toBeCloseTo(summary.outgoing);
  });

  it('compara com o mês imediatamente anterior', () => {
    const comparison = compareMonth(fresh().transactions, '2026-09');
    expect(comparison.previous).toMatchObject({ monthKey: '2026-08', incoming: 4550, outgoing: 4039.8, net: 510.2 });
    expect(comparison.incomingPercent).toBeCloseTo(8.79, 1);
    expect(comparison.outgoingPercent).toBeCloseTo(0.99, 1);
  });

  it('trata divisão por zero e ausência de base sem Infinity ou NaN', () => {
    expect(percentageChange(100, 0)).toBeNull();
    expect(percentageChange(0, 0)).toBe(0);
    expect(compareMonth(fresh().transactions, '2026-05').previous).toBeNull();
  });

  it('detecta recorrência somente com evidência em meses distintos', () => {
    const recurring = findRecurringMovements(fresh().transactions);
    expect(recurring.find((item) => item.label === 'Salário')).toMatchObject({ occurrences: 5, averageAmount: 4200 });
    expect(recurring.find((item) => item.label === 'Aluguel')).toMatchObject({ occurrences: 5, category: 'Casa' });
    expect(recurring.some((item) => item.label === 'Pix recebido de Marina')).toBe(false);
  });

  it('deriva o saldo histórico e termina no saldo atual', () => {
    const snapshot = fresh();
    const history = deriveBalanceHistory(snapshot.transactions, snapshot.balance.available);
    expect(history[0]).toMatchObject({ transactionId: 'hist-2026-05-pix', balance: 10050 });
    expect(history.at(-1)?.balance).toBe(snapshot.balance.available);
  });

  it('fecha cada mês com matemática historicamente consistente', () => {
    const snapshot = fresh();
    expect(deriveMonthlyClosingBalances(snapshot.transactions, snapshot.balance.available)).toEqual([
      { monthKey: '2026-05', balance: 10200 },
      { monthKey: '2026-06', balance: 10750 },
      { monthKey: '2026-07', balance: 11100 },
      { monthKey: '2026-08', balance: 11610.2 },
      { monthKey: '2026-09', balance: 12480.5 },
    ]);
  });

  it('filtra por período, direção e categoria', () => {
    const filtered = filterTransactions(fresh().transactions, {
      query: '', month: '2026-09', direction: 'out', category: 'Casa',
    });
    expect(filtered.map((item) => item.title)).toEqual(['Internet residencial', 'Conta de energia', 'Aluguel']);
  });

  it('busca em descrição e contraparte ignorando acentos e caixa', () => {
    const byDescription = filterTransactions(fresh().transactions, {
      query: 'credito mensal', month: 'all', direction: 'all', category: 'all',
    });
    const byCounterpart = filterTransactions(fresh().transactions, {
      query: 'marina costa', month: 'all', direction: 'all', category: 'all',
    });
    expect(byDescription).toHaveLength(5);
    expect(byCounterpart).toHaveLength(4);
  });

  it('faz um novo Pix aparecer automaticamente em Movimento', () => {
    const result = executePix(fresh(), {
      operationId: 'phase-six-pix', recipient: demoPixRecipients[0], amount: 250, createdAt: '2026-09-30T12:00:00-03:00',
    });
    if (!result.ok) throw new Error(result.message);
    const movement = filterTransactions(result.snapshot.transactions, {
      query: 'Gabriel Martins', month: '2026-09', direction: 'out', category: 'Transferências',
    });
    expect(movement).toHaveLength(1);
    expect(movement[0].operationId).toBe('phase-six-pix');
  });

  it('reflete o novo Pix na leitura de Seu Mês', () => {
    const before = aggregateMonth(fresh().transactions, '2026-09');
    const result = executePix(fresh(), {
      operationId: 'phase-six-month', recipient: demoPixRecipients[0], amount: 250, createdAt: '2026-09-30T12:00:00-03:00',
    });
    if (!result.ok) throw new Error(result.message);
    const after = aggregateMonth(result.snapshot.transactions, '2026-09');
    expect(after.outgoing).toBe(before.outgoing + 250);
    expect(after.net).toBe(before.net - 250);
  });

  it('migra schema anterior, preserva Pix e injeta o histórico sem duplicar', () => {
    const legacy = fresh();
    legacy.transactions = legacy.transactions.filter((item) => !item.id.startsWith('hist-'));
    const pix = executePix(legacy, {
      operationId: 'preserve-on-v4', recipient: demoPixRecipients[0], amount: 80, createdAt: '2026-09-30T13:00:00-03:00',
    });
    if (!pix.ok) throw new Error(pix.message);
    const migrated = migrateFinancialSnapshot({ ...pix.snapshot, schemaVersion: 3 });
    const migratedAgain = migrateFinancialSnapshot(migrated);
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.transactions.some((item) => item.operationId === 'preserve-on-v4')).toBe(true);
    expect(availableTransactionMonths(migrated.transactions)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    expect(new Set(migratedAgain.transactions.map((item) => item.id)).size).toBe(migratedAgain.transactions.length);
  });
});
