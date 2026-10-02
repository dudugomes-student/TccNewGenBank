import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const classifyRouteMotion = (from: string, to: string) => {
  if ((from === '/dashboard' && to === '/cartao') || (from === '/cartao' && to === '/dashboard')) return 'card';
  if ((from === '/dashboard' && to === '/movimento') || (from === '/movimento' && to === '/dashboard')) return 'movement';
  if (to.startsWith('/movimentos/')) return 'detail-forward';
  if (from.startsWith('/movimentos/')) return 'detail-return';
  if (to === '/seu-mes' || from === '/seu-mes') return 'month';
  if (to === '/pix' || from === '/pix') return 'pix';
  if (to === '/pagar' || from === '/pagar') return 'payment';
  if (to === '/receber' || from === '/receber') return 'receive';
  return 'navigation';
};

export const transactionTransitionName = (id: string) => `movement-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

export function rememberTransactionSource(id: string) {
  window.sessionStorage.setItem('newgen-motion-transaction', id);
  window.sessionStorage.setItem('newgen-motion-scroll', String(window.scrollY));
}

export function getRememberedTransaction() {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem('newgen-motion-transaction');
}

export function RouteMotionController() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.routeCurrent = pathname;
    const clearIntent = window.setTimeout(() => {
      delete root.dataset.routeMotion;
      delete root.dataset.routeDirection;
    }, 1650);

    const captureIntent = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === pathname) return;
      root.dataset.routeMotion = classifyRouteMotion(pathname, destination.pathname);
      root.dataset.routeDirection = destination.pathname === '/dashboard' ? 'back' : 'forward';
    };

    document.addEventListener('pointerdown', captureIntent, true);
    document.addEventListener('click', captureIntent, true);
    return () => {
      window.clearTimeout(clearIntent);
      document.removeEventListener('pointerdown', captureIntent, true);
      document.removeEventListener('click', captureIntent, true);
    };
  }, [pathname]);

  return null;
}
