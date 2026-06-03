import { create } from 'zustand';

export type Course = { id: number; title: string };

type CoursesStore = {
    courses: Course[];
    loaded: boolean;
    fetch: () => Promise<void>;
};

export const useCoursesStore = create<CoursesStore>((set, get) => ({
    courses: [],
    loaded: false,
    fetch: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/courses');
            if (!res.ok) return;
            const data = await res.json();
            set({ courses: data.courses ?? [], loaded: true });
        } catch (e) {
            console.error('[coursesStore.fetch]', e);
        }
    },
}));