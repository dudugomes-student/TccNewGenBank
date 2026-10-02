import { describe, expect, it } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from './models';
import { aggregateMonth, deriveBalanceHistory } from './movement';
import { createDemoCharge, markDemoChargeShared, simulateDemoChargeReceived } from './receiving';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);
const createdAt = '2026-09-30T16:00:00-03:00';

describe('cobrança demo e recebimento', () => {
  it('cria cobrança persistível com valor e código explicitamente demo', () => {
    const result = createDemoCharge(fresh(), { chargeId: 'charge-1', amount: 125.567, description: 'Jantar', createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.charge.amount).toBe(125.57);
    expect(result.charge.code).toContain('NGB.DEMO.PIX');
    expect(result.snapshot.charges[0]).toEqual(result.charge);
  });

  it('permite cobrança com valor opcional', () => {
    const result = createDemoCharge(fresh(), { chargeId: 'charge-open', createdAt });
    expect(result.ok && result.charge.amount).toBeUndefined();
  });

  it('marca cobrança como compartilhada sem alterar saldo', () => {
    const initial = fresh();
    const created = createDemoCharge(initial, { chargeId: 'charge-2', amount: 80, createdAt });
    if (!created.ok) throw new Error('Falha ao preparar cobrança.');
    const shared = markDemoChargeShared(created.snapshot, 'charge-2');
    expect(shared.ok && shared.charge.status).toBe('shared');
    expect(shared.ok && shared.snapshot.balance.available).toBe(initial.balance.available);
  });

  it('simula recebimento e aumenta o saldo exatamente pelo valor', () => {
    const initial = fresh();
    const initialMonth = aggregateMonth(initial.transactions, '2026-09');
    const created = createDemoCharge(initial, { chargeId: 'charge-3', amount: 199.9, createdAt });
    if (!created.ok) throw new Error('Falha ao preparar cobrança.');
    const received = simulateDemoChargeReceived(created.snapshot, { chargeId: 'charge-3', operationId: 'receive-op-1', amount: 199.9, createdAt });
    expect(received.ok).toBe(true);
    if (!received.ok) return;
    expect(received.snapshot.balance.available).toBe(initial.balance.available + 199.9);
    expect(received.transaction.direction).toBe('in');
    expect(received.transaction.type).toBe('receipt');
    expect(aggregateMonth(received.snapshot.transactions, '2026-09').incoming).toBe(initialMonth.incoming + 199.9);
    expect(deriveBalanceHistory(received.snapshot.transactions, received.snapshot.balance.available).at(-1)?.balance).toBe(received.snapshot.balance.available);
  });

  it('inclui a entrada no ledger e cria notificação rastreável', () => {
    const created = createDemoCharge(fresh(), { chargeId: 'charge-4', amount: 50, createdAt });
    if (!created.ok) throw new Error('Falha ao preparar cobrança.');
    const received = simulateDemoChargeReceived(created.snapshot, { chargeId: 'charge-4', operationId: 'receive-op-2', amount: 50, createdAt });
    if (!received.ok) throw new Error('Falha ao receber cobrança.');
    expect(received.snapshot.transactions[0].id).toBe(received.transaction.id);
    expect(received.snapshot.notifications[0]).toMatchObject({ type: 'receipt', read: false, transactionId: received.transaction.id, targetPath: `/movimentos/${received.transaction.id}` });
  });

  it('impede recebimento duplicado mesmo com nova tentativa', () => {
    const created = createDemoCharge(fresh(), { chargeId: 'charge-5', amount: 50, createdAt });
    if (!created.ok) throw new Error('Falha ao preparar cobrança.');
    const received = simulateDemoChargeReceived(created.snapshot, { chargeId: 'charge-5', operationId: 'receive-op-3', amount: 50, createdAt });
    if (!received.ok) throw new Error('Falha ao receber cobrança.');
    const duplicate = simulateDemoChargeReceived(received.snapshot, { chargeId: 'charge-5', operationId: 'receive-op-4', amount: 50, createdAt });
    expect(duplicate).toMatchObject({ ok: false, code: 'already-received' });
    expect(received.snapshot.transactions.filter((item) => item.chargeId === 'charge-5')).toHaveLength(1);
  });

  it('exige valor ao simular o recebimento de cobrança aberta', () => {
    const created = createDemoCharge(fresh(), { chargeId: 'charge-6', createdAt });
    if (!created.ok) throw new Error('Falha ao preparar cobrança.');
    expect(simulateDemoChargeReceived(created.snapshot, { chargeId: 'charge-6', operationId: 'receive-op-5', amount: 0, createdAt })).toMatchObject({ ok: false, code: 'invalid-amount' });
  });
});
