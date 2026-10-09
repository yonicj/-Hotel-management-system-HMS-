import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationState {
  notifications: Notification[];
  add: (n: Omit<Notification, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  add: (n) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ notifications: [...state.notifications, { ...n, id }] }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter((x) => x.id !== id) }));
    }, 5000);
  },

  remove: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  clear: () => set({ notifications: [] }),
}));
