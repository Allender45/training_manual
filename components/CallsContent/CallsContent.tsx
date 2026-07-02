'use client';

import { useState, useEffect } from 'react';
import {useCallAnalysesStore, useCallsStore} from '@/store';
import { Table } from '@/components';
import type { Column } from '@/components/Table/Table';

type CallRecord = {
    id: number;
    callId: string;
    datetime: string;
    client_name: string;
    client_phone: string;
    duration: number;
    filename: string;
    hasRecording: boolean;
};

type Analysis = {
    transcript: string;
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
};

type Props = {
    userId?: number | null;
};

function fmtDuration(sec: number): string {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

const columns: Column<CallRecord>[] = [
    { key: 'id', header: '№', className: 'w-12 text-gray-400' },
    { key: 'datetime', header: 'Дата и время' },
    {
        key: 'client_name',
        header: 'Клиент',
        render: row => (
            <div>
                <p className="font-medium text-gray-800">{row.client_name}</p>
                <p className="text-xs text-gray-400">{row.client_phone}</p>
            </div>
        ),
    },
    {
        key: 'duration',
        header: 'Длительность',
        className: 'max-w-5',
        render: row => <span className="text-gray-500">{fmtDuration(row.duration)}</span>,
    },
];

export default function CallsContent({ userId }: Props) {
    const [page, setPage] = useState(1);

    const [playingCall, setPlayingCall] = useState<CallRecord | null>(null);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const [loadingPlay, setLoadingPlay] = useState<number | null>(null);
    const [analysing, setAnalysing] = useState<number | null>(null);
    const [viewingAnalysis, setViewingAnalysis] = useState<number | null>(null);
    const { analyses: rawAnalyses, fetchAnalyses, setAnalysis } = useCallAnalysesStore();
    const { callsByPage, meta, loading, error, fetchCalls, setError, fetchRecordingUrl } = useCallsStore();
    const calls = callsByPage[page] ?? [];


    useEffect(() => {
        if (userId) fetchCalls(userId, page);
    }, [userId, page]);

    useEffect(() => {
        const ids = calls.filter(c => c.hasRecording).map(c => c.filename);
        if (ids.length) fetchAnalyses(ids);
    }, [calls]);

    async function handlePlay(row: CallRecord) {
        if (playingCall?.id === row.id) { setPlayingCall(null); setPlayingUrl(null); return; }
        setLoadingPlay(row.id);
        setPlayingCall(null);
        setPlayingUrl(null);
        const url = await fetchRecordingUrl(userId!, row.callId);
        if (!url) setError('Не удалось получить запись');
        else { setPlayingCall(row); setPlayingUrl(url); }
        setLoadingPlay(null);
    }

    async function analyze(call: CallRecord) {
        setAnalysing(call.id);
        try {
            const url = await fetchRecordingUrl(userId!, call.callId);
            if (!url) { setError('Не удалось получить ссылку на запись'); return; }

            const res = await fetch('/api/calls/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: call.callId, url }),
            });
            const data = await res.json();
            if (data.analysis) { setAnalysis(data.analysis); setViewingAnalysis(call.id); }
        } finally {
            setAnalysing(null);
        }
    }

    const analyses: Record<number, Analysis> = {};
    for (const call of calls) {
        if (rawAnalyses[call.filename]) analyses[call.id] = rawAnalyses[call.filename];
    }
    const analysis = viewingAnalysis !== null ? analyses[viewingAnalysis] ?? null : null;

    if (!userId) return <p className="text-gray-400 text-sm">Нет данных пользователя</p>;

    return (
        <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="bg-white rounded-xl shadow-sm">
                <Table
                    columns={columns}
                    data={calls}
                    keyField="id"
                    emptyText={loading ? 'Загрузка...' : 'Нет записей'}
                    buttonPlay={row => row.hasRecording}
                    buttonAnalyze={row => row.hasRecording && !analyses[row.id]}
                    buttonViewAnalysis
                    onPlay={row => handlePlay(row)}
                    isPlayLoading={row => loadingPlay === row.id}
                    onAnalyze={row => analyze(row)}
                    onViewAnalysis={row => setViewingAnalysis(viewingAnalysis === row.id ? null : row.id)}
                    isAnalysing={row => analysing === row.id}
                    hasAnalysis={row => !!analyses[row.id]}
                />
            </div>

            {/* пагинация */}
            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-3 py-1 rounded-lg border text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                    >
                        ←
                    </button>
                    <span className="text-sm text-gray-500">
                        {page} / {meta.last_page} (всего {meta.total})
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                        disabled={page === meta.last_page || loading}
                        className="px-3 py-1 rounded-lg border text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                    >
                        →
                    </button>
                </div>
            )}

            {playingCall && playingUrl && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <p className="text-xs text-gray-500 mb-2">{playingCall.client_name} — {playingCall.datetime}</p>
                    <audio controls autoPlay className="w-full" src={playingUrl} />
                    <p className="text-xs text-gray-400 mt-1">
                        Ссылка действительна ~1 час
                    </p>
                </div>
            )}

            {analysis && (
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-sm">
                    <div>
                        <p className="font-semibold text-gray-700 mb-1">Транскрипция</p>
                        <p className="text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{analysis.transcript}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-green-700 mb-1">✓ Сильные стороны</p>
                        <ul className="space-y-1">
                            {analysis.strong_points.map((p, i) => <li key={i} className="bg-green-50 rounded-lg p-2 text-gray-700">{p}</li>)}
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-red-700 mb-1">✗ Слабые стороны</p>
                        <ul className="space-y-1">
                            {analysis.weak_points.map((p, i) => <li key={i} className="bg-red-50 rounded-lg p-2 text-gray-700">{p}</li>)}
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-700 mb-1">💡 Рекомендации</p>
                        <ul className="space-y-1">
                            {analysis.recommendations.map((p, i) => <li key={i} className="bg-blue-50 rounded-lg p-2 text-gray-700">{p}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}