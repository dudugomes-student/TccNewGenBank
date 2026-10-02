import { lazy, Suspense, type CSSProperties } from 'react';
import type { BankCard } from '../domain/models';
import { useCardManipulation } from '../motion/useCardManipulation';

const NewGenCard3D = lazy(() => import('./NewGenCard3D').then((module) => ({ default: module.NewGenCard3D })));

interface NewGenCardProps {
  card: BankCard;
  compact?: boolean;
  spatial?: boolean;
  visualScale?: number;
  renderOverscan?: number;
  flipped?: boolean;
  revealSensitive?: boolean;
  onFaceChange?: (flipped: boolean) => void;
}

export function NewGenCard(props: NewGenCardProps) {
  const { card, spatial = false, visualScale, renderOverscan, flipped = false, revealSensitive = false, onFaceChange = () => undefined } = props;
  if (spatial) return (
    <Suspense fallback={<div className="newgen-card-3d newgen-card-3d--loading" aria-label="Carregando objeto 3D do cartão" />}>
      <NewGenCard3D card={card} visualScale={visualScale} renderOverscan={renderOverscan} flipped={flipped} revealSensitive={revealSensitive} onFaceChange={onFaceChange} />
    </Suspense>
  );
  return <LegacyNewGenCard {...props} />;
}

function LegacyNewGenCard({ card, compact = false, flipped = false, revealSensitive = false, onFaceChange = () => undefined }: NewGenCardProps) {
  const manipulation = useCardManipulation({ face: flipped ? 'back' : 'front', status: 'locked', onFaceChange: (face) => onFaceChange(face === 'back') });
  const classes = ['newgen-card', compact && 'newgen-card--compact', manipulation.enabled && 'newgen-card--manipulable', flipped && 'newgen-card--flipped', `newgen-card--${card.status}`].filter(Boolean).join(' ');
  const fullNumber = card.virtualNumber.replace(/(.{4})/g, '$1 ').trim();
  return (
    <article
      className={classes}
      ref={manipulation.cardRef}
      aria-label={`Cartão ${card.label}, final ${card.lastFour}, ${card.status === 'active' ? 'ativo' : 'bloqueado'}`}
      {...manipulation.handlers}
      style={{ '--card-rotate-x': '0deg', '--card-rotate-y': flipped ? '180deg' : '0deg', '--card-light-x': '50%', '--card-light-y': '42%', '--card-shadow-x': '0px', '--card-shadow-y': '18px', '--card-shadow-scale': '.92' } as CSSProperties}
    >
      <span className="newgen-card__ground-shadow" aria-hidden="true" />
      <div className="newgen-card__lift">
        <div className="newgen-card__plane">
        <span className="newgen-card__edge newgen-card__edge--top" aria-hidden="true" />
        <span className="newgen-card__edge newgen-card__edge--right" aria-hidden="true" />
        <span className="newgen-card__edge newgen-card__edge--bottom" aria-hidden="true" />
        <span className="newgen-card__edge newgen-card__edge--left" aria-hidden="true" />
        <div className="newgen-card__face newgen-card__front">
          <div className="newgen-card__cut" aria-hidden="true" />
          <header className="newgen-card__top"><span>NEWGEN</span><span>{card.network}</span></header>
          <span className="newgen-card__state">{card.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}</span>
          <div className="newgen-card__flow" aria-hidden="true"><i /><i /><i /></div>
          <p className="newgen-card__number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{card.lastFour}</p>
          <footer className="newgen-card__bottom"><span>{card.holderName}</span><span>{card.expiresAt}</span></footer>
        </div>
        <div className="newgen-card__face newgen-card__back" aria-hidden={!flipped}>
          <div className="newgen-card__stripe" aria-hidden="true" />
          <span className="newgen-card__state">{card.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}</span>
          <div className="newgen-card__sensitive"><span>NÚMERO VIRTUAL</span><strong>{revealSensitive ? fullNumber : `•••• •••• •••• ${card.lastFour}`}</strong></div>
          <div className="newgen-card__back-meta"><span>VALIDADE <strong>{revealSensitive ? card.expiresAt : '••/••'}</strong></span><span>CVV <strong>{revealSensitive ? card.virtualCvv : '•••'}</strong></span></div>
          <p>{card.onlinePurchasesEnabled ? 'COMPRAS ONLINE ATIVAS' : 'COMPRAS ONLINE DESATIVADAS'}</p>
        </div>
        </div>
      </div>
    </article>
  );
}
