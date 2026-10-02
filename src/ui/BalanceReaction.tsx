import { formatMoney } from '../domain/formatters';

interface BalanceReactionProps {
  amount: number;
  direction: 'in' | 'out';
  previousBalance: number;
  currentBalance: number;
  detail: string;
  statusLabel?: string;
  titleId: string;
  focusAttribute: 'data-pix-step-title' | 'data-receive-step-title' | 'data-payment-step-title';
}

export function BalanceReaction({
  amount,
  direction,
  previousBalance,
  currentBalance,
  detail,
  statusLabel,
  titleId,
  focusAttribute,
}: BalanceReactionProps) {
  const focusProps = { [focusAttribute]: 'reaction' };
  const directionLabel = direction === 'in' ? 'entrou' : 'saiu';

  return (
    <section className={`balance-reaction balance-reaction--${direction === 'in' ? 'incoming' : 'outgoing'}`} aria-labelledby={titleId}>
      <div className="balance-reaction__source">
        <span>SALDO ANTERIOR</span>
        <strong>{formatMoney(previousBalance)}</strong>
      </div>
      <div className="balance-reaction__transfer">
        {statusLabel && <span className="balance-reaction__commit">{statusLabel}</span>}
        <span className="balance-reaction__path" aria-hidden="true"><i /></span>
        <strong>{direction === 'in' ? '+' : '−'} {formatMoney(amount)}</strong>
        <small>{detail}</small>
      </div>
      <div className="balance-reaction__result">
        <span>NOVO SALDO</span>
        <strong id={titleId} tabIndex={-1} {...focusProps}>{formatMoney(currentBalance)}</strong>
      </div>
      <p className="sr-only" role="status">O dinheiro {directionLabel}. Novo saldo: {formatMoney(currentBalance)}.</p>
    </section>
  );
}
