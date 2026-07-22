import { create } from 'zustand';

export type Test = { id: number; title: string; is_active: boolean; };

type TestsStore = { tests: Test[]; loaded: boolean; fetch: () => Promise<void>; };

export const useTestsStore = create<TestsStore>((set, get) => ({
    tests: [],
    loaded: false,
    fetch: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/courseTests');
            if (!res.ok) return;
            const data = await res.json();
            set({ tests: data.tests ?? [], loaded: true });
        } catch (error) {
            console.error('[testsStore.fetch]', error);
        }
    },
}));