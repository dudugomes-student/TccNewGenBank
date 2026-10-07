import { useSiteReducedMotion } from './motion/MotionProvider';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardRoute } from './routes/DashboardRoute';
import { LoginRoute } from './routes/LoginRoute';
import { PixRoute } from './routes/PixRoute';
import { TransactionRoute } from './routes/TransactionRoute';
import { CardRoute } from './routes/CardRoute';
import { MovementRoute } from './routes/MovementRoute';
import { MonthRoute } from './routes/MonthRoute';
import { ReceiveRoute } from './routes/ReceiveRoute';
import { PaymentRoute } from './routes/PaymentRoute';
import { NotificationsRoute } from './routes/NotificationsRoute';
import { AccountRoute } from './routes/AccountRoute';
import { SettingsRoute } from './routes/SettingsRoute';
import { RouteMotionController } from './motion/RouteMotionController';

export function App() {
  const location = useLocation();
  const reduceMotion = useSiteReducedMotion();

  return (
    <LayoutGroup id="newgen-shell">
      <RouteMotionController />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="route-transition-frame"
          initial={reduceMotion ? false : { opacity: .65, x: 24, scale: .995 }}
          animate={reduceMotion ? { opacity: 1, x: 0, scale: 1, transition: { duration: 0 } } : {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              opacity: { duration: .48, ease: [.22, .61, .36, 1] },
              x: { duration: .48, ease: [.22, .61, .36, 1] },
              scale: { duration: .48, ease: [.2, .72, .18, 1] },
            },
          }}
          exit={reduceMotion ? { opacity: 1, transition: { duration: 0 } } : {
            opacity: .35,
            x: -16,
            scale: .995,
            transition: { type: 'tween', duration: .18, ease: [.4, 0, 1, 1] },
          }}
          style={{ minHeight: '100%', transformOrigin: '50% 30%' }}
        >
          <Routes location={location}>
            <Route path="/" element={<LoginRoute />} />
            <Route path="/entrar" element={<LoginRoute />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/pix" element={<PixRoute />} />
              <Route path="/receber" element={<ReceiveRoute />} />
              <Route path="/pagar" element={<PaymentRoute />} />
              <Route path="/cartao" element={<CardRoute />} />
              <Route path="/movimento" element={<MovementRoute />} />
              <Route path="/seu-mes" element={<MonthRoute />} />
              <Route path="/movimentos/:transactionId" element={<TransactionRoute />} />
              <Route path="/notificacoes" element={<NotificationsRoute />} />
              <Route path="/conta" element={<AccountRoute />} />
              <Route path="/configuracoes" element={<SettingsRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  );
}
