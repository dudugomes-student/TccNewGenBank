import type { FinancialSnapshot, Notification, Transaction } from './models';

export interface DemoBill {
  id: string;
  reference: string;
  beneficiary: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
}

export interface PaymentCommand {
  operationId: string;
  bill: DemoBill;
  createdAt: string;
}

export type PaymentResult =
  | { ok: true; snapshot: FinancialSnapshot; transaction: Transaction }
  | { ok: false; code: 'invalid-bill' | 'insufficient-balance' | 'duplicate'; message: string };

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const validateDemoBill = (bill: DemoBill): PaymentResult | null => {
  if (!bill.id || !bill.reference || !bill.beneficiary || !bill.description || !bill.dueDate || !Number.isFinite(bill.amount) || bill.amount <= 0) {
    return { ok: false, code: 'invalid-bill', message: 'A cobrança demo não tem dados válidos para pagamento.' };
  }
  return null;
};

export const executePayment = (snapshot: FinancialSnapshot, command: PaymentCommand): PaymentResult => {
  if (snapshot.transactions.some((transaction) => transaction.operationId === command.operationId || transaction.billingId === command.bill.id)) {
    return { ok: false, code: 'duplicate', message: 'Esta cobrança já foi paga.' };
  }
  const billError = validateDemoBill(command.bill);
  if (billError) return billError;
  if (command.bill.amount > snapshot.balance.available) {
    return { ok: false, code: 'insufficient-balance', message: 'Seu saldo não é suficiente para pagar esta cobrança.' };
  }
  const amount = roundMoney(command.bill.amount);
  const transaction: Transaction = {
    id: createId('payment'),
    operationId: command.operationId,
    billingId: command.bill.id,
    type: 'payment',
    direction: 'out',
    amount,
    occurredAt: command.createdAt,
    status: 'completed',
    title: `Pagamento para ${command.bill.beneficiary}`,
    description: command.bill.description,
    recipient: command.bill.beneficiary,
    institution: 'Cobrança demo NewGenBank',
    origin: `${snapshot.account.institution} · Ag. ${snapshot.account.branch} · Conta ${snapshot.account.number}`,
    category: command.bill.category,
    dueDate: command.bill.dueDate,
    reference: command.bill.reference,
  };
  const notification: Notification = {
    id: createId('notification'),
    type: 'payment',
    title: 'Pagamento realizado',
    body: `${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para ${command.bill.beneficiary}.`,
    createdAt: command.createdAt,
    read: false,
    transactionId: transaction.id,
    targetPath: `/movimentos/${transaction.id}`,
  };
  return {
    ok: true,
    transaction,
    snapshot: {
      ...snapshot,
      balance: { ...snapshot.balance, available: roundMoney(snapshot.balance.available - amount), updatedAt: command.createdAt },
      transactions: [transaction, ...snapshot.transactions],
      notifications: [notification, ...snapshot.notifications],
    },
  };
};
