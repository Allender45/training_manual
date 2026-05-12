import { create } from 'zustand';
import { UserRow } from '@/containers/UsersTable/UsersTable';

type UsersListStore = {
    users: UserRow[];
    loading: boolean;
    fetchUsers: () => Promise<void>;
};

export const useUsersListStore = create<UsersListStore>((set) => ({
    users: [],
    loading: false,
    fetchUsers: async () => {
        set({ loading: true });
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                set({ users: data.users ?? [] });
            }
        } catch (error) {
            console.error('[fetchUsers]', error);
        } finally {
            set({ loading: false });
        }
    },
}));