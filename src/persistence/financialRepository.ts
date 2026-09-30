import type { FinancialSnapshot } from '../domain/models';

export interface FinancialRepository {
  load(): FinancialSnapshot | null;
  save(snapshot: FinancialSnapshot): void;
  clear(): void;
}
