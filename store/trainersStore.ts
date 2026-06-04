import { create } from 'zustand';

export type Trainer = { id: number; name: string };

type TrainersStore = {
    trainers: Trainer[];
    loaded: boolean;
    fetch: () => Promise<void>;
};

export const useTrainersStore = create<TrainersStore>((set, get) => ({
    trainers: [],
    loaded: false,
    fetch: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/trainers');
            if (!res.ok) return;
            const data = await res.json();
            set({ trainers: data.trainers ?? [], loaded: true });
        } catch (e) {
            console.error('[trainersStore.fetch]', e);
        }
    },
}));