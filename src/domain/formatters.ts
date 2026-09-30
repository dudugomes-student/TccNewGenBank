const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

export const formatMoney = (value: number) => moneyFormatter.format(value);

export const formatSignedMoney = (value: number, direction: 'in' | 'out') =>
  `${direction === 'in' ? '+' : '−'} ${formatMoney(value)}`;

export const formatShortDate = (isoDate: string) =>
  shortDateFormatter.format(new Date(isoDate)).replace('.', '');

export const formatDateTime = (isoDate: string) => ({
  date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(isoDate)),
  time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate)),
});

export const calculatePercentageChange = (current: number, previous: number) =>
  previous === 0 ? 0 : ((current - previous) / previous) * 100;
