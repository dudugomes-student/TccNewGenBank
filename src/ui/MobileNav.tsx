import { ArrowUpRight, CircleUserRound, CreditCard, Home, List } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useMobileNavigation } from './useMobileNavigation';

export function MobileNav() {
  const { pathname } = useLocation();
  const isMobile = useMobileNavigation();
  const reduceMotion = useReducedMotion();
  const current = pathname === '/pix' ? 'pix'
    : pathname === '/cartao' ? 'card'
      : pathname === '/movimento' || pathname === '/seu-mes' || pathname.startsWith('/movimentos/') ? 'movement'
        : pathname === '/conta' || pathname === '/configuracoes' ? 'account'
          : pathname === '/dashboard' ? 'home'
            : null;
  return (
    <nav className="mobile-nav" aria-label="Navegação principal móvel">
      <Link to="/dashboard" viewTransition aria-current={isMobile && current === 'home' ? 'page' : undefined}><Home aria-hidden="true" /><span>Início</span>{isMobile && current === 'home' && <motion.i className="mobile-nav__active" layoutId="mobile-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
      <Link to="/pix" viewTransition aria-current={isMobile && current === 'pix' ? 'page' : undefined}><ArrowUpRight aria-hidden="true" /><span>Pix</span>{isMobile && current === 'pix' && <motion.i className="mobile-nav__active" layoutId="mobile-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
      <Link to="/cartao" viewTransition aria-current={isMobile && current === 'card' ? 'page' : undefined}><CreditCard aria-hidden="true" /><span>Cartão</span>{isMobile && current === 'card' && <motion.i className="mobile-nav__active" layoutId="mobile-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
      <Link to="/movimento" viewTransition aria-current={isMobile && current === 'movement' ? 'page' : undefined}><List aria-hidden="true" /><span>Movimento</span>{isMobile && current === 'movement' && <motion.i className="mobile-nav__active" layoutId="mobile-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
      <Link to="/conta" viewTransition aria-current={isMobile && current === 'account' ? 'page' : undefined}><CircleUserRound aria-hidden="true" /><span>Conta</span>{isMobile && current === 'account' && <motion.i className="mobile-nav__active" layoutId="mobile-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
    </nav>
  );
}
