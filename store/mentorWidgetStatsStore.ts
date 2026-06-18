import { create } from 'zustand';

type Intern = { id: number; name: string; crm_id: number | null };

export type ApiDayItem = {
    date: string;
    calls: { total: number };
    conversions: { newClientConversionPercent: number };
    cash: { newClients: number; total: number };
};

type mentorWidgetStatsStore = {
    raw: { intern: Intern; data: ApiDayItem[] }[];
    loading: boolean;
    fetchStats: (interns: Intern[], period: string) => Promise<void>;
};

export const useMentorWidgetStatsStore = create<mentorWidgetStatsStore>((set) => ({
    raw: [],
    loading: false,
    fetchStats: async (interns, period) => {
        set({ loading: true });
        try {
            const results = await Promise.all(
                interns.map(intern =>
                    fetch(`/api/adaptations/statistics?userId=${intern.crm_id}&period=${period}`)
                        .then(r => r.json())
                        .then(json => ({ intern, data: (json.data ?? []) as ApiDayItem[] }))
                        .catch(() => ({ intern, data: [] as ApiDayItem[] }))
                )
            );
            set({ raw: results });
        } finally {
            set({ loading: false });
        }
    },
}));