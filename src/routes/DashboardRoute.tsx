import { ArrowDownLeft, ArrowRight, ArrowUpRight, CreditCard, Eye, EyeOff, Plus, ReceiptText, Send } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calculatePercentageChange, formatMoney, formatShortDate, formatSignedMoney } from '../domain/formatters';
import { recentTransactions, sumTransactions } from '../domain/selectors';
import { useRouteFocus } from '../motion/useRouteFocus';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';
import { NewGenCard } from '../ui/NewGenCard';
import { NewGenFlow } from '../ui/NewGenFlow';

const actions = [
  { label: 'Fazer Pix', detail: 'Enviar agora', Icon: ArrowUpRight, href: '/pix' },
  { label: 'Receber', detail: 'Indisponível', Icon: ArrowDownLeft, disabled: true },
  { label: 'Pagar', detail: 'Indisponível', Icon: ReceiptText, disabled: true },
  { label: 'Cartão', detail: 'Gerenciar instrumento', Icon: CreditCard, href: '/cartao' },
];

export function DashboardRoute() {
  useRouteFocus();
  const snapshot = useFinancialStore();
  const transactions = useMemo(() => recentTransactions(snapshot.transactions), [snapshot.transactions]);
  const incoming = useMemo(() => sumTransactions(snapshot.transactions, 'in'), [snapshot.transactions]);
  const outgoing = useMemo(() => sumTransactions(snapshot.transactions, 'out'), [snapshot.transactions]);
  const change = calculatePercentageChange(snapshot.balance.available, snapshot.balance.previousMonth);
  const card = snapshot.cards[0];
  const cardPurchases = snapshot.transactions.filter((transaction) => transaction.cardId === card.id && transaction.type === 'purchase');
  const cardInvoice = cardPurchases.reduce((total, transaction) => total + transaction.amount, 0);
  const unread = snapshot.notifications.filter((item) => !item.read).length;

  return (
    <div className="dashboard-page route-stage">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <AppHeader unreadCount={unread} />
      <main className="dashboard" id="main-content">
        <header className="dashboard-intro">
          <div><p className="kicker">CONTA PESSOAL / {snapshot.account.number}</p><h1 tabIndex={-1} data-route-title>Bom dia, {snapshot.account.firstName}.</h1></div>
          <p>Seu dinheiro está em movimento.<br />Veja o que mudou antes de escolher o próximo passo.</p>
        </header>

        <section className="capital-section" id="capital" aria-labelledby="capital-title">
          <div className="section-marker"><span>01</span><p>CAPITAL</p></div>
          <div className="capital-main">
            <p id="capital-title">Saldo disponível</p>
            <div className="balance-line">
              <strong aria-live="polite">{snapshot.preferences.concealBalance ? 'R$ ••••••' : formatMoney(snapshot.balance.available)}</strong>
              <button type="button" onClick={() => snapshot.setBalanceVisibility(!snapshot.preferences.concealBalance)} aria-pressed={snapshot.preferences.concealBalance} aria-label={snapshot.preferences.concealBalance ? 'Mostrar saldo' : 'Ocultar saldo'}>
                {snapshot.preferences.concealBalance ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
              </button>
            </div>
            <div className="capital-context"><span className="positive">↑ {change.toFixed(1).replace('.', ',')}% no mês</span><span>Atualizado hoje, 09:42</span></div>
          </div>
          <div className="capital-note"><span>DISPONIBILIDADE</span><p>Use, receba ou reserve. Cada ação atualiza este capital.</p></div>
        </section>

        <section className="action-strip" aria-labelledby="actions-title">
          <header><p className="section-index">AGORA</p><h2 id="actions-title">O que você quer fazer?</h2></header>
          <div className="action-strip__list">
            {actions.map(({ label, detail, Icon, href, disabled }, index) => {
              const content = <><span className="action-strip__number">0{index + 1}</span><span className="action-strip__icon"><Icon aria-hidden="true" /></span><span className="action-strip__text"><strong>{label}</strong><small>{detail}</small></span><ArrowRight className="action-strip__arrow" aria-hidden="true" /></>;
              return href ? <Link key={label} to={href} className="action-strip__action">{content}</Link> : <button type="button" key={label} disabled={disabled} aria-disabled="true">
                {content}
              </button>
            })}
          </div>
        </section>

        <section className="motion-section" id="movimento" aria-labelledby="motion-title">
          <div className="section-marker"><span>02</span><p>MOTION</p></div>
          <div className="motion-copy"><p className="section-index">SEU MÊS</p><h2 id="motion-title">O dinheiro muda.<br />O contexto fica.</h2><p>As cinco movimentações recentes formam este fluxo. Cada ponto corresponde a um valor real da demonstração.</p></div>
          <div className="motion-data">
            <NewGenFlow transactions={transactions} />
            <dl><div><dt>Entrou</dt><dd className="positive">{formatMoney(incoming)}</dd></div><div><dt>Saiu</dt><dd>{formatMoney(outgoing)}</dd></div></dl>
          </div>
        </section>

        <section className="instrument-section" id="instrumento" aria-labelledby="instrument-title">
          <div className="section-marker section-marker--light"><span>03</span><p>INSTRUMENT</p></div>
          <Link to="/cartao" className="instrument-card" aria-label={`Gerenciar cartão ${card.status === 'active' ? 'ativo' : 'bloqueado'}, final ${card.lastFour}`}><NewGenCard card={card} compact /></Link>
          <div className="instrument-copy"><p className="section-index">CARTÃO NEWGEN</p><h2 id="instrument-title">Seu dinheiro<br />ganha forma.</h2><dl><div><dt>Fatura atual</dt><dd>{formatMoney(cardInvoice)}</dd></div><div><dt>Limite disponível</dt><dd>{formatMoney(Math.max(0, card.limitAllocated - cardInvoice))}</dd></div></dl><p className="instrument-copy__status">Cartão {card.status === 'active' ? 'ativo' : 'bloqueado'} · final {card.lastFour}</p><Link className="instrument-copy__link" to="/cartao">Gerenciar cartão <ArrowRight aria-hidden="true" /></Link></div>
        </section>

        <section className="ledger-section" aria-labelledby="ledger-title">
          <header><div><p className="section-index">LEDGER / ÚLTIMOS MOVIMENTOS</p><h2 id="ledger-title">Movimento recente</h2></div></header>
          <ol className="ledger-list">
            {transactions.map((transaction) => (
              <li key={transaction.id}><Link to={`/movimentos/${transaction.id}`} aria-label={`Ver detalhes de ${transaction.title}`}>
                <span className={`ledger-direction ledger-direction--${transaction.direction}`} aria-hidden="true">{transaction.direction === 'in' ? <Plus /> : <Send />}</span>
                <span className="ledger-title"><strong>{transaction.title}</strong><small>{transaction.category}</small></span>
                <time dateTime={transaction.occurredAt}>{formatShortDate(transaction.occurredAt)}</time>
                <strong className={transaction.direction === 'in' ? 'positive' : ''}>{formatSignedMoney(transaction.amount, transaction.direction)}</strong>
              </Link></li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="app-footer"><span>NEWGENBANK © 2026</span><span>SEU DINHEIRO. SUAS ESCOLHAS.</span></footer>
      <MobileNav />
    </div>
  );
}
