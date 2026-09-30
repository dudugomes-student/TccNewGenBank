import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import { demoPixRecipients } from '../data/pixRecipients';
import { localFinancialRepository, migrateFinancialSnapshot } from '../persistence/localFinancialRepository';
import type { FinancialSnapshot } from './models';
import { executePix, findPixRecipient, validatePixAmount } from './pix';

const recipient = demoPixRecipients[0];
const unavailableRecipient = demoPixRecipients.find((item) => !item.available)!;
const at = '2026-09-29T14:30:00-03:00';
const freshSnapshot = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);
const command = (amount = 250, operationId = 'operation-001') => ({ operationId, recipient, amount, createdAt: at });

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('Pix financial transaction', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()));

  it('reconhece uma chave centralizada e executa um Pix válido', () => {
    expect(findPixRecipient(' GABRIEL@DEMO.NGB ', demoPixRecipients)).toEqual(recipient);
    const result = executePix(freshSnapshot(), command());
    expect(result.ok).toBe(true);
  });

  it('reduz o saldo exatamente uma vez', () => {
    const initial = freshSnapshot();
    const result = executePix(initial, command());
    if (!result.ok) throw new Error(result.message);
    expect(result.snapshot.balance.available).toBe(initial.balance.available - 250);
    expect(initial.balance.available).toBe(demoFinancialSnapshot.balance.available);
  });

  it('rejeita saldo insuficiente sem alterar o snapshot', () => {
    const initial = freshSnapshot();
    initial.account.pixDailyLimit = 50000;
    const result = executePix(initial, command(initial.balance.available + 1));
    expect(result).toMatchObject({ ok: false, code: 'insufficient-balance' });
    expect(initial.transactions).toHaveLength(demoFinancialSnapshot.transactions.length);
  });

  it('rejeita valor acima do limite Pix', () => {
    const result = validatePixAmount(demoFinancialSnapshot.account.pixDailyLimit + 1, freshSnapshot());
    expect(result).toMatchObject({ ok: false, code: 'limit-exceeded' });
  });

  it('cria lançamento completo no ledger e uma notificação correlacionada', () => {
    const initial = freshSnapshot();
    const result = executePix(initial, command());
    if (!result.ok) throw new Error(result.message);
    expect(result.transaction).toMatchObject({
      operationId: 'operation-001', type: 'pix', direction: 'out', amount: 250,
      status: 'completed', recipient: recipient.name, institution: recipient.institution,
      maskedKey: recipient.maskedKey,
    });
    expect(result.snapshot.transactions[0]).toEqual(result.transaction);
    expect(result.snapshot.notifications[0]).toMatchObject({ transactionId: result.transaction.id, read: false });
  });

  it('impede confirmação duplicada pelo identificador idempotente', () => {
    const first = executePix(freshSnapshot(), command());
    if (!first.ok) throw new Error(first.message);
    const duplicate = executePix(first.snapshot, command());
    expect(duplicate).toMatchObject({ ok: false, code: 'duplicate' });
    expect(first.snapshot.transactions.filter((item) => item.operationId === 'operation-001')).toHaveLength(1);
  });

  it('falha antes da conclusão quando o destinatário está indisponível', () => {
    const initial = freshSnapshot();
    const result = executePix(initial, { ...command(), recipient: unavailableRecipient });
    expect(result).toMatchObject({ ok: false, code: 'recipient-unavailable' });
    expect(initial.balance.available).toBe(demoFinancialSnapshot.balance.available);
  });

  it('persiste a transação e a recupera após uma nova leitura', () => {
    const result = executePix(freshSnapshot(), command());
    if (!result.ok) throw new Error(result.message);
    localFinancialRepository.save(result.snapshot);
    const reloaded = localFinancialRepository.load();
    expect(reloaded?.balance.available).toBe(demoFinancialSnapshot.balance.available - 250);
    expect(reloaded?.transactions[0].operationId).toBe('operation-001');
  });

  it('migra snapshots anteriores mantendo dados e adicionando o schema atual', () => {
    const legacy = freshSnapshot();
    const legacyTransaction = { ...legacy.transactions[0], type: undefined, description: undefined };
    const migrated = migrateFinancialSnapshot({ ...legacy, schemaVersion: undefined, transactions: [legacyTransaction] } as unknown as Partial<FinancialSnapshot>);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.transactions[0]).toMatchObject({ type: 'income', description: legacyTransaction.title });
  });
});
