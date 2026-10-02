import { create } from 'zustand';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from '../domain/models';
import type { ThemePreference } from '../domain/models';
import type { PixCommand, PixResult } from '../domain/pix';
import { executePix } from '../domain/pix';
import type { CardCommand, CardCommandResult } from '../domain/cards';
import { executeCardCommand } from '../domain/cards';
import type { CreateChargeCommand, ChargeResult, ReceiveChargeCommand, ReceiveChargeResult } from '../domain/receiving';
import { createDemoCharge, markDemoChargeShared, simulateDemoChargeReceived } from '../domain/receiving';
import type { PaymentCommand, PaymentResult } from '../domain/payments';
import { executePayment } from '../domain/payments';
import { markAllNotificationsRead as readAllNotifications, markNotificationRead as readNotification } from '../domain/notifications';
import { updateAccountName, updatePreferences } from '../domain/account';
import { localFinancialRepository } from '../persistence/localFinancialRepository';

interface FinancialState extends FinancialSnapshot {
  setBalanceVisibility: (conceal: boolean) => void;
  setThemePreference: (preference: ThemePreference) => void;
  submitPix: (command: PixCommand) => PixResult;
  submitCardCommand: (command: CardCommand) => CardCommandResult;
  createCharge: (command: CreateChargeCommand) => ChargeResult;
  markChargeShared: (chargeId: string) => ChargeResult;
  receiveCharge: (command: ReceiveChargeCommand) => ReceiveChargeResult;
  submitPayment: (command: PaymentCommand) => PaymentResult;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  updateOwnerName: (ownerName: string) => { ok: boolean; message: string };
  resetDemo: () => void;
}

const loadInitialState = () => localFinancialRepository.load() ?? demoFinancialSnapshot;
const toSnapshot = (state: FinancialState): FinancialSnapshot => ({
  schemaVersion: state.schemaVersion,
  account: state.account,
  balance: state.balance,
  transactions: state.transactions,
  cards: state.cards,
  notifications: state.notifications,
  charges: state.charges,
  preferences: state.preferences,
});

const persist = (snapshot: FinancialSnapshot) => {
  localFinancialRepository.save(snapshot);
  return snapshot;
};

export const useFinancialStore = create<FinancialState>((set) => ({
  ...loadInitialState(),
  setBalanceVisibility: (concealBalance) =>
    set((state) => {
      return persist(updatePreferences(toSnapshot(state), { concealBalance }));
    }),
  setThemePreference: (theme) => set((state) => persist(updatePreferences(toSnapshot(state), { theme }))),
  submitPix: (command) => {
    let result: PixResult = { ok: false, code: 'duplicate', message: 'Operação não iniciada.' };
    set((state) => {
      result = executePix(toSnapshot(state), command);
      if (!result.ok) return state;
      return persist(result.snapshot);
    });
    return result;
  },
  submitCardCommand: (command) => {
    let result: CardCommandResult = { ok: false, code: 'card-not-found', message: 'Operação não iniciada.' };
    set((state) => {
      result = executeCardCommand(toSnapshot(state), command);
      if (!result.ok) return state;
      return persist(result.snapshot);
    });
    return result;
  },
  createCharge: (command) => {
    let result: ChargeResult = { ok: false, code: 'duplicate', message: 'Cobrança não iniciada.' };
    set((state) => {
      result = createDemoCharge(toSnapshot(state), command);
      return result.ok ? persist(result.snapshot) : state;
    });
    return result;
  },
  markChargeShared: (chargeId) => {
    let result: ChargeResult = { ok: false, code: 'charge-not-found', message: 'Cobrança não encontrada.' };
    set((state) => {
      result = markDemoChargeShared(toSnapshot(state), chargeId);
      return result.ok ? persist(result.snapshot) : state;
    });
    return result;
  },
  receiveCharge: (command) => {
    let result: ReceiveChargeResult = { ok: false, code: 'charge-not-found', message: 'Cobrança não encontrada.' };
    set((state) => {
      result = simulateDemoChargeReceived(toSnapshot(state), command);
      return result.ok ? persist(result.snapshot) : state;
    });
    return result;
  },
  submitPayment: (command) => {
    let result: PaymentResult = { ok: false, code: 'duplicate', message: 'Pagamento não iniciado.' };
    set((state) => {
      result = executePayment(toSnapshot(state), command);
      return result.ok ? persist(result.snapshot) : state;
    });
    return result;
  },
  markNotificationRead: (notificationId) => set((state) => persist(readNotification(toSnapshot(state), notificationId))),
  markAllNotificationsRead: () => set((state) => persist(readAllNotifications(toSnapshot(state)))),
  updateOwnerName: (ownerName) => {
    let response = { ok: false, message: 'Informe um nome válido.' };
    set((state) => {
      const next = updateAccountName(toSnapshot(state), ownerName);
      if (!next) return state;
      response = { ok: true, message: 'Nome atualizado.' };
      return persist(next);
    });
    return response;
  },
  resetDemo: () => {
    localFinancialRepository.clear();
    set({ ...demoFinancialSnapshot });
  },
}));
