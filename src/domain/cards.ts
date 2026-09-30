import type { BankCard, FinancialSnapshot, Notification, Transaction } from './models';

export const cardPurchases = (transactions: Transaction[], cardId: string) =>
  transactions
    .filter((transaction) => transaction.cardId === cardId && transaction.type === 'purchase' && transaction.status === 'completed')
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

export const cardInvoiceAmount = (snapshot: FinancialSnapshot, cardId: string) =>
  cardPurchases(snapshot.transactions, cardId).reduce((total, transaction) => total + transaction.amount, 0);

export const cardLimitUsed = cardInvoiceAmount;

export const cardLimitAvailable = (snapshot: FinancialSnapshot, cardId: string) => {
  const card = snapshot.cards.find((item) => item.id === cardId);
  return card ? Math.max(0, card.limitAllocated - cardLimitUsed(snapshot, cardId)) : 0;
};

export const canUseVirtualCard = (card: BankCard) =>
  card.status === 'active' && card.virtualCardEnabled && card.onlinePurchasesEnabled;

export type CardCommand =
  | { type: 'set-status'; cardId: string; status: BankCard['status']; createdAt: string }
  | { type: 'set-contactless'; cardId: string; enabled: boolean; createdAt: string }
  | { type: 'set-online-purchases'; cardId: string; enabled: boolean; createdAt: string }
  | { type: 'set-limit-allocation'; cardId: string; amount: number; createdAt: string }
  | { type: 'set-quality-tier'; cardId: string; tier: BankCard['qualityTier']; createdAt: string };

export type CardCommandResult =
  | { ok: true; snapshot: FinancialSnapshot; card: BankCard; message: string }
  | { ok: false; code: 'card-not-found' | 'invalid-limit' | 'limit-below-used' | 'card-locked'; message: string };

const notificationFor = (command: CardCommand, card: BankCard): Notification | null => {
  const base = { id: `notification_${crypto.randomUUID()}`, createdAt: command.createdAt, read: false };
  if (command.type === 'set-status') return { ...base, title: command.status === 'locked' ? 'Cartão bloqueado' : 'Cartão desbloqueado', body: `${card.label} final ${card.lastFour} foi ${command.status === 'locked' ? 'bloqueado' : 'desbloqueado'}.` };
  if (command.type === 'set-contactless') return { ...base, title: 'Aproximação alterada', body: `Compras por aproximação foram ${command.enabled ? 'ativadas' : 'desativadas'}.` };
  if (command.type === 'set-online-purchases') return { ...base, title: 'Compras online alteradas', body: `Compras online foram ${command.enabled ? 'ativadas' : 'desativadas'}.` };
  return null;
};

export const executeCardCommand = (snapshot: FinancialSnapshot, command: CardCommand): CardCommandResult => {
  const current = snapshot.cards.find((card) => card.id === command.cardId);
  if (!current) return { ok: false, code: 'card-not-found', message: 'Cartão não encontrado.' };

  let nextCard: BankCard = current;
  if (command.type === 'set-status') nextCard = { ...current, status: command.status };
  if (command.type === 'set-contactless') {
    if (current.status === 'locked') return { ok: false, code: 'card-locked', message: 'Desbloqueie o cartão para alterar a aproximação.' };
    nextCard = { ...current, contactlessEnabled: command.enabled };
  }
  if (command.type === 'set-online-purchases') {
    if (current.status === 'locked') return { ok: false, code: 'card-locked', message: 'Desbloqueie o cartão para alterar compras online.' };
    nextCard = { ...current, onlinePurchasesEnabled: command.enabled };
  }
  if (command.type === 'set-limit-allocation') {
    if (!Number.isFinite(command.amount) || command.amount < 0 || command.amount > current.limitTotal) return { ok: false, code: 'invalid-limit', message: `Escolha um valor entre R$ 0 e o limite total.` };
    if (command.amount < cardLimitUsed(snapshot, current.id)) return { ok: false, code: 'limit-below-used', message: 'O limite organizado não pode ficar abaixo do valor já utilizado.' };
    nextCard = { ...current, limitAllocated: Math.round(command.amount * 100) / 100 };
  }
  if (command.type === 'set-quality-tier') nextCard = { ...current, qualityTier: command.tier };

  const notification = notificationFor(command, nextCard);
  return {
    ok: true,
    card: nextCard,
    message: command.type === 'set-limit-allocation' ? 'Limite organizado.' : command.type === 'set-quality-tier' ? 'Representação do cartão atualizada.' : 'Configuração atualizada.',
    snapshot: {
      ...snapshot,
      cards: snapshot.cards.map((card) => card.id === nextCard.id ? nextCard : card),
      notifications: notification ? [notification, ...snapshot.notifications] : snapshot.notifications,
    },
  };
};
