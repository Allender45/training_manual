import { create } from 'zustand';

type RolesStore = {
    roles: { value: string; label: string }[];
    loaded: boolean;
    fetchRoles: () => Promise<void>;
};

export const useRolesStore = create<RolesStore>((set, get) => ({
    roles: [],
    loaded: false,
    fetchRoles: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/roles');
            const data = await res.json();
            set({
                roles: (data.roles ?? []).map((r: { name: string }) => ({ value: r.name, label: r.name })),
                loaded: true,
            });
        } catch (error) {
            console.error('[fetchRoles]', error);
        }
    },
}));