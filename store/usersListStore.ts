import { create } from 'zustand';
import { UserRow } from '@/containers/UsersTable/UsersTable';

export type MentorRow = {
    id: number;
    name: string;
    intern_count: number;
};

type UsersListStore = {
    users: UserRow[];
    loading: boolean;
    fetchUsers: () => Promise<void>;
    mentors: MentorRow[];
    mentorsLoading: boolean;
    fetchMentors: () => Promise<void>;
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
    mentors: [],
    mentorsLoading: false,
    fetchMentors: async () => {
        set({ mentorsLoading: true });
        try {
            const res = await fetch('/api/teachers');
            if (res.ok) {
                const data = await res.json();
                set({ mentors: data.mentors ?? [] });
            }
        } catch (error) {
            console.error('[fetchMentors]', error);
        } finally {
            set({ mentorsLoading: false });
        }
    },
}));