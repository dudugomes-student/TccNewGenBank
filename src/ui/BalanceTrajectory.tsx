import { useId } from 'react';
import { formatMoney, formatMonthLabel } from '../domain/formatters';
import type { MonthlyBalancePoint } from '../domain/movement';

export function BalanceTrajectory({ points, activeMonth }: { points: MonthlyBalancePoint[]; activeMonth?: string }) {
  const titleId = useId();
  const gradientId = `${titleId}-area`.replaceAll(':', '');
  if (points.length === 0) return null;

  const width = 640;
  const height = 132;
  const inset = 12;
  const values = points.map((point) => point.balance);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const coordinates = points.map((point, index) => ({
    ...point,
    x: inset + (index / Math.max(1, points.length - 1)) * (width - inset * 2),
    y: height - inset - ((point.balance - minimum) / range) * (height - inset * 2),
  }));
  const path = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${inset},${height - inset} ${path} ${width - inset},${height - inset}`;
  const first = points[0];
  const last = points[points.length - 1];
  const active = points.find((point) => point.monthKey === activeMonth) ?? last;

  return (
    <figure className="balance-trajectory">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={titleId} preserveAspectRatio="none">
        <title id={titleId}>Trajetória do saldo entre {formatMonthLabel(first.monthKey)} e {formatMonthLabel(last.monthKey)}</title>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" /><stop offset="1" /></linearGradient></defs>
        <polygon className="balance-trajectory__area" points={area} fill={`url(#${gradientId})`} />
        <line className="balance-trajectory__baseline" x1={inset} y1={height - inset} x2={width - inset} y2={height - inset} />
        <polyline className="balance-trajectory__line" points={path} />
        {coordinates.map((point) => <circle key={point.monthKey} className={`balance-trajectory__point${point.monthKey === active.monthKey ? ' is-active' : ''}`} cx={point.x} cy={point.y} r={point.monthKey === active.monthKey ? 6 : 4} />)}
      </svg>
      <figcaption>
        <span>{formatMonthLabel(first.monthKey, 'short')} <strong>{formatMoney(first.balance)}</strong></span>
        <span className="balance-trajectory__active">{formatMonthLabel(active.monthKey, 'short')} <strong>{formatMoney(active.balance)}</strong></span>
      </figcaption>
    </figure>
  );
}
