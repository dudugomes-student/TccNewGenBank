import type { CSSProperties } from 'react';
import type { BankCard } from '../domain/models';
import { useCardManipulation } from '../motion/useCardManipulation';

interface NewGenCardProps {
  card: BankCard;
  compact?: boolean;
  spatial?: boolean;
  flipped?: boolean;
  revealSensitive?: boolean;
  onFaceChange?: (flipped: boolean) => void;
}

export function NewGenCard({ card, compact = false, spatial = false, flipped = false, revealSensitive = false, onFaceChange = () => undefined }: NewGenCardProps) {
  const manipulation = useCardManipulation({ face: flipped ? 'back' : 'front', status: spatial ? card.status : 'locked', tier: card.qualityTier, onFaceChange: (face) => onFaceChange(face === 'back') });
  const classes = ['newgen-card', compact && 'newgen-card--compact', spatial && 'newgen-card--spatial', manipulation.enabled && 'newgen-card--manipulable', flipped && 'newgen-card--flipped', `newgen-card--${card.status}`, `newgen-card--${card.qualityTier}`].filter(Boolean).join(' ');
  const fullNumber = card.virtualNumber.replace(/(.{4})/g, '$1 ').trim();
  return (
    <article
      className={classes}
      ref={manipulation.cardRef}
      aria-label={`Cartão ${card.label}, final ${card.lastFour}, ${card.status === 'active' ? 'ativo' : 'bloqueado'}`}
      {...manipulation.handlers}
      style={{ '--card-rotate-x': '0deg', '--card-rotate-y': flipped ? '180deg' : '0deg', '--card-light-x': '50%', '--card-light-y': '42%' } as CSSProperties}
    >
      <div className="newgen-card__plane">
        <div className="newgen-card__face newgen-card__front">
          <div className="newgen-card__cut" aria-hidden="true" />
          <header className="newgen-card__top"><span>NEWGEN</span><span>{card.network}</span></header>
          <div className="newgen-card__flow" aria-hidden="true"><i /><i /><i /></div>
          <p className="newgen-card__number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{card.lastFour}</p>
          <footer className="newgen-card__bottom"><span>{card.holderName}</span><span>{card.expiresAt}</span></footer>
        </div>
        <div className="newgen-card__face newgen-card__back" aria-hidden={!flipped}>
          <div className="newgen-card__stripe" aria-hidden="true" />
          <div className="newgen-card__sensitive"><span>NÚMERO VIRTUAL</span><strong>{revealSensitive ? fullNumber : `•••• •••• •••• ${card.lastFour}`}</strong></div>
          <div className="newgen-card__back-meta"><span>VALIDADE <strong>{revealSensitive ? card.expiresAt : '••/••'}</strong></span><span>CVV <strong>{revealSensitive ? card.virtualCvv : '•••'}</strong></span></div>
          <p>{card.onlinePurchasesEnabled ? 'COMPRAS ONLINE ATIVAS' : 'COMPRAS ONLINE DESATIVADAS'}</p>
        </div>
      </div>
      <span className="newgen-card__state">{card.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}</span>
    </article>
  );
}
