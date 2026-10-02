import type { FinancialSnapshot, Preferences } from './models';

export const updateAccountName = (snapshot: FinancialSnapshot, ownerName: string): FinancialSnapshot | null => {
  const normalized = ownerName.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2) return null;
  return {
    ...snapshot,
    account: { ...snapshot.account, ownerName: normalized, firstName: normalized.split(' ')[0] },
  };
};

export const updatePreferences = (snapshot: FinancialSnapshot, preferences: Partial<Preferences>): FinancialSnapshot => ({
  ...snapshot,
  preferences: { ...snapshot.preferences, ...preferences },
});
