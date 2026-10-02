import { ArrowLeft, Check, Copy, Eye, EyeOff, Lock, RotateCcw, Unlock, Wifi } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { canUseVirtualCard, cardInvoiceAmount, cardLimitAvailable, cardLimitUsed, cardPurchases } from '../domain/cards';
import { formatMoney, formatShortDate } from '../domain/formatters';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';
import { NewGenCard } from '../ui/NewGenCard';

export function CardRoute() {
  const snapshot = useFinancialStore();
  const card = snapshot.cards[0];
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [pendingStatus, setPendingStatus] = useState<typeof card.status | null>(null);
  const [limitDraft, setLimitDraft] = useState(card.limitAllocated);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const statusActionRef = useRef<HTMLButtonElement>(null);
  const purchases = useMemo(() => cardPurchases(snapshot.transactions, card.id), [snapshot.transactions, card.id]);
  const invoice = cardInvoiceAmount(snapshot, card.id);
  const used = cardLimitUsed(snapshot, card.id);
  const available = cardLimitAvailable(snapshot, card.id);
  const unread = snapshot.notifications.filter((item) => !item.read).length;
  const virtualAvailable = canUseVirtualCard(card);

  useEffect(() => { if (pendingStatus) confirmationRef.current?.focus(); }, [pendingStatus]);
  useEffect(() => {
    if (!revealed) return;
    const hide = () => setRevealed(false);
    const timer = window.setTimeout(hide, 20000);
    const visibility = () => { if (document.hidden) hide(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [revealed]);
  useEffect(() => { if (card.status === 'locked' || !card.onlinePurchasesEnabled) setRevealed(false); }, [card.status, card.onlinePurchasesEnabled]);

  const execute = (command: Parameters<typeof snapshot.submitCardCommand>[0]) => {
    const result = snapshot.submitCardCommand(command);
    setStatusMessage(result.message);
    return result.ok;
  };
  const confirmStatus = () => {
    if (!pendingStatus) return;
    execute({ type: 'set-status', cardId: card.id, status: pendingStatus, createdAt: new Date().toISOString() });
    setPendingStatus(null);
    requestAnimationFrame(() => statusActionRef.current?.focus());
  };
  const cancelStatus = () => {
    setPendingStatus(null);
    requestAnimationFrame(() => statusActionRef.current?.focus());
  };
  const toggleSetting = (type: 'set-contactless' | 'set-online-purchases', enabled: boolean) =>
    execute({ type, cardId: card.id, enabled, createdAt: new Date().toISOString() });
  const saveLimit = () => {
    if (execute({ type: 'set-limit-allocation', cardId: card.id, amount: limitDraft, createdAt: new Date().toISOString() })) setLimitDraft(limitDraft);
  };
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage(`${label} copiado.`);
    } catch {
      setStatusMessage(`Não foi possível copiar ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="card-page secondary-page vertical-slice mineral-scene route-stage">
      <div className="mineral-backdrop" aria-hidden="true" />
      <div className="mineral-atmosphere" aria-hidden="true" />
      <a className="skip-link" href="#card-content">Pular para o cartão</a>
      <AppHeader unreadCount={unread} showAccent />
      <main className="card-shell" id="card-content">
        <header className="card-header">
          <Link className="back-link" to="/dashboard" viewTransition><ArrowLeft aria-hidden="true" /> Dashboard</Link>
          <div><p className="kicker">INSTRUMENT / CARD SYSTEM</p><h1 tabIndex={-1} data-route-title>Seu cartão.<br />Sob seu controle.</h1></div>
          <p>Estado, capacidade e segurança respondem ao mesmo instrumento que você vê no Dashboard.</p>
        </header>

        <section className="card-stage" aria-labelledby="card-state-title">
          <div className="card-stage__object">
            <div className="card-object-control">
              <NewGenCard card={card} spatial flipped={flipped} revealSensitive={revealed} onFaceChange={setFlipped} />
            </div>
            <div className="card-object-actions">
              <button type="button" onClick={() => setFlipped((value) => !value)}><RotateCcw aria-hidden="true" /> {flipped ? 'Ver frente' : 'Ver verso'}</button>
              <span>CLIQUE OU TOQUE E ARRASTE PARA MANIPULAR EM 3D</span>
            </div>
          </div>
          <div className="card-stage__state">
            <p className="section-index">ESTADO OPERACIONAL</p>
            <h2 id="card-state-title">{card.status === 'active' ? 'Ativo e disponível.' : 'Bloqueado e protegido.'}</h2>
            <p>{card.status === 'active' ? 'Compras seguem as permissões configuradas abaixo.' : 'Compras, aproximação e dados virtuais permanecem indisponíveis.'}</p>
            <button ref={statusActionRef} className={`card-status-action card-status-action--${card.status}`} type="button" onClick={() => setPendingStatus(card.status === 'active' ? 'locked' : 'active')}>
              {card.status === 'active' ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}
              {card.status === 'active' ? 'Bloquear cartão' : 'Desbloquear cartão'}
            </button>
            {pendingStatus && <div className="card-confirmation" ref={confirmationRef} tabIndex={-1} role="group" aria-live="polite" aria-labelledby="card-confirmation-title">
              <strong id="card-confirmation-title">{pendingStatus === 'locked' ? 'Bloquear este cartão?' : 'Restaurar o uso deste cartão?'}</strong>
              <p>{pendingStatus === 'locked' ? 'Novas compras e o cartão virtual ficarão indisponíveis.' : 'As permissões configuradas voltarão a operar.'}</p>
              <div><button type="button" onClick={cancelStatus}>Cancelar</button><button type="button" onClick={confirmStatus}>Confirmar</button></div>
            </div>}
          </div>
        </section>

        <section className="card-capacity" aria-labelledby="capacity-title">
          <header><p className="section-index">CAPACIDADE FINANCEIRA</p><h2 id="capacity-title">Limite como fronteira.</h2></header>
          <div className="capacity-boundary" style={{ '--used-ratio': `${Math.min(100, used / card.limitAllocated * 100)}%` } as CSSProperties}>
            <span className="capacity-boundary__used" aria-hidden="true" />
            <dl><div><dt>Limite total</dt><dd>{formatMoney(card.limitTotal)}</dd></div><div><dt>Utilizado</dt><dd>{formatMoney(used)}</dd></div><div><dt>Disponível</dt><dd>{formatMoney(available)}</dd></div></dl>
          </div>
          <div className="limit-control">
            <label htmlFor="card-limit">Organizar limite do cartão</label>
            <input id="card-limit" type="range" min={Math.ceil(used / 100) * 100} max={card.limitTotal} step="100" value={limitDraft} onChange={(event) => { setLimitDraft(Number(event.target.value)); setStatusMessage(''); }} />
            <div><span>Usar no cartão: <strong>{formatMoney(limitDraft)}</strong></span><span>Manter fora do cartão: <strong>{formatMoney(card.limitTotal - limitDraft)}</strong></span></div>
            <button type="button" onClick={saveLimit} disabled={limitDraft === card.limitAllocated}>Confirmar organização</button>
          </div>
        </section>

        <section className="card-settings" aria-labelledby="settings-title">
          <header><p className="section-index">CONTROLES</p><h2 id="settings-title">Permissões essenciais.</h2></header>
          <div className="settings-ledger">
            <div><span className="settings-ledger__icon"><Wifi aria-hidden="true" /></span><span><strong>Aproximação</strong><small>{card.contactlessEnabled ? 'Disponível em terminais compatíveis.' : 'Compras por aproximação estão indisponíveis.'}</small></span><button type="button" role="switch" aria-checked={card.contactlessEnabled} disabled={card.status === 'locked'} onClick={() => toggleSetting('set-contactless', !card.contactlessEnabled)}><span /></button></div>
            <div><span className="settings-ledger__icon">WWW</span><span><strong>Compras online</strong><small>{card.onlinePurchasesEnabled ? 'O cartão virtual pode operar.' : 'O cartão virtual não pode ser usado em compras.'}</small></span><button type="button" role="switch" aria-checked={card.onlinePurchasesEnabled} disabled={card.status === 'locked'} onClick={() => toggleSetting('set-online-purchases', !card.onlinePurchasesEnabled)}><span /></button></div>
          </div>
        </section>

        <section className="virtual-card" aria-labelledby="virtual-title">
          <header><p className="section-index">CARTÃO VIRTUAL</p><h2 id="virtual-title">Dados sob reveal.</h2><p>{virtualAvailable ? 'Disponível para compras online.' : 'Indisponível enquanto o cartão estiver bloqueado ou compras online estiverem desativadas.'}</p></header>
          <div className="virtual-card__data" aria-disabled={!virtualAvailable}>
            <div><span>Número</span><strong>{revealed ? card.virtualNumber.replace(/(.{4})/g, '$1 ').trim() : `•••• •••• •••• ${card.lastFour}`}</strong>{revealed && <button type="button" onClick={() => copy(card.virtualNumber, 'Número') }><Copy aria-hidden="true" /> Copiar</button>}</div>
            <div><span>Validade</span><strong>{revealed ? card.expiresAt : '••/••'}</strong>{revealed && <button type="button" onClick={() => copy(card.expiresAt, 'Validade')}><Copy aria-hidden="true" /> Copiar</button>}</div>
            <div><span>CVV</span><strong>{revealed ? card.virtualCvv : '•••'}</strong>{revealed && <button type="button" onClick={() => copy(card.virtualCvv, 'CVV')}><Copy aria-hidden="true" /> Copiar</button>}</div>
            <button className="virtual-card__reveal" type="button" disabled={!virtualAvailable} onClick={() => { setRevealed((value) => !value); setFlipped(true); }}>{revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{revealed ? 'Ocultar dados' : 'Revelar dados'}</button>
          </div>
        </section>

        <section className="invoice-section" aria-labelledby="invoice-title">
          <header><div><p className="section-index">FATURA ATUAL</p><h2 id="invoice-title">{formatMoney(invoice)}</h2></div><dl><div><dt>Período</dt><dd>04–29 SET</dd></div><div><dt>Fecha</dt><dd>Dia {card.invoiceClosingDay}</dd></div><div><dt>Vence</dt><dd>Dia {card.invoiceDueDay}</dd></div><div><dt>Status</dt><dd>Aberta</dd></div></dl></header>
          <ol>{purchases.map((purchase) => <li key={purchase.id}><Link to={`/movimentos/${purchase.id}`} state={{ from: '/cartao', label: 'Fatura do cartão' }}><span><strong>{purchase.title}</strong><small>{purchase.description}</small></span><time dateTime={purchase.occurredAt}>{formatShortDate(purchase.occurredAt)}</time><strong>{formatMoney(purchase.amount)}</strong></Link></li>)}</ol>
        </section>
        <p className="card-status-message" role="status" aria-live="polite">{statusMessage && <><Check aria-hidden="true" /> {statusMessage}</>}</p>
      </main>
      <MobileNav />
    </div>
  );
}
