import { create } from 'zustand';
import { ApiDayItem } from '@/lib/adaptationUtils'

export type DayData = {
    date: string;
    calls: number;
    conversion: number;
    revenue_new: number;
    revenue_total: number;
};

function mapApiDay(item: ApiDayItem): DayData {
    const [y, m, d] = item.date.split('-');
    return {
        date: `${d}.${m}.${y}`,
        calls: item.calls.total,
        conversion: item.conversions.newClientConversionPercent,
        revenue_new: item.cash.newClients,
        revenue_total: item.cash.total,
    };
}

type AdaptationInfo = {
    id: number;
    started_at: string;
    plan_name: string | null;
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type AdaptationStore = {
    adaptation: AdaptationInfo | null;
    loading: boolean;
    fetchAdaptation: (userId: number) => Promise<void>;
    dayData: DayData[];
    dayDataLoading: boolean;
    fetchDayData: (crmUserId: number, period: string) => Promise<void>;
    reset: () => void;
};

export const useAdaptationStore = create<AdaptationStore>((set) => ({
    adaptation: null,
    loading: false,
    fetchAdaptation: async (userId) => {
        set({ loading: true });
        try {
            const res = await fetch(`/api/adaptations/${userId}`);
            const data = await res.json();
            set({ adaptation: data.adaptation ?? null });
        } catch (error) {
            console.error('[fetchAdaptation]', error);
        } finally {
            set({ loading: false });
        }
    },
    dayData: [],
    dayDataLoading: false,
    fetchDayData: async (crmUserId, period) => {
        set({ dayDataLoading: true });
        try {
            const res = await fetch(`/api/adaptations/statistics?userId=${crmUserId}&period=${period}`);
            const json = await res.json();
            set({ dayData: (json.data as ApiDayItem[]).map(mapApiDay) });
        } catch {
            set({ dayData: [] });
        } finally {
            set({ dayDataLoading: false });
        }
    },
    reset: () => set({ adaptation: null, loading: false, dayData: [], dayDataLoading: false }),
}));