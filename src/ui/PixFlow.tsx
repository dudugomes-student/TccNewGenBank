import { Check } from 'lucide-react';

const stages = ['SOURCE', 'DECISION', 'REACTION', 'TRACE'] as const;

export function PixFlow({ active }: { active: number }) {
  return <ol className="pix-flow" aria-label="Progresso do Pix">{stages.map((stage, index) => <li key={stage} className={index < active ? 'is-complete' : index === active ? 'is-active' : ''} aria-current={index === active ? 'step' : undefined}><span className="pix-flow__mark">{index < active ? <Check aria-hidden="true" /> : `0${index + 1}`}</span><span>{stage}</span></li>)}</ol>;
}
