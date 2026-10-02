import type { DemoCharge, FinancialSnapshot, Notification, Transaction } from './models';

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export interface CreateChargeCommand {
  chargeId: string;
  amount?: number;
  description?: string;
  createdAt: string;
}

export interface ReceiveChargeCommand {
  chargeId: string;
  operationId: string;
  amount: number;
  createdAt: string;
}

export type ChargeResult =
  | { ok: true; snapshot: FinancialSnapshot; charge: DemoCharge }
  | { ok: false; code: 'duplicate' | 'invalid-amount' | 'charge-not-found' | 'already-received'; message: string };

export type ReceiveChargeResult =
  | { ok: true; snapshot: FinancialSnapshot; charge: DemoCharge; transaction: Transaction }
  | { ok: false; code: 'duplicate' | 'invalid-amount' | 'charge-not-found' | 'already-received'; message: string };

export const createDemoCharge = (snapshot: FinancialSnapshot, command: CreateChargeCommand): ChargeResult => {
  if (snapshot.charges.some((charge) => charge.id === command.chargeId)) {
    return { ok: false, code: 'duplicate', message: 'Esta cobrança já foi criada.' };
  }
  if (command.amount !== undefined && (!Number.isFinite(command.amount) || command.amount <= 0)) {
    return { ok: false, code: 'invalid-amount', message: 'Informe um valor maior que zero ou deixe o campo vazio.' };
  }
  const amount = command.amount === undefined ? undefined : roundMoney(command.amount);
  const charge: DemoCharge = {
    id: command.chargeId,
    code: `NGB.DEMO.PIX.${snapshot.account.id}.${command.chargeId}.${amount === undefined ? 'ABERTO' : Math.round(amount * 100)}`,
    amount,
    description: command.description?.trim() || undefined,
    createdAt: command.createdAt,
    status: 'created',
  };
  return { ok: true, charge, snapshot: { ...snapshot, charges: [charge, ...snapshot.charges] } };
};

export const markDemoChargeShared = (snapshot: FinancialSnapshot, chargeId: string): ChargeResult => {
  const charge = snapshot.charges.find((item) => item.id === chargeId);
  if (!charge) return { ok: false, code: 'charge-not-found', message: 'Cobrança não encontrada.' };
  if (charge.status === 'received') return { ok: false, code: 'already-received', message: 'Esta cobrança já foi recebida.' };
  const sharedCharge: DemoCharge = { ...charge, status: 'shared' };
  return {
    ok: true,
    charge: sharedCharge,
    snapshot: { ...snapshot, charges: snapshot.charges.map((item) => item.id === chargeId ? sharedCharge : item) },
  };
};

export const simulateDemoChargeReceived = (snapshot: FinancialSnapshot, command: ReceiveChargeCommand): ReceiveChargeResult => {
  if (snapshot.transactions.some((transaction) => transaction.operationId === command.operationId)) {
    return { ok: false, code: 'duplicate', message: 'Este recebimento já foi concluído.' };
  }
  const charge = snapshot.charges.find((item) => item.id === command.chargeId);
  if (!charge) return { ok: false, code: 'charge-not-found', message: 'Cobrança não encontrada.' };
  if (charge.status === 'received') return { ok: false, code: 'already-received', message: 'Esta cobrança já foi recebida.' };
  if (!Number.isFinite(command.amount) || command.amount <= 0) {
    return { ok: false, code: 'invalid-amount', message: 'Informe o valor recebido na simulação.' };
  }
  const amount = roundMoney(command.amount);
  const transaction: Transaction = {
    id: createId('receipt'),
    operationId: command.operationId,
    chargeId: charge.id,
    type: 'receipt',
    direction: 'in',
    amount,
    occurredAt: command.createdAt,
    status: 'completed',
    title: 'Cobrança recebida',
    description: charge.description ?? 'Recebimento de cobrança demo',
    recipient: snapshot.account.ownerName,
    institution: snapshot.account.institution,
    maskedKey: 'Chave demo da conta',
    origin: 'Pagador simulado · ambiente de demonstração',
    category: 'Receitas',
    reference: charge.code,
  };
  const notification: Notification = {
    id: createId('notification'),
    type: 'receipt',
    title: 'Cobrança recebida',
    body: `${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} entrou na sua conta demo.`,
    createdAt: command.createdAt,
    read: false,
    transactionId: transaction.id,
    targetPath: `/movimentos/${transaction.id}`,
  };
  const receivedCharge: DemoCharge = { ...charge, amount, status: 'received', receivedAt: command.createdAt, transactionId: transaction.id };
  return {
    ok: true,
    charge: receivedCharge,
    transaction,
    snapshot: {
      ...snapshot,
      balance: { ...snapshot.balance, available: roundMoney(snapshot.balance.available + amount), updatedAt: command.createdAt },
      transactions: [transaction, ...snapshot.transactions],
      notifications: [notification, ...snapshot.notifications],
      charges: snapshot.charges.map((item) => item.id === charge.id ? receivedCharge : item),
    },
  };
};
