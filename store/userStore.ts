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
    role: string | null;
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
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
            set({ loaded: true });
            onUnauthorized?.();
            return;
        }
        const data = await res.json();
        set({ user: data.user, loaded: true });
    },
}));