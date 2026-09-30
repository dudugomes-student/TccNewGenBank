import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import { localFinancialRepository, migrateFinancialSnapshot } from '../persistence/localFinancialRepository';
import type { FinancialSnapshot } from './models';
import { canUseVirtualCard, cardInvoiceAmount, cardLimitAvailable, cardLimitUsed, cardPurchases, executeCardCommand } from './cards';
import { executePix } from './pix';
import { demoPixRecipients } from '../data/pixRecipients';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);
const cardId = demoFinancialSnapshot.cards[0].id;
const createdAt = '2026-09-29T20:00:00-03:00';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('card system', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()));

  it('bloqueia o cartão e cria uma notificação derivada', () => {
    const result = executeCardCommand(fresh(), { type: 'set-status', cardId, status: 'locked', createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.card.status).toBe('locked');
    expect(result.snapshot.notifications[0]).toMatchObject({ title: 'Cartão bloqueado', read: false });
  });

  it('desbloqueia o mesmo instrumento', () => {
    const locked = fresh();
    locked.cards[0].status = 'locked';
    const result = executeCardCommand(locked, { type: 'set-status', cardId, status: 'active', createdAt });
    expect(result.ok && result.card.status).toBe('active');
  });

  it('mantém o bloqueio após persistir e recarregar', () => {
    const result = executeCardCommand(fresh(), { type: 'set-status', cardId, status: 'locked', createdAt });
    if (!result.ok) throw new Error(result.message);
    localFinancialRepository.save(result.snapshot);
    expect(localFinancialRepository.load()?.cards[0].status).toBe('locked');
  });

  it('deriva fatura, utilizado e disponível das mesmas compras', () => {
    const snapshot = fresh();
    expect(cardInvoiceAmount(snapshot, cardId)).toBeCloseTo(706.4);
    expect(cardLimitUsed(snapshot, cardId)).toBeCloseTo(706.4);
    expect(cardLimitAvailable(snapshot, cardId)).toBeCloseTo(5293.6);
  });

  it('retorna apenas compras relacionadas ao cartão', () => {
    const purchases = cardPurchases(fresh().transactions, cardId);
    expect(purchases.map((item) => item.id)).toEqual(['tx-02', 'tx-05']);
  });

  it('organiza limite sem simular aprovação de crédito', () => {
    const result = executeCardCommand(fresh(), { type: 'set-limit-allocation', cardId, amount: 3000, createdAt });
    expect(result.ok && result.card.limitAllocated).toBe(3000);
  });

  it('não permite limite abaixo do valor utilizado', () => {
    const result = executeCardCommand(fresh(), { type: 'set-limit-allocation', cardId, amount: 500, createdAt });
    expect(result).toMatchObject({ ok: false, code: 'limit-below-used' });
  });

  it('altera aproximação e compras online quando ativo', () => {
    const contactless = executeCardCommand(fresh(), { type: 'set-contactless', cardId, enabled: false, createdAt });
    const online = executeCardCommand(fresh(), { type: 'set-online-purchases', cardId, enabled: false, createdAt });
    expect(contactless.ok && contactless.card.contactlessEnabled).toBe(false);
    expect(online.ok && online.card.onlinePurchasesEnabled).toBe(false);
  });

  it('impede configurações incompatíveis quando bloqueado', () => {
    const snapshot = fresh();
    snapshot.cards[0].status = 'locked';
    expect(executeCardCommand(snapshot, { type: 'set-contactless', cardId, enabled: false, createdAt })).toMatchObject({ ok: false, code: 'card-locked' });
  });

  it('disponibiliza o virtual somente com cartão ativo e compras online', () => {
    const card = fresh().cards[0];
    expect(canUseVirtualCard(card)).toBe(true);
    expect(canUseVirtualCard({ ...card, onlinePurchasesEnabled: false })).toBe(false);
    expect(canUseVirtualCard({ ...card, status: 'locked' })).toBe(false);
  });

  it('migra schema anterior e preserva transações Pix', () => {
    const pix = executePix(fresh(), { operationId: 'pix-preserved', recipient: demoPixRecipients[0], amount: 250, createdAt });
    if (!pix.ok) throw new Error(pix.message);
    const legacyCard = { id: cardId, label: 'NewGen essencial', lastFour: '2846', holderName: 'EDUARDO GOMES', expiresAt: '08/30', invoiceAmount: 1842.5, limitTotal: 6000, status: 'active' as const };
    const migrated = migrateFinancialSnapshot({ ...pix.snapshot, schemaVersion: 2, cards: [legacyCard] } as unknown as Partial<FinancialSnapshot>);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.cards[0]).toMatchObject({ contactlessEnabled: true, onlinePurchasesEnabled: true, qualityTier: 'lite' });
    expect(migrated.transactions.some((item) => item.operationId === 'pix-preserved')).toBe(true);
  });
});
