import { describe, expect, it } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import { calculatePercentageChange, formatMoney } from './formatters';
import { recentTransactions, sumTransactions } from './selectors';

describe('financial domain', () => {
  it('calcula entradas e saídas a partir da mesma fonte de dados', () => {
    const recentDemo = demoFinancialSnapshot.transactions.slice(0, 5);
    expect(sumTransactions(recentDemo, 'in')).toBe(750);
    expect(sumTransactions(recentDemo, 'out')).toBeCloseTo(736.3);
  });

  it('ordena o ledger do evento mais recente ao mais antigo', () => {
    const result = recentTransactions([...demoFinancialSnapshot.transactions].reverse(), 2);
    expect(result.map((item) => item.id)).toEqual(['tx-01', 'tx-02']);
  });

  it('mantém moeda e variação como cálculos de domínio previsíveis', () => {
    expect(formatMoney(12480.5)).toContain('12.480,50');
    expect(calculatePercentageChange(120, 100)).toBe(20);
    expect(calculatePercentageChange(120, 0)).toBe(0);
  });
});
