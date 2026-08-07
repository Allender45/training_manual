import { create } from 'zustand';

type DepartmentsStore = {
    departmentOptions: { value: string; label: string }[];
    loaded: boolean;
    fetchDepartments: () => Promise<void>;
};

export const useDepartmentsStore = create<DepartmentsStore>((set, get) => ({
    departmentOptions: [],
    loaded: false,
    fetchDepartments: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/departments');
            if (!res.ok) return;
            const data = await res.json();
            set({
                departmentOptions: (data.departments ?? [])
                    .filter((d: { active: boolean }) => d.active)
                    .map((d: { id: number; name: string }) => ({ value: String(d.id), label: d.name })),
                loaded: true,
            });
        } catch (error) {
            console.error('[fetchDepartments]', error);
        }
    },
}));