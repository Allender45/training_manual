'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, useCallAnalysesStore  } from '@/store';
import { Header, Sidebar } from '@/containers';
import { Table } from '@/components';
import type { Column } from '@/components/Table/Table';

type CallRecord = {
    id: number;
    datetime: string;
    client_name: string;
    client_phone: string;
    duration: number;
    filename: string;
};

type Analysis = {
    transcript: string;
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
};

const STUB_CALLS: CallRecord[] = [
    { id: 1, datetime: '27.05.2026 09:14', client_name: 'Иванов Сергей Павлович',   client_phone: '+7 912 345-67-89', duration: 183, filename: '1778645276.241636-2026-05-13-04_08-79064787930-.mp3' },
    { id: 2, datetime: '27.05.2026 10:42', client_name: 'Петрова Анна Викторовна',  client_phone: '+7 905 123-45-67', duration: 97,  filename: '1778836252.287219-2026-05-15-09_11-+79218258043-s.mp3' },
    { id: 3, datetime: '27.05.2026 11:55', client_name: 'Сидоров Алексей Юрьевич', client_phone: '+7 916 987-65-43', duration: 312, filename: '1779002188.311757-2026-05-17-07_16-+79125142675-s.mp3' },
    { id: 4, datetime: '26.05.2026 14:30', client_name: 'Козлова Мария Андреевна',  client_phone: '+7 903 654-32-10', duration: 245, filename: '1779096114.329349-2026-05-18-09_22-+79066674807-s.mp3' },
    { id: 5, datetime: '26.05.2026 16:08', client_name: 'Новиков Дмитрий Игоревич', client_phone: '+7 919 222-33-44', duration: 68,  filename: '1779277031.369608-2026-05-20-11_37-79092545519-.mp3' },
];

function fmtDuration(sec: number): string {
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
        render: row => <span className="text-gray-500">{fmtDuration(row.duration)}</span>,
    },
];

export default function CallsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [playingCall, setPlayingCall] = useState<CallRecord | null>(null);
    const [analysing, setAnalysing] = useState<number | null>(null);
    const { analyses: rawAnalyses, fetchAnalyses, setAnalysis } = useCallAnalysesStore();
    const [viewingAnalysis, setViewingAnalysis] = useState<number | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchAnalyses(STUB_CALLS.map(c => c.filename));
    }, []);

    async function analyze(call: CallRecord) {
        setAnalysing(call.id);
        try {
            const res = await fetch('/api/calls/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: call.filename, url: `/records/${call.filename}` }),
            });
            const data = await res.json();
            if (data.analysis) {
                setAnalysis(data.analysis);
                setViewingAnalysis(call.id);
            }
        } finally {
            setAnalysing(null);
        }
    }

    const analyses: Record<number, Analysis> = {};
    for (const call of STUB_CALLS) {
        if (rawAnalyses[call.filename]) analyses[call.id] = rawAnalyses[call.filename];
    }
    const analysis = viewingAnalysis !== null ? analyses[viewingAnalysis] ?? null : null;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Анализ звонков</h3>

                    <div className="bg-white rounded-xl shadow-sm">
                        <Table
                            columns={columns}
                            data={STUB_CALLS}
                            keyField="id"
                            emptyText="Нет записей"
                            buttonPlay
                            buttonAnalyze={row => !analyses[row.id]}
                            buttonViewAnalysis
                            onPlay={row => setPlayingCall(playingCall?.id === row.id ? null : row)}
                            onAnalyze={row => analyze(row)}
                            onViewAnalysis={row => setViewingAnalysis(viewingAnalysis === row.id ? null : row.id)}
                            isAnalysing={row => analysing === row.id}
                            hasAnalysis={row => !!analyses[row.id]}
                        />
                    </div>

                    {playingCall && (
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-2">{playingCall.client_name} — {playingCall.datetime}</p>
                            <audio controls autoPlay className="w-full" src={`/records/${playingCall.filename}`} />
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
                </main>
            </div>
        </div>
    );
}