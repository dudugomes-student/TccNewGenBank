import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatMoney, formatMonthLabel } from '../domain/formatters';
import {
  availableTransactionMonths,
  compareMonth,
  deriveMonthlyClosingBalances,
  findRecurringMovements,
} from '../domain/movement';
import { useRouteFocus } from '../motion/useRouteFocus';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { BalanceTrajectory } from '../ui/BalanceTrajectory';
import { MobileNav } from '../ui/MobileNav';
import { MonthScrub } from '../ui/MonthScrub';

const comparisonSentence = (value: number | null, subject: string, previousExists: boolean) => {
  if (!previousExists) return 'Este é o primeiro mês disponível para comparação.';
  if (value === null) return `${subject} ganhou uma nova base neste mês; o mês anterior não tinha valor comparável.`;
  if (Math.abs(value) < 0.05) return `${subject} permaneceu no mesmo nível do mês anterior.`;
  return `${subject} ficou ${Math.abs(value).toFixed(1).replace('.', ',')}% ${value > 0 ? 'acima' : 'abaixo'} do mês anterior.`;
};

export function MonthRoute() {
  useRouteFocus();
  const snapshot = useFinancialStore();
  const unread = snapshot.notifications.filter((item) => !item.read).length;
  const [searchParams, setSearchParams] = useSearchParams();
  const months = useMemo(() => availableTransactionMonths(snapshot.transactions), [snapshot.transactions]);
  const requestedMonth = searchParams.get('mes');
  const selectedMonth = requestedMonth && months.includes(requestedMonth) ? requestedMonth : months[months.length - 1];
  const comparison = useMemo(() => compareMonth(snapshot.transactions, selectedMonth), [snapshot.transactions, selectedMonth]);
  const recurring = useMemo(() => findRecurringMovements(snapshot.transactions).filter((item) => item.months.includes(selectedMonth)), [snapshot.transactions, selectedMonth]);
  const closingBalances = useMemo(() => deriveMonthlyClosingBalances(snapshot.transactions, snapshot.balance.available), [snapshot.transactions, snapshot.balance.available]);
  const closingBalance = closingBalances.find((item) => item.monthKey === selectedMonth)?.balance ?? snapshot.balance.available;
  const { current, previous } = comparison;
  const leadingCategoryChange = current.leadingCategory ? comparison.categoryPercent[current.leadingCategory.category] : null;
  const resultLabel = current.net >= 0 ? 'positivo' : 'negativo';
  const [monthDirection, setMonthDirection] = useState<'forward' | 'backward'>('forward');
  const updateMonth = (monthKey: string) => {
    setMonthDirection(months.indexOf(monthKey) >= months.indexOf(selectedMonth) ? 'forward' : 'backward');
    setSearchParams({ mes: monthKey }, { replace: true });
  };

  return (
    <div className="month-page vertical-slice mineral-scene route-stage">
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <a className="skip-link" href="#month-reading">Pular para a leitura do mês</a>
      <AppHeader unreadCount={unread} showAccent />
      <main className="month-shell">
        <header className="month-hero">
          <Link className="back-link" to="/dashboard" viewTransition><ArrowLeft aria-hidden="true" /> Dashboard</Link>
          <p className="kicker">Leitura financeira</p>
          <h1 tabIndex={-1} data-route-title>Seu mês</h1>
          <p>Resultado, fluxo, categorias e recorrências do período selecionado.</p>
        </header>

        <MonthScrub months={months} selectedMonth={selectedMonth} onChange={updateMonth} />

        <div id="month-reading" className={`month-reading month-reading--${monthDirection}`} key={selectedMonth} data-month={selectedMonth}>
          <section className="month-result" aria-labelledby="month-result-title">
            <div className="month-result__main">
              <p className="section-index">{formatMonthLabel(selectedMonth).toUpperCase()}</p>
              <h2 id="month-result-title">O mês terminou em<br /><strong>{formatMoney(closingBalance)}</strong></h2>
              <p>Resultado líquido {resultLabel} de <strong>{formatMoney(Math.abs(current.net))}</strong>.</p>
            </div>
            <dl>
              <div><dt>Entrou</dt><dd className="positive">{formatMoney(current.incoming)}</dd></div>
              <div><dt>Saiu</dt><dd>{formatMoney(current.outgoing)}</dd></div>
              <div><dt>Movimentado</dt><dd>{formatMoney(current.movement)}</dd></div>
              <div><dt>Movimentos</dt><dd>{current.transactionCount}</dd></div>
            </dl>
            <div className="month-result__trajectory"><BalanceTrajectory points={closingBalances} activeMonth={selectedMonth} /></div>
          </section>

          <section className="month-flow" aria-labelledby="month-flow-title">
            <header><p className="section-index">Fluxo do mês</p><h2 id="month-flow-title">Quatro leituras</h2></header>
            <ol>
              <li><span>01</span><p>Você movimentou <strong>{formatMoney(current.movement)}</strong> em {formatMonthLabel(selectedMonth).toLocaleLowerCase('pt-BR')}.</p></li>
              <li><span>02</span><p><strong>{formatMoney(current.incoming)}</strong> entrou e <strong>{formatMoney(current.outgoing)}</strong> saiu.</p></li>
              <li><span>03</span><p>{current.leadingCategory ? <><strong>{current.leadingCategory.category}</strong> concentrou {(current.leadingCategory.share * 100).toFixed(0)}% das saídas.</> : 'Não houve saídas categorizadas neste mês.'}</p></li>
              <li><span>04</span><p>{comparisonSentence(comparison.outgoingPercent, 'O total de saídas', Boolean(previous))}</p></li>
            </ol>
          </section>

          <section className="month-categories" aria-labelledby="month-categories-title">
            <header><div><p className="section-index">CONCENTRAÇÃO</p><h2 id="month-categories-title">Onde o dinheiro ficou.</h2></div><p>As barras representam participação nas saídas e mantêm o valor em texto.</p></header>
            {current.categories.length > 0 ? <ol>{current.categories.map((item) => <li key={item.category}><div><strong>{item.category}</strong><span>{formatMoney(item.amount)} · {(item.share * 100).toFixed(0)}%</span></div><span className="month-category-bar" style={{ '--category-share': `${item.share * 100}%` } as CSSProperties}><span /></span></li>)}</ol> : <p>Sem saídas neste período.</p>}
          </section>

          <section className="month-comparison" aria-labelledby="month-comparison-title">
            <div><p className="section-index">COMPARAÇÃO</p><h2 id="month-comparison-title">O contexto muda junto.</h2></div>
            <div className="month-comparison__copy">
              <p>{comparisonSentence(comparison.incomingPercent, 'As entradas', Boolean(previous))}</p>
              <p>{comparisonSentence(comparison.outgoingPercent, 'As saídas', Boolean(previous))}</p>
              {current.leadingCategory && <p>{comparisonSentence(leadingCategoryChange, current.leadingCategory.category, Boolean(previous))}</p>}
              {previous && <small>Base: {formatMonthLabel(previous.monthKey)}. Percentuais usam valores absolutos do mês anterior.</small>}
            </div>
          </section>

          <section className="month-recurring" aria-labelledby="month-recurring-title">
            <header><div><p className="section-index">RECORRÊNCIA</p><h2 id="month-recurring-title">O que voltou a acontecer.</h2></div><p>Somente movimentos encontrados em pelo menos três meses e dentro de uma faixa estável.</p></header>
            {recurring.length > 0 ? <ol>{recurring.slice(0, 5).map((item) => <li key={item.key}><span><strong>{item.label}</strong><small>{item.category} · {item.occurrences} ocorrências</small></span><strong>{formatMoney(item.averageAmount)} <small>em média</small></strong></li>)}</ol> : <p>Não há evidência suficiente de recorrência neste período.</p>}
          </section>

          <footer className="month-reading__footer">
            <p>Quer atravessar cada lançamento?</p>
            <Link to={`/movimento?mes=${selectedMonth}`} viewTransition>Abrir movimento de {formatMonthLabel(selectedMonth, 'short')} <ArrowRight aria-hidden="true" /></Link>
          </footer>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
