import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';

export function ProtectedRoute() {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
}
