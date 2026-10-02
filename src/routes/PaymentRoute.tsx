import { ArrowLeft, ArrowRight, FileSearch2 } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { demoBills, findDemoBill } from '../data/demoBills';
import { formatDateTime, formatMoney } from '../domain/formatters';
import type { Transaction } from '../domain/models';
import type { DemoBill } from '../domain/payments';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { BalanceReaction } from '../ui/BalanceReaction';
import { Receipt } from '../ui/Receipt';

type PaymentStep = 'identify' | 'review' | 'reaction' | 'receipt';

export function PaymentRoute() {
  const snapshot = useFinancialStore();
  const [step, setStep] = useState<PaymentStep>('identify');
  const [reference, setReference] = useState('');
  const [bill, setBill] = useState<DemoBill | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState('');
  const confirmLock = useRef(false);
  const operationId = useRef(crypto.randomUUID());
  const reactionTimer = useRef<number | null>(null);
  const unread = snapshot.notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const target = step === 'receipt' ? document.getElementById('receipt-title') : document.querySelector<HTMLElement>(`[data-payment-step-title="${step}"]`);
    target?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => () => { if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current); }, []);

  const identifyBill = (event: FormEvent) => {
    event.preventDefault();
    const found = findDemoBill(reference);
    if (!found) {
      setError('Referência demo não encontrada. Use uma das cobranças de exemplo.');
      requestAnimationFrame(() => document.getElementById('payment-reference')?.focus());
      return;
    }
    if (snapshot.transactions.some((item) => item.billingId === found.id)) {
      setError('Esta cobrança demo já foi paga e está registrada em Movimento.');
      return;
    }
    setBill(found);
    setError('');
    setStep('review');
  };

  const confirmPayment = () => {
    if (!bill || confirmLock.current) return;
    confirmLock.current = true;
    const result = snapshot.submitPayment({ operationId: operationId.current, bill, createdAt: new Date().toISOString() });
    if (!result.ok) {
      setError(result.message);
      confirmLock.current = false;
      return;
    }
    setTransaction(result.transaction);
    setError('');
    setStep('reaction');
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1120;
    reactionTimer.current = window.setTimeout(() => { setStep('receipt'); reactionTimer.current = null; }, duration);
  };

  const startAnother = () => {
    if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = null;
    setStep('identify');
    setReference('');
    setBill(null);
    setTransaction(null);
    setError('');
    operationId.current = crypto.randomUUID();
    confirmLock.current = false;
  };

  return <div className="operation-page payment-page vertical-slice mineral-scene route-stage" data-operation-step={step}>
    <div className="mineral-backdrop" aria-hidden="true" />
    <div className="mineral-atmosphere" aria-hidden="true" />
    <a className="skip-link" href="#payment-content">Pular para Pagar</a>
    <AppHeader unreadCount={unread} showAccent />
    <main className="operation-shell" id="payment-content">
      <header className="operation-header operation-header--payment">
        <Link to="/dashboard" className="back-link" viewTransition><ArrowLeft aria-hidden="true" /> Dashboard</Link>
        <div><p className="kicker">Pagar</p><h1 tabIndex={-1} data-payment-step-title={step === 'identify' ? 'identify' : undefined}>{step === 'receipt' ? 'Pagamento registrado' : 'Resolver cobrança'}</h1></div>
        <div className="operation-header__balance"><span>Saldo disponível</span><strong>{formatMoney(snapshot.balance.available)}</strong><small>Conta {snapshot.account.number}</small></div>
      </header>

      {step === 'identify' && <section className="payment-identify" aria-labelledby="payment-identify-title">
        <div className="payment-identify__content"><span className="operation-icon"><FileSearch2 aria-hidden="true" /></span><p className="section-index">Identificação</p><h2 id="payment-identify-title" tabIndex={-1}>Identifique a cobrança</h2><p>Use uma referência preparada para este ambiente. Nenhum boleto real será consultado.</p></div>
        <form className="payment-reference-form operation-surface" onSubmit={identifyBill} noValidate>
          <div className="demo-notice"><strong>AMBIENTE DEMO</strong><p>As referências abaixo são dados fictícios e testáveis.</p></div>
          <label htmlFor="payment-reference">Referência da cobrança</label>
          <input id="payment-reference" value={reference} onChange={(event) => { setReference(event.target.value); setError(''); }} autoComplete="off" spellCheck="false" placeholder="NGB-DEMO-..." aria-invalid={Boolean(error)} aria-describedby={error ? 'payment-error payment-help' : 'payment-help'} />
          <p id="payment-help" className="payment-examples">Usar exemplo: {demoBills.map((item) => <button type="button" key={item.id} onClick={() => { setReference(item.reference); setError(''); }}>{item.description}</button>)}</p>
          {error && <p id="payment-error" className="field__error" role="alert">{error}</p>}
          <button className="ngb-button ngb-button--primary operation-primary" type="submit">Identificar cobrança <ArrowRight aria-hidden="true" /></button>
        </form>
      </section>}

      {step === 'review' && bill && <section className="payment-review" aria-labelledby="payment-review-title">
        <div className="payment-review__lead"><p className="section-index">Revisão</p><h2 id="payment-review-title" tabIndex={-1} data-payment-step-title="review">Obrigação identificada</h2><p>Confira beneficiário, vencimento e saldo final antes de pagar.</p></div>
        <div className="payment-slip operation-surface"><div className="payment-slip__edge"><span>COBRANÇA DEMO</span><strong>{bill.reference}</strong></div><p className="payment-slip__amount">{formatMoney(bill.amount)}</p><dl className="operation-ledger"><div><dt>Beneficiário</dt><dd>{bill.beneficiary}</dd></div><div><dt>Descrição</dt><dd>{bill.description}</dd></div><div><dt>Vencimento</dt><dd>{formatDateTime(bill.dueDate).date}</dd></div><div><dt>Origem</dt><dd>{snapshot.account.institution}<small>Ag. {snapshot.account.branch} · Conta {snapshot.account.number}</small></dd></div><div><dt>Saldo após pagar</dt><dd>{formatMoney(snapshot.balance.available - bill.amount)}</dd></div></dl>{error && <p className="field__error" role="alert">{error}</p>}<div className="payment-review__actions"><button type="button" onClick={() => setStep('identify')}>Voltar e editar</button><button className="ngb-button ngb-button--primary operation-primary" type="button" onClick={confirmPayment}>Confirmar pagamento <ArrowRight aria-hidden="true" /></button></div></div>
      </section>}

      {step === 'reaction' && transaction && <BalanceReaction amount={transaction.amount} direction="out" previousBalance={snapshot.balance.available + transaction.amount} currentBalance={snapshot.balance.available} detail={`para ${transaction.recipient}`} statusLabel="Obrigação liquidada" titleId="payment-reaction-title" focusAttribute="data-payment-step-title" />}

      {step === 'receipt' && transaction && <section className="receipt-stage"><Receipt transaction={transaction} headingLevel="h2" /><div className="receipt-next"><Link className="ngb-button ngb-button--primary" to={`/movimentos/${transaction.id}`} viewTransition>Abrir no Movimento <ArrowRight aria-hidden="true" /></Link><button className="ngb-button ngb-button--secondary" type="button" onClick={startAnother}>Pagar outra cobrança</button></div></section>}
    </main>
  </div>;
}
