import { useCallback } from 'react';
import { useNotificationStore } from '../../../stores/notification.store';
import { database } from '../../../database';

export function useNotifications() {
  const store = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const rows = await database.getNotifications();
      if (rows && rows.length > 0) {
        store.setNotifications(
          rows.map((r: Record<string, unknown>) => ({
            id: String(r.id),
            title: String(r.title),
            message: String(r.message),
            type: String(r.type) as 'info' | 'success' | 'warning' | 'error',
            read: Boolean(r.read),
            created_at: String(r.created_at),
          }))
        );
      }
    } catch {
      // Using in-memory store as fallback
    }
  }, [store]);

  const addNotification = useCallback(
    async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
      const notification = {
        id: crypto.randomUUID(),
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString(),
      };
      store.addNotification(notification);
      try {
        await database.addNotification(title, message, type);
      } catch {
        // In-memory only
      }
    },
    [store]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      store.markAsRead(id);
      try {
        await database.markNotificationRead(Number(id));
      } catch {
        // In-memory only
      }
    },
    [store]
  );

  const markAllAsRead = useCallback(async () => {
    store.markAllAsRead();
    try {
      await database.markAllNotificationsRead();
    } catch {
      // In-memory only
    }
  }, [store]);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification: store.removeNotification,
    clearAll: store.clearAll,
  };
}
