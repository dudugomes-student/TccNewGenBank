import { ArrowDownLeft, ArrowRight, Ellipsis, Eye, EyeOff, Plus, ReceiptText, Send } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatMoney, formatShortDate, formatSignedMoney, formatTime } from '../domain/formatters';
import { recentTransactions } from '../domain/selectors';
import { useRouteFocus } from '../motion/useRouteFocus';
import { getRememberedTransaction, rememberTransactionSource, transactionTransitionName } from '../motion/RouteMotionController';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';
import { NewGenCard } from '../ui/NewGenCard';

const actions = [
  { label: 'Pix', detail: 'Transferir', Icon: Send, href: '/pix' },
  { label: 'Pagar', detail: 'Contas e boletos', Icon: ReceiptText, href: '/pagar' },
  { label: 'Receber', detail: 'Criar cobrança', Icon: ArrowDownLeft, href: '/receber' },
  { label: 'Mais', detail: 'Outras opções', Icon: Ellipsis, href: '/movimento' },
];

export function DashboardRoute() {
  const hasVisited = useRef(typeof window !== 'undefined' && window.sessionStorage.getItem('newgen-dashboard-visited') === 'true');
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardState = location.state as { dashboardFocus?: 'capital' | 'ledger'; fromLogin?: boolean } | null;
  const snapshot = useFinancialStore();
  const transactions = useMemo(() => recentTransactions(snapshot.transactions), [snapshot.transactions]);
  const card = snapshot.cards[0];
  const unread = snapshot.notifications.filter((item) => !item.read).length;
  const returningTransactionId = getRememberedTransaction();

  useLayoutEffect(() => {
    if (!returningTransactionId) return;
    const savedScroll = Number(window.sessionStorage.getItem('newgen-motion-scroll'));
    if (Number.isFinite(savedScroll)) window.scrollTo(0, savedScroll);
    const clear = window.setTimeout(() => {
      window.sessionStorage.removeItem('newgen-motion-transaction');
      window.sessionStorage.removeItem('newgen-motion-scroll');
    }, 1250);
    return () => window.clearTimeout(clear);
  }, [returningTransactionId]);

  useRouteFocus();

  useEffect(() => {
    window.sessionStorage.setItem('newgen-dashboard-visited', 'true');
  }, []);

  /* Clean up the entrance attribute after animations complete */
  useEffect(() => {
    if (!dashboardState?.fromLogin) return;
    const timer = window.setTimeout(() => {
      const page = document.querySelector('.dashboard-page[data-entering]');
      if (page) page.removeAttribute('data-entering');
      /* Clear only fromLogin without changing the current URL. */
      const nextState = { ...dashboardState };
      delete nextState.fromLogin;
      navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, {
        replace: true,
        state: Object.keys(nextState).length ? nextState : null,
      });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [dashboardState?.fromLogin, location.pathname, location.search, location.hash, navigate]);

  return (
    <div className="dashboard-page vertical-slice mineral-scene route-stage" data-entering={dashboardState?.fromLogin || !returningTransactionId || undefined}>
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <AppHeader unreadCount={unread} showAccent />
      <main
        className="dashboard dashboard--mineral"
        id="main-content"
        data-returning={hasVisited.current && !dashboardState?.fromLogin || undefined}
      >
        <header className="dashboard-intro dashboard-intro--mineral" data-slice-enter="greeting">
          <div>
            <p>Conta {snapshot.account.number}</p>
            <h1 tabIndex={-1} data-route-title>Bom dia, {snapshot.account.firstName}.</h1>
          </div>
          <p>Seu dinheiro está pronto para o próximo movimento.</p>
        </header>

        <section className="dashboard-core" aria-label="Resumo da conta">
          <article className="balance-object" data-slice-enter="balance">
            <header>
              <span>Saldo disponível</span>
              <span>Atualizado às {formatTime(snapshot.balance.updatedAt)}</span>
            </header>
            <div className="balance-object__value">
              <strong aria-live="polite">{snapshot.preferences.concealBalance ? 'R$ ••••••' : formatMoney(snapshot.balance.available)}</strong>
              <button type="button" onClick={() => snapshot.setBalanceVisibility(!snapshot.preferences.concealBalance)} aria-pressed={snapshot.preferences.concealBalance} aria-label={snapshot.preferences.concealBalance ? 'Mostrar saldo' : 'Ocultar saldo'}>
                {snapshot.preferences.concealBalance ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
              </button>
            </div>
            <div className="quick-actions" aria-label="Ações rápidas">
              {actions.map(({ label, detail, Icon, href }) => (
                <Link key={label} to={href} viewTransition>
                  <span><Icon aria-hidden="true" /></span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </Link>
              ))}
            </div>
          </article>

          <Link to="/cartao" className="dashboard-card-stage slice-card" viewTransition aria-label={`Abrir cartão final ${card.lastFour}`} data-slice-enter="card">
            <NewGenCard card={card} compact spatial visualScale={1.55} renderOverscan={2.5} />
            <span className="dashboard-card-stage__meta">NewGen Black <ArrowRight aria-hidden="true" /></span>
          </Link>
        </section>

        <section className="movement-peek" id="movimentos" aria-labelledby="movement-peek-title" data-slice-enter="movement">
          <header>
            <div><span>Hoje</span><h2 id="movement-peek-title">Movimentações recentes</h2></div>
            <Link to="/movimento" viewTransition>Ver todas <ArrowRight aria-hidden="true" /></Link>
          </header>
          <ol>
            {transactions.slice(0, 3).map((transaction, index) => (
              <li key={transaction.id} style={{ animationDelay: (280 + Math.min(index, 5) * 45) + 'ms' }}>
                <Link
                  to={`/movimentos/${transaction.id}`}
                  viewTransition
                  state={{ from: '/dashboard', label: 'Dashboard' }}
                  style={{ viewTransitionName: returningTransactionId === transaction.id ? transactionTransitionName(transaction.id) : undefined }}
                  onClick={(event) => {
                    rememberTransactionSource(transaction.id);
                    event.currentTarget.style.viewTransitionName = transactionTransitionName(transaction.id);
                  }}
                >
                  <span className={`movement-peek__direction movement-peek__direction--${transaction.direction}`} aria-hidden="true">{transaction.direction === 'in' ? <Plus /> : <Send />}</span>
                  <span className="movement-peek__title"><strong>{transaction.title}</strong><small>{transaction.category}</small></span>
                  <time dateTime={transaction.occurredAt}>{formatShortDate(transaction.occurredAt)}</time>
                  <strong className={transaction.direction === 'in' ? 'positive' : ''}>{formatSignedMoney(transaction.amount, transaction.direction)}</strong>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
