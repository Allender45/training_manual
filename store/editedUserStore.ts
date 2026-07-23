import { create } from 'zustand';

export type EditedUser = {
    id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    phone: string;
    email: string;
    photo: string | null;
    passport_series: string;
    passport_number: string;
    birthday: string;
    comment: string;
    is_active: boolean;
    role: string;
    registered_at: string | null;
    crm_id: number | null;
    adaptation_access: boolean;
    telegram_chat_id: string;
};

export type Mentorship = {
    id: number;
    mentor_id: number;
    mentor_name: string;
};

type EditedUserStore = {
    editedUser: EditedUser | null;
    mentorship: Mentorship | null;
    mentorOptions: { value: string; label: string }[];
    loading: boolean;
    requestId: number;
    fetchEditedUser: (id: string) => Promise<void>;
    clearEditedUser: () => void;
};

export const useEditedUserStore = create<EditedUserStore>((set, get) => ({
    editedUser: null,
    mentorship: null,
    mentorOptions: [],
    loading: false,
    requestId: 0,
    fetchEditedUser: async (id) => {
        const reqId = get().requestId + 1;
        set({ loading: true, editedUser: null, mentorship: null, mentorOptions: [], requestId: reqId });
        try {
            const res = await fetch(`/api/users/${id}`);
            const data = await res.json();
            if (!res.ok) return;
            if (get().requestId !== reqId) return;

            const user: EditedUser = data.user;
            set({ editedUser: user });

            if (user.role === 'Стажёр') {
                const [mData, uData] = await Promise.all([
                    fetch(`/api/mentorships?intern_id=${id}`).then(r => r.json()),
                    fetch('/api/users?scope=mentors').then(r => r.json()),
                ]);
                if (get().requestId !== reqId) return;
                set({
                    mentorship: mData.mentorship ?? null,
                    mentorOptions: (uData.users ?? [])
                        .filter((u: any) => u.id !== Number(id))
                        .map((u: any) => ({ value: String(u.id), label: u.name })),
                });
            }
        } catch (error) {
            console.error('[fetchEditedUser]', error);
        } finally {
            if (get().requestId === reqId) set({ loading: false });
        }
    },
    clearEditedUser: () => set({ editedUser: null, mentorship: null, mentorOptions: [] }),
}));