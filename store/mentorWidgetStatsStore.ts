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
    requestId: number;
    fetchStats: (interns: Intern[], period: string) => Promise<void>;
};

export const useMentorWidgetStatsStore = create<mentorWidgetStatsStore>((set, get) => ({
    raw: [],
    loading: false,
    requestId: 0,
    fetchStats: async (interns, period) => {
        const reqId = get().requestId + 1;
        set({ loading: true, requestId: reqId });
        try {
            const results = await Promise.all(
                interns
                    .filter(intern => intern.crm_id != null)
                    .map(intern =>
                        fetch(`/api/adaptations/statistics?userId=${intern.crm_id}&period=${period}`)
                            .then(r => r.ok ? r.json() : { data: [] })
                            .then(json => ({ intern, data: (json.data ?? []) as ApiDayItem[] }))
                            .catch(() => ({ intern, data: [] as ApiDayItem[] }))
                    )
            );
            if (get().requestId !== reqId) return;
            set({ raw: results });
        } finally {
            if (get().requestId === reqId) set({ loading: false });
        }
    },
}));