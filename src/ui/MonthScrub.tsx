import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRef, useState, type CSSProperties, type WheelEvent } from 'react';
import { formatMonthLabel } from '../domain/formatters';

interface MonthScrubProps {
  months: string[];
  selectedMonth: string;
  onChange: (monthKey: string) => void;
}

export function MonthScrub({ months, selectedMonth, onChange }: MonthScrubProps) {
  const wheelTimestamp = useRef(0);
  const [moving, setMoving] = useState(false);
  const selectedIndex = Math.max(0, months.indexOf(selectedMonth));
  const progress = selectedIndex / Math.max(1, months.length - 1) * 100;
  const selectIndex = (index: number) => onChange(months[Math.max(0, Math.min(months.length - 1, index))]);
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelTimestamp.current < 180) return;
    wheelTimestamp.current = now;
    selectIndex(selectedIndex + (event.deltaX > 0 ? 1 : -1));
  };

  return (
    <section className="month-scrub" aria-labelledby="month-scrub-title">
      <div className="month-scrub__heading">
        <div>
          <p className="section-index">Linha do tempo</p>
          <h2 id="month-scrub-title">Escolha o período</h2>
        </div>
        <p>Arraste a linha, deslize na horizontal ou use as setas do teclado.</p>
      </div>
      <div className="month-scrub__control" onWheel={handleWheel} data-moving={moving || undefined} style={{ '--scrub-progress': `${progress}%` } as CSSProperties}>
        <button type="button" onClick={() => selectIndex(selectedIndex - 1)} disabled={selectedIndex === 0} aria-label="Ver mês anterior">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="month-scrub__rail">
          <input
            type="range"
            min="0"
            max={Math.max(0, months.length - 1)}
            step="1"
            value={selectedIndex}
            onChange={(event) => selectIndex(Number(event.target.value))}
            onPointerDown={() => setMoving(true)}
            onPointerUp={() => setMoving(false)}
            onPointerCancel={() => setMoving(false)}
            onBlur={() => setMoving(false)}
            aria-label="Mês analisado"
            aria-valuetext={formatMonthLabel(selectedMonth)}
          />
          <ol
            aria-hidden="true"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, months.length)}, minmax(0, 1fr))` }}
          >
            {months.map((month, index) => <li key={month} className={index === selectedIndex ? 'is-current' : ''}><span />{formatMonthLabel(month, 'short')}</li>)}
          </ol>
        </div>
        <button type="button" onClick={() => selectIndex(selectedIndex + 1)} disabled={selectedIndex === months.length - 1} aria-label="Ver próximo mês">
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">Mês selecionado: {formatMonthLabel(selectedMonth)}</p>
    </section>
  );
}
