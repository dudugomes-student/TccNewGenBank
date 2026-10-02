import type { FinancialSnapshot } from './models';

export const unreadNotificationCount = (snapshot: Pick<FinancialSnapshot, 'notifications'>) =>
  snapshot.notifications.filter((notification) => !notification.read).length;

export const markNotificationRead = (snapshot: FinancialSnapshot, notificationId: string): FinancialSnapshot => ({
  ...snapshot,
  notifications: snapshot.notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification,
  ),
});

export const markAllNotificationsRead = (snapshot: FinancialSnapshot): FinancialSnapshot => ({
  ...snapshot,
  notifications: snapshot.notifications.map((notification) => ({ ...notification, read: true })),
});
