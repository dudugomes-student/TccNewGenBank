import type { DemoBill } from '../domain/payments';

export const demoBills: DemoBill[] = [
  {
    id: 'bill-energy-2026-10',
    reference: 'NGB-DEMO-ENERGIA-1026',
    beneficiary: 'Energia Paulista — demonstração',
    description: 'Conta de energia · setembro',
    amount: 246.8,
    dueDate: '2026-10-08T12:00:00-03:00',
    category: 'Casa',
  },
  {
    id: 'bill-course-2026-10',
    reference: 'NGB-DEMO-CURSO-1026',
    beneficiary: 'Instituto Criativo — demonstração',
    description: 'Parcela do curso de design',
    amount: 420,
    dueDate: '2026-10-12T12:00:00-03:00',
    category: 'Outros',
  },
];

export const findDemoBill = (reference: string) =>
  demoBills.find((bill) => bill.reference.toLocaleUpperCase('pt-BR') === reference.trim().toLocaleUpperCase('pt-BR')) ?? null;
