import { create } from 'zustand';

export type Test = { id: number; title: string; is_active: boolean; };

type TestsStore = { tests: Test[]; fetch: () => Promise<void>; };

export const useTestsStore = create<TestsStore>((set, get) => ({
    tests: [],
    fetch: async () => {
        if (get().tests.length > 0) return;
        const res = await fetch('/api/courseTests');
        const data = await res.json();
        set({ tests: data.tests ?? [] });
    },
}));