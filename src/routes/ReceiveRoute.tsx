import { useSiteReducedMotion } from '../motion/MotionProvider';
import { ArrowLeft, ArrowRight, Copy, Share2, Sparkles } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../domain/formatters';
import type { Transaction } from '../domain/models';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { BalanceReaction } from '../ui/BalanceReaction';
import { Receipt } from '../ui/Receipt';

type ReceiveStep = 'form' | 'charge' | 'reaction' | 'receipt';
const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, '')) / 100;

const copyText = async (text: string) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Ambientes sem permissão de clipboard seguem para o fallback local.
    }
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard indisponível.');
};

export function ReceiveRoute() {
  const reducedMotion = useSiteReducedMotion();
  const snapshot = useFinancialStore();
  const resumableCharge = snapshot.charges.find((charge) => charge.status !== 'received');
  const [step, setStep] = useState<ReceiveStep>(resumableCharge ? 'charge' : 'form');
  const [chargeId, setChargeId] = useState<string | null>(resumableCharge?.id ?? null);
  const [amount, setAmount] = useState(resumableCharge?.amount ?? 0);
  const [amountText, setAmountText] = useState(resumableCharge?.amount ? resumableCharge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
  const [description, setDescription] = useState(resumableCharge?.description ?? '');
  const [openAmount, setOpenAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const operationId = useRef(crypto.randomUUID());
  const receiveLock = useRef(false);
  const reactionTimer = useRef<number | null>(null);
  const currentCharge = useMemo(() => snapshot.charges.find((charge) => charge.id === chargeId) ?? null, [snapshot.charges, chargeId]);
  const unread = snapshot.notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const target = step === 'receipt' ? document.getElementById('receipt-title') : document.querySelector<HTMLElement>(`[data-receive-step-title="${step}"]`);
    target?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => () => { if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current); }, []);

  const createCharge = (event: FormEvent) => {
    event.preventDefault();
    const id = `charge_${crypto.randomUUID()}`;
    const result = snapshot.createCharge({ chargeId: id, amount: amount || undefined, description, createdAt: new Date().toISOString() });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setChargeId(id);
    setError('');
    setMessage('Cobrança demo criada e salva neste dispositivo.');
    setStep('charge');
  };

  const markShared = () => {
    if (!currentCharge || currentCharge.status === 'received') return;
    snapshot.markChargeShared(currentCharge.id);
  };

  const copyCharge = async () => {
    if (!currentCharge) return;
    try {
      await copyText(currentCharge.code);
      markShared();
      setMessage('Código demo copiado. Cobrança marcada como compartilhada.');
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione o código exibido acima.');
    }
  };

  const shareCharge = async () => {
    if (!currentCharge) return;
    const text = `Cobrança demo NewGenBank${currentCharge.amount ? ` · ${formatMoney(currentCharge.amount)}` : ''}\n${currentCharge.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cobrança demo NewGenBank', text });
        markShared();
        setMessage('Cobrança compartilhada.');
      } else {
        await copyCharge();
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setMessage('Não foi possível compartilhar. Use a ação de copiar.');
    }
  };

  const simulateReceipt = () => {
    if (!currentCharge || receiveLock.current) return;
    receiveLock.current = true;
    const receivedAmount = currentCharge.amount ?? parseMoneyInput(openAmount);
    const result = snapshot.receiveCharge({ chargeId: currentCharge.id, operationId: operationId.current, amount: receivedAmount, createdAt: new Date().toISOString() });
    if (!result.ok) {
      setError(result.message);
      receiveLock.current = false;
      return;
    }
    setTransaction(result.transaction);
    setError('');
    setStep('reaction');
    const duration = reducedMotion ? 0 : 1080;
    reactionTimer.current = window.setTimeout(() => { setStep('receipt'); reactionTimer.current = null; }, duration);
  };

  const startNew = () => {
    if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = null;
    setStep('form');
    setChargeId(null);
    setAmount(0);
    setAmountText('');
    setDescription('');
    setOpenAmount('');
    setMessage('');
    setError('');
    setTransaction(null);
    operationId.current = crypto.randomUUID();
    receiveLock.current = false;
  };

  const statusLabel = currentCharge?.status === 'shared' ? 'Compartilhada' : currentCharge?.status === 'received' ? 'Recebida' : 'Criada';

  return <div className="operation-page receive-page vertical-slice mineral-scene route-stage" data-operation-step={step}>
    <div className="mineral-backdrop" aria-hidden="true" />
    <div className="mineral-atmosphere" aria-hidden="true" />
    <a className="skip-link" href="#receive-content">Pular para Receber</a>
    <AppHeader unreadCount={unread} showAccent />
    <main className="operation-shell" id="receive-content">
      <header className="operation-header">
        <Link to="/dashboard" className="back-link" viewTransition><ArrowLeft aria-hidden="true" /> Dashboard</Link>
        <div><p className="kicker">Receber</p><h1 tabIndex={-1} data-receive-step-title={step === 'form' ? 'form' : undefined}>{step === 'receipt' ? 'Entrada registrada' : 'Criar cobrança'}</h1></div>
        <div className="operation-header__balance"><span>Conta recebedora</span><strong>{snapshot.account.firstName}</strong><small>{snapshot.account.institution}</small></div>
      </header>

      {step === 'form' && <section className="operation-stage" aria-labelledby="receive-form-title">
        <div className="operation-context"><span>Nova solicitação</span><h2 id="receive-form-title">Defina a cobrança</h2><p>O valor pode ficar em aberto. A solicitação será vinculada à conta {snapshot.account.number}; nenhum Pix real será criado.</p></div>
        <form className="operation-form operation-surface" onSubmit={createCharge} noValidate>
          <div className="demo-notice"><strong>SIMULAÇÃO</strong><p>Este código funciona somente dentro do protótipo NewGenBank.</p></div>
          <label htmlFor="receive-amount">Valor <span>opcional</span></label>
          <div className="operation-money-input"><span>R$</span><input id="receive-amount" inputMode="numeric" value={amountText} onChange={(event) => { const next = parseMoneyInput(event.target.value); setAmount(next); setAmountText(next ? next.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''); setError(''); }} placeholder="0,00" /></div>
          <label htmlFor="receive-description">Descrição <span>opcional</span></label>
          <input className="operation-line-input" id="receive-description" maxLength={80} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: divisão do jantar" />
          {error && <p className="field__error" role="alert">{error}</p>}
          <button className="ngb-button ngb-button--primary operation-primary" type="submit">Gerar cobrança demo <ArrowRight aria-hidden="true" /></button>
        </form>
      </section>}

      {step === 'charge' && currentCharge && <section className="charge-stage" aria-labelledby="charge-title">
        <div className="charge-object" aria-hidden="true"><span>COBRANÇA DEMO</span><strong>{currentCharge.amount ? formatMoney(currentCharge.amount) : 'ABERTA'}</strong><small>{statusLabel.toLocaleUpperCase('pt-BR')}</small></div>
        <div className="charge-content operation-surface">
          <p className="section-index">Cobrança {statusLabel.toLocaleLowerCase('pt-BR')}</p>
          <h2 id="charge-title" tabIndex={-1} data-receive-step-title="charge">Pronta para compartilhar.</h2>
          <p className="charge-amount">{currentCharge.amount ? formatMoney(currentCharge.amount) : 'Valor em aberto'}</p>
          <dl className="operation-ledger"><div><dt>Conta recebedora</dt><dd>{snapshot.account.ownerName}<small>{snapshot.account.institution} · {snapshot.account.number}</small></dd></div>{currentCharge.description && <div><dt>Motivo</dt><dd>{currentCharge.description}</dd></div>}<div><dt>Status</dt><dd>{statusLabel}</dd></div><div><dt>Código copia e cola demo</dt><dd className="receipt__id">{currentCharge.code}</dd></div></dl>
          <div className="charge-actions"><button type="button" onClick={copyCharge}><Copy aria-hidden="true" /> Copiar código</button><button type="button" onClick={shareCharge}><Share2 aria-hidden="true" /> Compartilhar</button></div>
          {!currentCharge.amount && <div className="open-charge-value"><label htmlFor="open-charge-amount">Valor recebido na simulação</label><div className="compact-money-input"><span>R$</span><input id="open-charge-amount" inputMode="numeric" value={openAmount} onChange={(event) => { const next = parseMoneyInput(event.target.value); setOpenAmount(next ? next.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''); setError(''); }} placeholder="0,00" /></div></div>}
          {error && <p className="field__error" role="alert">{error}</p>}
          <button className="ngb-button ngb-button--primary operation-primary" type="button" onClick={simulateReceipt}><Sparkles aria-hidden="true" /> Simular recebimento</button>
          <button className="operation-text-action" type="button" onClick={startNew}>Criar outra cobrança</button>
          <p className="sr-status" role="status" aria-live="polite">{message}</p>
        </div>
      </section>}

      {step === 'reaction' && transaction && <BalanceReaction amount={transaction.amount} direction="in" previousBalance={snapshot.balance.available - transaction.amount} currentBalance={snapshot.balance.available} detail="cobrança demo recebida" statusLabel="Entrada confirmada" titleId="receive-reaction-title" focusAttribute="data-receive-step-title" />}

      {step === 'receipt' && transaction && <section className="receipt-stage"><Receipt transaction={transaction} headingLevel="h2" /><div className="receipt-next"><Link className="ngb-button ngb-button--primary" to={`/movimentos/${transaction.id}`} viewTransition>Abrir no Movimento <ArrowRight aria-hidden="true" /></Link><button className="ngb-button ngb-button--secondary" type="button" onClick={startNew}>Criar outra cobrança</button></div></section>}
    </main>
  </div>;
}
