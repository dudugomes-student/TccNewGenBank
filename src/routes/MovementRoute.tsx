import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Search, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatLedgerDate, formatMoney, formatMonthLabel, formatSignedMoney, formatTime } from '../domain/formatters';
import {
  availableTransactionMonths,
  deriveBalanceHistory,
  deriveMonthlyClosingBalances,
  filterTransactions,
  groupTransactionsByDate,
  type LedgerDirectionFilter,
} from '../domain/movement';
import { useRouteFocus } from '../motion/useRouteFocus';
import { getRememberedTransaction, rememberTransactionSource, transactionTransitionName } from '../motion/RouteMotionController';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { BalanceTrajectory } from '../ui/BalanceTrajectory';
import { MobileNav } from '../ui/MobileNav';

const statusLabels = { completed: 'Concluída', scheduled: 'Agendada', processing: 'Em processamento' } as const;

export function MovementRoute() {
  useRouteFocus();
  const snapshot = useFinancialStore();
  const unread = snapshot.notifications.filter((item) => !item.read).length;
  const [searchParams, setSearchParams] = useSearchParams();
  const months = useMemo(() => availableTransactionMonths(snapshot.transactions), [snapshot.transactions]);
  const categories = useMemo(() => [...new Set(snapshot.transactions.map((item) => item.category))].sort(), [snapshot.transactions]);
  const filters = {
    query: searchParams.get('busca') ?? '',
    month: searchParams.get('mes') ?? 'all',
    direction: (searchParams.get('tipo') ?? 'all') as LedgerDirectionFilter,
    category: searchParams.get('categoria') ?? 'all',
  };
  const filtered = useMemo(() => filterTransactions(snapshot.transactions, filters), [snapshot.transactions, filters.query, filters.month, filters.direction, filters.category]);
  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered]);
  const balanceHistory = useMemo(() => deriveBalanceHistory(snapshot.transactions, snapshot.balance.available), [snapshot.transactions, snapshot.balance.available]);
  const monthlyBalances = useMemo(() => deriveMonthlyClosingBalances(snapshot.transactions, snapshot.balance.available), [snapshot.transactions, snapshot.balance.available]);
  const balanceByTransaction = useMemo(() => new Map(balanceHistory.map((point) => [point.transactionId, point.balance])), [balanceHistory]);
  const hasFilters = Boolean(filters.query || filters.month !== 'all' || filters.direction !== 'all' || filters.category !== 'all');
  const filterKey = `${filters.query}|${filters.month}|${filters.direction}|${filters.category}`;
  const [focusedMonth, setFocusedMonth] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const activeTrajectoryMonth = focusedMonth ?? (filters.month === 'all' ? monthlyBalances.at(-1)?.monthKey : filters.month);
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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    resultsRef.current?.querySelectorAll<HTMLElement>('.movement-day li').forEach((row, index) => {
      row.animate(
        [{ opacity: .68, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 260, delay: Math.min(index, 5) * 24, easing: 'cubic-bezier(.2,.72,.18,1)' },
      );
    });
  }, [filterKey]);

  const updateFilter = (key: string, value: string, defaultValue = 'all') => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === defaultValue) next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="movement-page vertical-slice mineral-scene route-stage">
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <a className="skip-link" href="#movement-ledger">Pular para o extrato</a>
      <AppHeader unreadCount={unread} showAccent />
      <main className="movement-shell">
        <header className="movement-hero">
          <div>
            <Link className="back-link" to="/dashboard" viewTransition><ArrowLeft aria-hidden="true" /> Dashboard</Link>
            <p className="kicker">Histórico financeiro</p>
            <h1 tabIndex={-1} data-route-title>Movimento</h1>
            <p>Entradas, saídas e o saldo que cada lançamento deixou.</p>
          </div>
          <div className="movement-hero__balance">
            <span>Saldo disponível agora</span>
            <strong>{snapshot.preferences.concealBalance ? 'R$ ••••••' : formatMoney(snapshot.balance.available)}</strong>
            <Link to={`/seu-mes?mes=${months[months.length - 1]}`} viewTransition>Entender seu mês <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </header>

        <section className="movement-balance" aria-labelledby="balance-history-title">
          <div>
            <p className="section-index">Trajetória do saldo</p>
            <h2 id="balance-history-title">Evolução real</h2>
            <p>Foque uma transação para relacioná-la ao mês correspondente.</p>
          </div>
          <BalanceTrajectory points={monthlyBalances} activeMonth={activeTrajectoryMonth} />
        </section>

        <section className="movement-ledger" id="movement-ledger" aria-labelledby="movement-ledger-title">
          <header>
            <div><p className="section-index">Ledger</p><h2 id="movement-ledger-title">Transações</h2></div>
            <p role="status"><strong>{filtered.length}</strong> {filtered.length === 1 ? 'movimento encontrado' : 'movimentos encontrados'}</p>
          </header>

          <form className="movement-filters" role="search" onSubmit={(event) => event.preventDefault()}>
            <label className="movement-search" htmlFor="movement-search">
              <span>Buscar no movimento</span>
              <span><Search aria-hidden="true" /><input id="movement-search" type="search" value={filters.query} onChange={(event) => updateFilter('busca', event.target.value, '')} placeholder="Descrição ou contraparte" /></span>
            </label>
            <label><span>Período</span><select value={filters.month} onChange={(event) => updateFilter('mes', event.target.value)}><option value="all">Todos os meses</option>{[...months].reverse().map((month) => <option key={month} value={month}>{formatMonthLabel(month)}</option>)}</select></label>
            <label><span>Fluxo</span><select value={filters.direction} onChange={(event) => updateFilter('tipo', event.target.value)}><option value="all">Entradas e saídas</option><option value="in">Entradas</option><option value="out">Saídas</option></select></label>
            <label><span>Categoria</span><select value={filters.category} onChange={(event) => updateFilter('categoria', event.target.value)}><option value="all">Todas as categorias</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            {hasFilters && <button type="button" onClick={clearFilters}><X aria-hidden="true" /> Limpar filtros</button>}
          </form>

          <div className="movement-results" ref={resultsRef} data-filter-state={filterKey}>
          {groups.length === 0 ? (
            <div className="movement-empty">
              <p className="section-index">NENHUM RESULTADO</p>
              <h3>Nada atravessa esses filtros.</h3>
              <p>Revise a busca ou volte ao movimento completo.</p>
              <button type="button" onClick={clearFilters}>Ver todo o movimento</button>
            </div>
          ) : groups.map((group) => (
            <section className="movement-day" key={group.dateKey} aria-labelledby={`day-${group.dateKey}`}>
              <header><h3 id={`day-${group.dateKey}`}>{formatLedgerDate(group.dateKey)}</h3><span>{group.transactions.length} {group.transactions.length === 1 ? 'movimento' : 'movimentos'}</span></header>
              <ol>
                {group.transactions.map((transaction) => (
                  <li key={transaction.id}>
                    <Link to={`/movimentos/${transaction.id}`} viewTransition state={{ from: '/movimento', label: 'Movimento' }} style={{ viewTransitionName: returningTransactionId === transaction.id ? transactionTransitionName(transaction.id) : undefined }} onClick={(event) => { rememberTransactionSource(transaction.id); event.currentTarget.style.viewTransitionName = transactionTransitionName(transaction.id); }} onMouseEnter={() => setFocusedMonth(transaction.occurredAt.slice(0, 7))} onMouseLeave={() => setFocusedMonth(null)} onFocus={() => setFocusedMonth(transaction.occurredAt.slice(0, 7))} onBlur={() => setFocusedMonth(null)}>
                      <span className={`movement-row__direction movement-row__direction--${transaction.direction}`} aria-hidden="true">{transaction.direction === 'in' ? <ArrowDownLeft /> : <ArrowUpRight />}</span>
                      <span className="movement-row__identity"><strong>{transaction.title}</strong><small>{transaction.description}</small></span>
                      <span className="movement-row__meta"><strong>{transaction.direction === 'in' ? 'Entrada' : 'Saída'}</strong><small>{transaction.category} · {formatTime(transaction.occurredAt)}</small></span>
                      <span className="movement-row__value"><strong>{formatSignedMoney(transaction.amount, transaction.direction)}</strong><small>{statusLabels[transaction.status]}{balanceByTransaction.has(transaction.id) ? ` · saldo ${formatMoney(balanceByTransaction.get(transaction.id)!)}` : ''}</small></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
