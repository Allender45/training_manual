import { create } from 'zustand';
import type { AchievementOption } from './achievementsStore';

type AchievementToast = AchievementOption | null;

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
    reset: () => void;
    achievementToast: AchievementToast;
    showAchievement: (a: AchievementOption) => void;
    dismissAchievement: () => void;
};

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    achievementToast: null,

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
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            if (!res.ok) return;
            set(state => ({
                notifications: state.notifications.filter(n => n.id !== id),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (e) {
            console.error('[notificationsStore.markRead]', e);
        }
    },

    markAllRead: async () => {
        try {
            const res = await fetch('/api/notifications/read-all', { method: 'POST' });
            if (!res.ok) return;
            set({ notifications: [], unreadCount: 0 });
        } catch (e) {
            console.error('[notificationsStore.markAllRead]', e);
        }
    },

    reset: () => set({ notifications: [], unreadCount: 0, achievementToast: null }),

    showAchievement: (a) => {
        set({ achievementToast: a });
    },

    dismissAchievement: () => {
        set({ achievementToast: null });
    },
}));