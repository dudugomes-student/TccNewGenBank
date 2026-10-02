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

export const formatMonthLabel = (monthKey: string, style: 'long' | 'short' = 'long') => {
  const [year, month] = monthKey.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', { month: style, year: style === 'long' ? 'numeric' : undefined })
    .format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
};

export const formatLedgerDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    .format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatTime = (isoDate: string) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate));

export const calculatePercentageChange = (current: number, previous: number) =>
  previous === 0 ? 0 : ((current - previous) / previous) * 100;
