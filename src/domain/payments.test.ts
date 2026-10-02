import { describe, expect, it } from 'vitest';
import { demoBills, findDemoBill } from '../data/demoBills';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from './models';
import { aggregateMonth, deriveBalanceHistory } from './movement';
import { executePayment, validateDemoBill } from './payments';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);
const bill = demoBills[0];
const createdAt = '2026-09-30T17:00:00-03:00';

describe('pagamento de cobrança demo', () => {
  it('identifica uma referência demo válida com dados para revisão', () => {
    expect(findDemoBill(bill.reference.toLowerCase())).toEqual(bill);
    expect(validateDemoBill(bill)).toBeNull();
  });

  it('recusa referência fora do catálogo demo', () => {
    expect(findDemoBill('boleto-real-inexistente')).toBeNull();
  });

  it('diminui o saldo exatamente pelo valor confirmado', () => {
    const initial = fresh();
    const initialMonth = aggregateMonth(initial.transactions, '2026-09');
    const result = executePayment(initial, { operationId: 'payment-op-1', bill, createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.balance.available).toBe(initial.balance.available - bill.amount);
    expect(aggregateMonth(result.snapshot.transactions, '2026-09').outgoing).toBe(initialMonth.outgoing + bill.amount);
    expect(deriveBalanceHistory(result.snapshot.transactions, result.snapshot.balance.available).at(-1)?.balance).toBe(result.snapshot.balance.available);
  });

  it('registra saída no ledger, notificação e dados do comprovante', () => {
    const result = executePayment(fresh(), { operationId: 'payment-op-2', bill, createdAt });
    if (!result.ok) throw new Error('Falha ao pagar cobrança.');
    expect(result.transaction).toMatchObject({ type: 'payment', direction: 'out', billingId: bill.id, reference: bill.reference, dueDate: bill.dueDate, recipient: bill.beneficiary });
    expect(result.snapshot.transactions[0]).toEqual(result.transaction);
    expect(result.snapshot.notifications[0]).toMatchObject({ type: 'payment', transactionId: result.transaction.id, targetPath: `/movimentos/${result.transaction.id}` });
  });

  it('impede pagamento quando o saldo é insuficiente', () => {
    const snapshot = fresh();
    snapshot.balance.available = bill.amount - 0.01;
    expect(executePayment(snapshot, { operationId: 'payment-op-3', bill, createdAt })).toMatchObject({ ok: false, code: 'insufficient-balance' });
  });

  it('é idempotente por operação e por cobrança', () => {
    const paid = executePayment(fresh(), { operationId: 'payment-op-4', bill, createdAt });
    if (!paid.ok) throw new Error('Falha ao pagar cobrança.');
    expect(executePayment(paid.snapshot, { operationId: 'payment-op-4', bill, createdAt })).toMatchObject({ ok: false, code: 'duplicate' });
    expect(executePayment(paid.snapshot, { operationId: 'payment-op-5', bill, createdAt })).toMatchObject({ ok: false, code: 'duplicate' });
    expect(paid.snapshot.transactions.filter((item) => item.billingId === bill.id)).toHaveLength(1);
  });
});
