import { create } from 'zustand';

export type Analysis = {
    recording_id: string;
    transcript: string;
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
};

type CallAnalysesStore = {
    analyses: Record<string, Analysis>;
    fetchAnalyses: (filenames: string[]) => Promise<void>;
    setAnalysis: (analysis: Analysis) => void;
};

export const useCallAnalysesStore = create<CallAnalysesStore>((set, get) => ({
    analyses: {},
    fetchAnalyses: async (filenames: string[]) => {
        if (!filenames.length) return;
        const existing = get().analyses;
        if (filenames.every(id => id in existing)) return;
        try {
            const ids = filenames.join(',');
            const res = await fetch(`/api/calls/analyze?ids=${encodeURIComponent(ids)}`);
            const data = await res.json();
            if (data.analyses) set(state => ({ analyses: { ...state.analyses, ...data.analyses } }));
        } catch (e) {
            console.error('[fetchAnalyses]', e);
        }
    },
    setAnalysis: (analysis: Analysis) =>
        set(state => ({ analyses: { ...state.analyses, [analysis.recording_id]: analysis } })),
}));