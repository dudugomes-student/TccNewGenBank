import { useEffect, useState } from 'react';

const mobileNavigationQuery = '(max-width: 760px)';

export function useMobileNavigation() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(mobileNavigationQuery).matches);

  useEffect(() => {
    const media = window.matchMedia(mobileNavigationQuery);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
