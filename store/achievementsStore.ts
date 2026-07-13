import { create } from 'zustand';

export type AchievementOption = {
    id: number;
    icon: string;
    title: string;
    description: string | null
};

type AchievementsStore = {
    achievements: AchievementOption[];
    loaded: boolean;
    fetch: () => Promise<void>;
};

export const useAchievementsStore = create<AchievementsStore>((set, get) => ({
    achievements: [],
    loaded: false,
    fetch: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/achievements');
            if (!res.ok) return;
            const data = await res.json();
            set({ achievements: data.achievements ?? [], loaded: true });
        } catch (e) {
            console.error('[achievementsStore.fetch]', e);
        }
    },
}));