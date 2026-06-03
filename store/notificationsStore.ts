import { create } from 'zustand';

export type Notification = {
    id: number;
    text: string;
    icon: string;
    status: 'unread' | 'read';
    created_at: string;
};

type NotificationsStore = {
    notifications: Notification[];
    unreadCount: number;
    fetch: () => Promise<void>;
    push: (data: { text: string; icon?: string; user_id?: number }) => Promise<void>;
    markRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
};

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    fetch: async () => {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) return;
            const data = await res.json();
            const list: Notification[] = (data.notifications ?? []).filter((n: Notification) => n.status === 'unread');
            set({ notifications: list, unreadCount: list.length });
        } catch (e) {
            console.error('[notificationsStore.fetch]', e);
        }
    },

    push: async ({ text, icon = 'bell', user_id }) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, icon, user_id }),
            });
            if (!res.ok) return;
            const data = await res.json();
            set(state => ({
                notifications: [data.notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            }));
        } catch (e) {
            console.error('[notificationsStore.push]', e);
        }
    },

    markRead: async (id: number) => {
        await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
        set(state => ({
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllRead: async () => {
        await fetch('/api/notifications/read-all', { method: 'POST' });
        set({ notifications: [], unreadCount: 0 });
    },
}));