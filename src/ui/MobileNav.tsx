import { ArrowUpRight, CreditCard, Home, List } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Navegação principal móvel">
      <NavLink to="/dashboard" end><Home aria-hidden="true" /><span>Início</span></NavLink>
      <NavLink to="/dashboard#movimento"><List aria-hidden="true" /><span>Movimento</span></NavLink>
      <NavLink to="/pix"><ArrowUpRight aria-hidden="true" /><span>Pix</span></NavLink>
      <NavLink to="/cartao"><CreditCard aria-hidden="true" /><span>Cartão</span></NavLink>
    </nav>
  );
}
