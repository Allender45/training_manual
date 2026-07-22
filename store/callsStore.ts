import { create } from 'zustand';

export type CallRecord = {
    id: number;
    callId: string;
    datetime: string;
    client_name: string;
    client_phone: string;
    duration: number;
    filename: string;
    hasRecording: boolean;
};

export type CallsMeta = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
};

function fmtDate(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

type CallsStore = {
    callsByPage: Record<number, CallRecord[]>;
    meta: CallsMeta | null;
    loading: boolean;
    loadingUserId: number | null;
    error: string | null;
    loadedUserId: number | null;
    fetchCalls: (userId: number, page: number) => Promise<void>;
    setError: (error: string | null) => void;
    reset: () => void;
    recordingUrls: Record<string, { url: string; fetchedAt: number }>;
    fetchRecordingUrl: (userId: number, callId: string) => Promise<string | null>;
};

export const useCallsStore = create<CallsStore>((set, get) => ({
    callsByPage: {},
    meta: null,
    loading: false,
    loadingUserId: null,
    error: null,
    loadedUserId: null,
    setError: (error) => set({ error }),
    recordingUrls: {},

    fetchRecordingUrl: async (userId, callId) => {
        const cached = get().recordingUrls[callId];
        if (cached && Date.now() - cached.fetchedAt < 55 * 60 * 1000) return cached.url;

        try {
            const res = await fetch(`/api/calls/record?userId=${userId}&callId=${callId}`);
            const data = await res.json();
            if (!res.ok || !data.recordingUrl) return null;

            set(state => ({
                recordingUrls: { ...state.recordingUrls, [callId]: { url: data.recordingUrl, fetchedAt: Date.now() } }
            }));
            return data.recordingUrl;
        } catch {
            return null;
        }
    },

    fetchCalls: async (userId, page) => {
        const s = get();
        if (s.loading && s.loadingUserId === userId) return;
        if (s.loadedUserId === userId && s.callsByPage[page]) return;

        if (s.loadedUserId !== null && s.loadedUserId !== userId) {
            set({ callsByPage: {} });
        }

        set({ loading: true, loadingUserId: userId, error: null });
        try {
            const res = await fetch(`/api/calls?userId=${userId}&page=${page}`);
            const data = await res.json();
            if (get().loadingUserId !== userId) return;
            if (!res.ok) { set({ error: data.error ?? 'Ошибка' }); return; }

            const mapped: CallRecord[] = data.data.map((c: any, i: number) => ({
                id: (page - 1) * (data.meta?.per_page ?? 20) + i + 1,
                callId: c.id,
                datetime: fmtDate(c.date),
                client_name: c.client?.name ?? 'Неизвестный',
                client_phone: c.client?.phone ?? '—',
                duration: c.durationSec ?? 0,
                filename: c.id,
                hasRecording: c.hasRecording,
            }));

            set(state => ({
                callsByPage: { ...state.callsByPage, [page]: mapped },
                meta: data.meta ?? null,
                loadedUserId: userId,
            }));
        } catch {
            if (get().loadingUserId === userId) set({ error: 'Ошибка соединения' });
        } finally {
            if (get().loadingUserId === userId) set({ loading: false, loadingUserId: null });
        }
    },

    reset: () => set({ callsByPage: {}, meta: null, loading: false, loadingUserId: null, error: null, loadedUserId: null, recordingUrls: {} }),
}));