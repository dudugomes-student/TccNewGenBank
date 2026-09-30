import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteFocus() {
  const location = useLocation();
  useEffect(() => {
    const title = document.querySelector<HTMLElement>('[data-route-title]');
    title?.focus({ preventScroll: true });
  }, [location.pathname]);
}
