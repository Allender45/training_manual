import { create } from 'zustand';

type PlanOption = { value: string; label: string };

type AdaptationPlansStore = {
    plans: PlanOption[];
    loaded: boolean;
    fetchPlans: () => Promise<void>;
};

export const useAdaptationPlansStore = create<AdaptationPlansStore>((set, get) => ({
    plans: [],
    loaded: false,
    fetchPlans: async () => {
        if (get().loaded) return;
        try {
            const res = await fetch('/api/adaptation-plans');
            const data = await res.json();
            set({
                plans: (data.plans ?? [])
                    .filter((p: any) => p.is_active)
                    .map((p: any) => ({ value: String(p.id), label: p.name })),
                loaded: true,
            });
        } catch (error) {
            console.error('[fetchPlans]', error);
        }
    },
}));