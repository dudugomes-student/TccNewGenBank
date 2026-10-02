import { describe, expect, it } from 'vitest';
import { demoFinancialSnapshot } from '../data/demoData';
import type { FinancialSnapshot } from './models';
import { markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from './notifications';

const fresh = (): FinancialSnapshot => structuredClone(demoFinancialSnapshot);

describe('central de notificações', () => {
  it('conta somente notificações não lidas', () => {
    const snapshot = fresh();
    snapshot.notifications.push({ ...snapshot.notifications[0], id: 'read', read: true });
    expect(unreadNotificationCount(snapshot)).toBe(1);
  });

  it('marca uma notificação como lida preservando sua referência', () => {
    const snapshot = fresh();
    const next = markNotificationRead(snapshot, 'nt-01');
    expect(next.notifications[0]).toMatchObject({ read: true, transactionId: 'tx-01', targetPath: '/movimentos/tx-01' });
  });

  it('marca todas como lidas', () => {
    const snapshot = fresh();
    snapshot.notifications.push({ ...snapshot.notifications[0], id: 'second' });
    expect(markAllNotificationsRead(snapshot).notifications.every((item) => item.read)).toBe(true);
  });
});
