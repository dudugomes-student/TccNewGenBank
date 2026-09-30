import { create } from 'zustand';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from '../domain/models';
import type { PixCommand, PixResult } from '../domain/pix';
import { executePix } from '../domain/pix';
import type { CardCommand, CardCommandResult } from '../domain/cards';
import { executeCardCommand } from '../domain/cards';
import { localFinancialRepository } from '../persistence/localFinancialRepository';

interface FinancialState extends FinancialSnapshot {
  setBalanceVisibility: (conceal: boolean) => void;
  submitPix: (command: PixCommand) => PixResult;
  submitCardCommand: (command: CardCommand) => CardCommandResult;
  resetDemo: () => void;
}

const loadInitialState = () => localFinancialRepository.load() ?? demoFinancialSnapshot;

export const useFinancialStore = create<FinancialState>((set) => ({
  ...loadInitialState(),
  setBalanceVisibility: (concealBalance) =>
    set((state) => {
      const next = { ...state, preferences: { ...state.preferences, concealBalance } };
      localFinancialRepository.save({
        schemaVersion: next.schemaVersion,
        account: next.account,
        balance: next.balance,
        transactions: next.transactions,
        cards: next.cards,
        notifications: next.notifications,
        preferences: next.preferences,
      });
      return next;
    }),
  submitPix: (command) => {
    let result: PixResult = { ok: false, code: 'duplicate', message: 'Operação não iniciada.' };
    set((state) => {
      const snapshot: FinancialSnapshot = {
        schemaVersion: state.schemaVersion,
        account: state.account,
        balance: state.balance,
        transactions: state.transactions,
        cards: state.cards,
        notifications: state.notifications,
        preferences: state.preferences,
      };
      result = executePix(snapshot, command);
      if (!result.ok) return state;
      localFinancialRepository.save(result.snapshot);
      return result.snapshot;
    });
    return result;
  },
  submitCardCommand: (command) => {
    let result: CardCommandResult = { ok: false, code: 'card-not-found', message: 'Operação não iniciada.' };
    set((state) => {
      const snapshot: FinancialSnapshot = {
        schemaVersion: state.schemaVersion,
        account: state.account,
        balance: state.balance,
        transactions: state.transactions,
        cards: state.cards,
        notifications: state.notifications,
        preferences: state.preferences,
      };
      result = executeCardCommand(snapshot, command);
      if (!result.ok) return state;
      localFinancialRepository.save(result.snapshot);
      return result.snapshot;
    });
    return result;
  },
  resetDemo: () => {
    localFinancialRepository.clear();
    set({ ...demoFinancialSnapshot });
  },
}));
