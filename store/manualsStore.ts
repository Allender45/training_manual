import { create } from 'zustand';

export type Manual = { id: number; title: string };

type ManualsStore = {
    manuals: Manual[];
    loaded: boolean;
    fetch: () => Promise<void>;
};

export const useManualsStore = create<ManualsStore>((set, get) => ({
    manuals: [],
    loaded: false,
    fetch: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/manuals');
            if (!res.ok) return;
            const data = await res.json();
            set({ manuals: data.manuals ?? [], loaded: true });
        } catch (e) {
            console.error('[manualsStore.fetch]', e);
        }
    },
}));