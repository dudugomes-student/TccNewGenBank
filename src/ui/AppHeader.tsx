import { Bell, LogOut, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';
import { Brand } from './Brand';
import { ThemeControl } from './ThemeControl';
import { useMobileNavigation } from './useMobileNavigation';

export function AppHeader({ unreadCount, showAccent = false }: { unreadCount: number; showAccent?: boolean }) {
  const navigate = useNavigate();
  const isMobile = useMobileNavigation();
  const { pathname } = useLocation();
  const signOut = useSessionStore((state) => state.signOut);
  const reduceMotion = useReducedMotion();
  const current = pathname === '/cartao' ? 'card'
    : pathname === '/movimento' || pathname.startsWith('/movimentos/') ? 'movement'
      : pathname === '/seu-mes' ? 'month'
        : pathname === '/dashboard' ? 'capital'
          : null;
  const handleSignOut = () => {
    signOut();
    navigate('/entrar');
  };
  return (
    <header className="app-header">
      <Brand />
      <nav className="app-nav" aria-label="Navegação principal">
        <Link to="/dashboard#capital" viewTransition aria-current={!isMobile && current === 'capital' ? 'page' : undefined}>Capital{!isMobile && current === 'capital' && <motion.span className="app-nav__active" layoutId="desktop-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
        <Link to="/movimento" viewTransition aria-current={!isMobile && current === 'movement' ? 'page' : undefined}>Movimento{!isMobile && current === 'movement' && <motion.span className="app-nav__active" layoutId="desktop-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
        <Link to="/seu-mes" viewTransition aria-current={!isMobile && current === 'month' ? 'page' : undefined}>Seu mês{!isMobile && current === 'month' && <motion.span className="app-nav__active" layoutId="desktop-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
        <Link to="/cartao" viewTransition aria-current={!isMobile && current === 'card' ? 'page' : undefined}>Cartão{!isMobile && current === 'card' && <motion.span className="app-nav__active" layoutId="desktop-nav-active" transition={{ duration: reduceMotion ? 0 : .46, ease: [.2, .72, .18, 1] }} />}</Link>
      </nav>
      <div className="app-header__tools">
        <ThemeControl showAccent={showAccent} />
        <Link className="icon-action" to="/notificacoes" viewTransition aria-current={pathname === '/notificacoes' ? 'page' : undefined} aria-label={`Notificações: ${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`}>
          <Bell aria-hidden="true" size={19} />
          {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        </Link>
        <Link className="icon-action icon-action--desktop" to="/conta" viewTransition aria-current={!isMobile && (pathname === '/conta' || pathname === '/configuracoes') ? 'page' : undefined} aria-label="Abrir sua conta"><UserRound aria-hidden="true" size={19} /></Link>
        <button className="icon-action icon-action--desktop" type="button" onClick={handleSignOut} aria-label="Sair da conta">
          <LogOut aria-hidden="true" size={19} />
        </button>
      </div>
    </header>
  );
}
