import { create } from 'zustand';

export type User = {
    id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    phone: string;
    email: string | null;
    photo: string | null;
    passport_series: string | null;
    passport_number: string | null;
    birthday: string | null;
    comment: string | null;
    registered_at: string;
    role_id: number | null;
    role: string | null;
    crm_id: number | null;
};

type UserStore = {
    user: User | null;
    loaded: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
    fetchUser: (onUnauthorized?: () => void) => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    loaded: false,
    setUser: (user) => set({ user, loaded: true }),
    logout: () => set({ user: null, loaded: false }),
    fetchUser: async (onUnauthorized) => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/auth/me');
            if (res.status === 401) {
                set({ loaded: true });
                onUnauthorized?.();
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            set({ user: data.user ?? null, loaded: true });
        } catch (error) {
            console.error('[fetchUser]', error);
        }
    },
}));