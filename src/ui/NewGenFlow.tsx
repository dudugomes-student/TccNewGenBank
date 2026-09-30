import type { CSSProperties } from 'react';
import type { Transaction } from '../domain/models';
import { formatMoney } from '../domain/formatters';

export function NewGenFlow({ transactions }: { transactions: Transaction[] }) {
  const points = transactions.slice(0, 5).reverse();
  const max = Math.max(...points.map((item) => item.amount), 1);
  return (
    <div className="flow" aria-label="Fluxo das cinco movimentações mais recentes">
      <div className="flow__axis" aria-hidden="true" />
      {points.map((item, index) => {
        const size = 10 + Math.round((item.amount / max) * 18);
        return (
          <div className="flow__point" key={item.id} style={{ '--point-size': `${size}px` } as CSSProperties}>
            <span className={`flow__dot flow__dot--${item.direction}`} aria-hidden="true" />
            <span className="flow__label">{index === points.length - 1 ? 'Agora' : `${points.length - index - 1}`}</span>
            <span className="sr-only">{item.title}: {formatMoney(item.amount)}, {item.direction === 'in' ? 'entrada' : 'saída'}.</span>
          </div>
        );
      })}
    </div>
  );
}
