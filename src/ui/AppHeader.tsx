import { Bell, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';
import { Brand } from './Brand';
import { ThemeControl } from './ThemeControl';

export function AppHeader({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate();
  const signOut = useSessionStore((state) => state.signOut);
  const handleSignOut = () => {
    signOut();
    navigate('/entrar');
  };
  return (
    <header className="app-header">
      <Brand />
      <nav className="app-nav" aria-label="Navegação principal">
        <Link to="/dashboard#capital">Capital</Link>
        <Link to="/dashboard#movimento">Movimento</Link>
        <Link to="/cartao">Cartão</Link>
      </nav>
      <div className="app-header__tools">
        <ThemeControl />
        <span className="icon-action" role="status" aria-label={`${unreadCount} ${unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}`}>
          <Bell aria-hidden="true" size={19} />
          {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
        </span>
        <button className="icon-action icon-action--desktop" type="button" onClick={handleSignOut} aria-label="Sair da conta">
          <LogOut aria-hidden="true" size={19} />
        </button>
      </div>
    </header>
  );
}
