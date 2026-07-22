import { create } from 'zustand';

export type InternAdaptationInfo = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type MentorInternsPlansStore = {
    plans: Record<number, InternAdaptationInfo | null>;
    fetchPlans: (userIds: number[]) => Promise<void>;
    reset: () => void;
};

export const useMentorInternsPlansStore = create<MentorInternsPlansStore>((set, get) => ({
    plans: {},
    fetchPlans: async (userIds) => {
        const toFetch = userIds.filter(id => !(id in get().plans));
        if (!toFetch.length) return;
        await Promise.all(
            toFetch.map(id =>
                fetch(`/api/adaptations/${id}`)
                    .then(r => r.ok ? r.json() : { adaptation: null })
                    .then(d => set(s => ({plans: {...s.plans, [id]: d.adaptation ?? null}})))
                    .catch(  () => set(s => ({plans: {...s.plans, [id]: null}})))
            )
        );
    },
    reset: () => set({plans: {}}),
}));