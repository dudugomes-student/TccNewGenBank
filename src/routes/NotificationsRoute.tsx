import { ArrowRight, Bell, Check, CheckCheck, CreditCard, Landmark, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../domain/formatters';
import { useRouteFocus } from '../motion/useRouteFocus';
import { useFinancialStore } from '../state/financialStore';
import { AppHeader } from '../ui/AppHeader';
import { MobileNav } from '../ui/MobileNav';

const notificationIcon = {
  pix: Landmark,
  payment: ReceiptText,
  receipt: Landmark,
  card: CreditCard,
  account: Bell,
} as const;

const notificationLabel = {
  pix: 'Pix',
  payment: 'Pagamento',
  receipt: 'Recebimento',
  card: 'Cartão',
  account: 'Conta',
} as const;

export function NotificationsRoute() {
  useRouteFocus();
  const notifications = useFinancialStore((state) => state.notifications);
  const markRead = useFinancialStore((state) => state.markNotificationRead);
  const markAll = useFinancialStore((state) => state.markAllNotificationsRead);
  const unread = notifications.filter((notification) => !notification.read).length;

  return <div className="utility-page notifications-page secondary-page vertical-slice mineral-scene route-stage">
    <div className="mineral-backdrop" aria-hidden="true" />
    <div className="mineral-atmosphere" aria-hidden="true" />
    <a className="skip-link" href="#notifications-content">Pular para notificações</a>
    <AppHeader unreadCount={unread} showAccent />
    <main className="utility-shell" id="notifications-content">
      <header className="utility-header"><div><p className="kicker">RASTRO / NOTIFICAÇÕES</p><h1 tabIndex={-1} data-route-title>O que aconteceu.</h1></div><div><strong>{unread}</strong><span>{unread === 1 ? 'não lida' : 'não lidas'}</span>{unread > 0 && <button type="button" onClick={markAll}><CheckCheck aria-hidden="true" /> Marcar todas como lidas</button>}</div></header>
      {notifications.length === 0 ? <section className="empty-state"><Bell aria-hidden="true" /><h2>Nada novo por aqui.</h2><p>As confirmações de Pix, pagamentos, recebimentos e cartão aparecerão neste espaço.</p><Link to="/dashboard">Voltar ao início <ArrowRight aria-hidden="true" /></Link></section> : <ol className="notification-list">
        {notifications.map((notification) => {
          const Icon = notificationIcon[notification.type];
          const occurred = formatDateTime(notification.createdAt);
          return <li key={notification.id} className={notification.read ? '' : 'is-unread'} data-state={notification.read ? 'read' : 'unread'}><span className="notification-list__icon"><Icon aria-hidden="true" /></span><div className="notification-list__copy"><div><span className="notification-list__kind">{notificationLabel[notification.type]}</span><strong>{notification.title}</strong>{!notification.read && <span className="notification-list__state">Não lida</span>}</div><p>{notification.body}</p><time dateTime={notification.createdAt}>{occurred.date} · {occurred.time}</time></div><div className="notification-list__actions">{!notification.read && <button type="button" onClick={() => markRead(notification.id)}><Check aria-hidden="true" /> Marcar como lida</button>}{notification.targetPath && <Link to={notification.targetPath} onClick={() => markRead(notification.id)}>Abrir registro <ArrowRight aria-hidden="true" /></Link>}</div></li>;
        })}
      </ol>}
    </main>
    <MobileNav />
  </div>;
}
