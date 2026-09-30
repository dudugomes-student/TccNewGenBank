import type { FinancialSnapshot, PixKeyType, PixRecipient, Transaction } from './models';

export const normalizePixKey = (value: string) => value.trim().toLowerCase().replace(/[().\s-]/g, '');

export const detectPixKeyType = (value: string): PixKeyType | null => {
  const clean = normalizePixKey(value);
  if (/^\S+@\S+\.\S+$/.test(clean)) return 'email';
  if (/^\d{11}$/.test(clean)) return value.includes('(') ? 'phone' : 'cpf';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())) return 'random';
  return null;
};

export const findPixRecipient = (value: string, recipients: PixRecipient[]) => {
  const clean = normalizePixKey(value);
  return recipients.find((recipient) => normalizePixKey(recipient.key) === clean) ?? null;
};

export type PixValidationCode = 'invalid-key' | 'recipient-not-found' | 'invalid-amount' | 'insufficient-balance' | 'limit-exceeded' | 'recipient-unavailable' | 'duplicate';

export interface PixCommand {
  operationId: string;
  recipient: PixRecipient;
  amount: number;
  createdAt: string;
}

export type PixResult =
  | { ok: true; snapshot: FinancialSnapshot; transaction: Transaction }
  | { ok: false; code: PixValidationCode; message: string };

export const validatePixAmount = (amount: number, snapshot: FinancialSnapshot): PixResult | null => {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, code: 'invalid-amount', message: 'Informe um valor maior que zero.' };
  if (amount > snapshot.account.pixDailyLimit) return { ok: false, code: 'limit-exceeded', message: `O valor ultrapassa seu limite Pix diário.` };
  if (amount > snapshot.balance.available) return { ok: false, code: 'insufficient-balance', message: 'Seu saldo não é suficiente para este Pix.' };
  return null;
};

const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const executePix = (snapshot: FinancialSnapshot, command: PixCommand): PixResult => {
  if (snapshot.transactions.some((transaction) => transaction.operationId === command.operationId)) {
    return { ok: false, code: 'duplicate', message: 'Esta operação já foi concluída.' };
  }
  const amountError = validatePixAmount(command.amount, snapshot);
  if (amountError) return amountError;
  if (!command.recipient.available) return { ok: false, code: 'recipient-unavailable', message: 'A instituição do destinatário está indisponível. Nenhum valor foi enviado.' };

  const transaction: Transaction = {
    id: createId('pix'),
    operationId: command.operationId,
    type: 'pix',
    direction: 'out',
    amount: Math.round(command.amount * 100) / 100,
    occurredAt: command.createdAt,
    status: 'completed',
    title: `Pix para ${command.recipient.name}`,
    description: 'Transferência Pix concluída',
    recipient: command.recipient.name,
    institution: command.recipient.institution,
    maskedKey: command.recipient.maskedKey,
    origin: `${snapshot.account.institution} · Ag. ${snapshot.account.branch} · Conta ${snapshot.account.number}`,
    category: 'Transferência',
  };
  const notification = {
    id: createId('notification'),
    title: 'Pix enviado',
    body: `${command.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para ${command.recipient.name}.`,
    createdAt: command.createdAt,
    read: false,
    transactionId: transaction.id,
  };
  return {
    ok: true,
    transaction,
    snapshot: {
      ...snapshot,
      balance: { ...snapshot.balance, available: Math.round((snapshot.balance.available - command.amount) * 100) / 100, updatedAt: command.createdAt },
      transactions: [transaction, ...snapshot.transactions],
      notifications: [notification, ...snapshot.notifications],
    },
  };
};
