import type { FinancialSnapshot } from '../domain/models';

export const demoFinancialSnapshot: FinancialSnapshot = {
  schemaVersion: 3,
  account: {
    id: 'acc_demo_001',
    ownerName: 'Eduardo Gomes',
    firstName: 'Eduardo',
    branch: '0001',
    number: '284615-8',
    institution: 'NewGenBank · 748',
    pixDailyLimit: 5000,
  },
  balance: {
    available: 12480.5,
    previousMonth: 11610.2,
    currency: 'BRL',
    updatedAt: '2026-09-29T09:42:00-03:00',
  },
  transactions: [
    { id: 'tx-01', title: 'Pix recebido', category: 'Transferência', occurredAt: '2026-09-29T09:42:00-03:00', amount: 450, direction: 'in', status: 'completed', type: 'pix', description: 'Pix recebido de Lucas Ferreira' },
    { id: 'tx-02', title: 'Mercado Central', category: 'Alimentação', occurredAt: '2026-09-28T18:15:00-03:00', amount: 86.4, direction: 'out', status: 'completed', type: 'purchase', description: 'Compra no cartão', cardId: 'card-01' },
    { id: 'tx-03', title: 'Assinatura digital', category: 'Serviços', occurredAt: '2026-09-27T08:00:00-03:00', amount: 29.9, direction: 'out', status: 'completed', type: 'service', description: 'Pagamento recorrente' },
    { id: 'tx-04', title: 'Mesada', category: 'Receita', occurredAt: '2026-09-25T12:30:00-03:00', amount: 300, direction: 'in', status: 'completed', type: 'income', description: 'Entrada mensal' },
    { id: 'tx-05', title: 'Loja de tecnologia', category: 'Compras', occurredAt: '2026-09-23T16:21:00-03:00', amount: 620, direction: 'out', status: 'completed', type: 'purchase', description: 'Compra no cartão', cardId: 'card-01' },
  ],
  cards: [
    { id: 'card-01', label: 'NewGen essencial', lastFour: '2846', holderName: 'EDUARDO GOMES', expiresAt: '08/30', network: 'NGB', virtualNumber: '5487219046382846', virtualCvv: '417', limitTotal: 6000, limitAllocated: 6000, status: 'active', invoiceClosingDay: 3, invoiceDueDay: 10, contactlessEnabled: true, onlinePurchasesEnabled: true, virtualCardEnabled: true, qualityTier: 'lite' },
  ],
  notifications: [
    { id: 'nt-01', title: 'Pix recebido', body: 'Você recebeu R$ 450,00.', createdAt: '2026-09-29T09:42:00-03:00', read: false },
  ],
  preferences: {
    theme: 'system',
    concealBalance: false,
    reduceMotion: false,
  },
};
