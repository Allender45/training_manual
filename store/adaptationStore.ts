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
    adaptationRequestId: number;
    dayDataRequestId: number;
    reset: () => void;
};

export const useAdaptationStore = create<AdaptationStore>((set, get) => ({
    adaptation: null,
    loading: false,
    fetchAdaptation: async (userId) => {
        const reqId = get().adaptationRequestId + 1;
        set({ loading: true, adaptationRequestId: reqId });
        try {
            const res = await fetch(`/api/adaptations/${userId}`);
            if (!res.ok) return;
            const data = await res.json();
            if (get().adaptationRequestId !== reqId) return;
            set({ adaptation: data.adaptation ?? null });
        } catch (error) {
            console.error('[fetchAdaptation]', error);
        } finally {
            if (get().adaptationRequestId === reqId) set({ loading: false });
        }
    },
    dayData: [],
    dayDataLoading: false,
    adaptationRequestId: 0,
    dayDataRequestId: 0,
    fetchDayData: async (crmUserId, period) => {
        const reqId = get().dayDataRequestId + 1;
        set({ dayDataLoading: true, dayDataRequestId: reqId });
        try {
            const res = await fetch(`/api/adaptations/statistics?userId=${crmUserId}&period=${period}`);
            if (!res.ok) throw new Error(`Ошибка загрузки статистики: ${res.status}`);
            const json = await res.json();
            if (get().dayDataRequestId !== reqId) return;
            set({ dayData: (json.data as ApiDayItem[]).map(mapApiDay) });
        } catch {
            if (get().dayDataRequestId === reqId) set({ dayData: [] });
        } finally {
            if (get().dayDataRequestId === reqId) set({ dayDataLoading: false });
        }
    },
    reset: () => set({ adaptation: null, loading: false, dayData: [], dayDataLoading: false }),
}));