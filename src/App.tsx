import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardRoute } from './routes/DashboardRoute';
import { EntryRoute } from './routes/EntryRoute';
import { LoginRoute } from './routes/LoginRoute';
import { PixRoute } from './routes/PixRoute';
import { TransactionRoute } from './routes/TransactionRoute';
import { CardRoute } from './routes/CardRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryRoute />} />
      <Route path="/entrar" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/pix" element={<PixRoute />} />
        <Route path="/cartao" element={<CardRoute />} />
        <Route path="/movimentos/:transactionId" element={<TransactionRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
