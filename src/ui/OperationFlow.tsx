import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';

interface OperationFlowProps {
  active: number;
  labels: readonly string[];
  name: string;
}

export function OperationFlow({ active, labels, name }: OperationFlowProps) {
  return (
    <ol
      className="operation-flow"
      aria-label={`Progresso de ${name}`}
      style={{ '--operation-progress': `${(active / Math.max(1, labels.length - 1)) * 100}%` } as CSSProperties}
    >
      {labels.map((label, index) => (
        <li key={label} className={index < active ? 'is-complete' : index === active ? 'is-active' : ''} aria-current={index === active ? 'step' : undefined}>
          <span>{index < active ? <Check aria-hidden="true" /> : `0${index + 1}`}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
