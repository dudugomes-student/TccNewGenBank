import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { formatDateTime, formatMoney } from '../domain/formatters';
import { useRouteFocus } from '../motion/useRouteFocus';
import { transactionTransitionName } from '../motion/RouteMotionController';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';
import { Receipt } from '../ui/Receipt';

interface DetailLocationState {
  from?: string;
  label?: string;
}

export function TransactionRoute() {
  useRouteFocus();
  const { transactionId } = useParams();
  const location = useLocation();
  const transactions = useFinancialStore((state) => state.transactions);
  const unread = useFinancialStore((state) => state.notifications.filter((item) => !item.read).length);
  const transaction = transactions.find((item) => item.id === transactionId);
  if (!transaction) return <Navigate to="/movimento" replace />;

  const occurred = formatDateTime(transaction.occurredAt);
  const state = location.state as DetailLocationState | null;
  const backTo = state?.from ?? (transaction.cardId ? '/cartao' : '/movimento');
  const backLabel = state?.label ?? (transaction.cardId ? 'Fatura do cartão' : 'Movimento');
  const detailTransitionName = transactionTransitionName(transaction.id);

  return (
    <div className="transaction-page vertical-slice mineral-scene route-stage">
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <a className="skip-link" href="#transaction-content">Pular para os detalhes</a>
      <AppHeader unreadCount={unread} showAccent />
      <main className="transaction-shell" id="transaction-content">
        <Link to={backTo} className="back-link" viewTransition><ArrowLeft aria-hidden="true" /> {backLabel}</Link>
        <div className="transaction-detail-transition" style={{ viewTransitionName: detailTransitionName }}>
        {transaction.type === 'pix' || transaction.type === 'payment' || transaction.type === 'receipt' ? <Receipt transaction={transaction} /> : (
          <article className="transaction-detail">
            <p className="section-index">TRANSAÇÃO {transaction.status === 'completed' ? 'CONCLUÍDA' : transaction.status.toUpperCase()}</p>
            <h1 tabIndex={-1} data-route-title>{transaction.title}</h1>
            <p>{transaction.description}</p>
            <dl>
              <div><dt>Valor</dt><dd>{formatMoney(transaction.amount)}</dd></div>
              <div><dt>Fluxo</dt><dd>{transaction.direction === 'in' ? 'Entrada' : 'Saída'}</dd></div>
              <div><dt>Categoria</dt><dd>{transaction.category}</dd></div>
              <div><dt>Data</dt><dd>{occurred.date}</dd></div>
              <div><dt>Horário</dt><dd>{occurred.time}</dd></div>
              <div><dt>Status</dt><dd>{transaction.status === 'completed' ? 'Concluída' : transaction.status === 'processing' ? 'Em processamento' : 'Agendada'}</dd></div>
              {transaction.recipient && <div><dt>Contraparte</dt><dd>{transaction.recipient}</dd></div>}
              {transaction.institution && <div><dt>Instituição</dt><dd>{transaction.institution}</dd></div>}
              <div><dt>Identificador</dt><dd className="receipt__id">{transaction.operationId ?? transaction.id}</dd></div>
            </dl>
          </article>
        )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
