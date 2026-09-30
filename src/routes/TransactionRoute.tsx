import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { Receipt } from '../ui/Receipt';
import { formatDateTime, formatMoney } from '../domain/formatters';

export function TransactionRoute() {
  const { transactionId } = useParams();
  const transactions = useFinancialStore((state) => state.transactions);
  const unread = useFinancialStore((state) => state.notifications.filter((item) => !item.read).length);
  const transaction = transactions.find((item) => item.id === transactionId);
  if (!transaction) return <Navigate to="/dashboard" replace />;
  const occurred = formatDateTime(transaction.occurredAt);
  return <div className="transaction-page route-stage"><AppHeader unreadCount={unread} /><main className="transaction-shell"><Link to={transaction.cardId ? '/cartao' : '/dashboard'} className="back-link"><ArrowLeft aria-hidden="true" /> {transaction.cardId ? 'Fatura do cartão' : 'Movimento recente'}</Link>{transaction.type === 'pix' ? <Receipt transaction={transaction} /> : <article className="transaction-detail"><p className="section-index">TRANSAÇÃO CONCLUÍDA</p><h1 tabIndex={-1} data-route-title>{transaction.title}</h1><p>{transaction.description}</p><dl><div><dt>Valor</dt><dd>{formatMoney(transaction.amount)}</dd></div><div><dt>Data</dt><dd>{occurred.date}</dd></div><div><dt>Horário</dt><dd>{occurred.time}</dd></div><div><dt>Status</dt><dd>Concluída</dd></div></dl></article>}</main></div>;
}
