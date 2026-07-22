'use client';

import {useState, useEffect, useMemo} from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {Button} from '@/components';
import {useUsersListStore, useMentorWidgetStatsStore} from '@/store';
import type {ApiDayItem} from '@/store';
import {toPeriod} from '@/lib/date';

type Intern = { id: number; name: string; crm_id: number | null };

export type TestData = {
    interns: Intern[];
    raw: { intern: Intern; data: ApiDayItem[] }[];
};

type DayPoint = { date: string; [name: string]: number | string };
type Metric = 'calls' | 'conversion' | 'revenue_new' | 'revenue_total';

const METRICS: { key: Metric; label: string }[] = [
    {key: 'calls', label: 'Звонки'},
    {key: 'conversion', label: 'Конверсия'},
    {key: 'revenue_new', label: 'Касса (новые)'},
    {key: 'revenue_total', label: 'Касса общая'},
];

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

function getMetricValue(item: ApiDayItem, metric: Metric): number {
    if (metric === 'calls') return item.calls.total;
    if (metric === 'conversion') return item.conversions.newClientConversionPercent;
    if (metric === 'revenue_new') return item.cash.newClients;
    return item.cash.total;
}

function buildChartData(
    raw: { intern: Intern; data: ApiDayItem[] }[],
    metric: Metric,
): DayPoint[] {
    const map = new Map<string, DayPoint>();
    for (const {intern, data} of raw) {
        for (const item of data ?? []) {
            const day = item.date.split('-')[2];
            if (!map.has(day)) map.set(day, {date: day});
            map.get(day)![intern.name] = getMetricValue(item, metric);
        }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function MentorChart({testData}: { testData?: TestData }) {
    const [period, setPeriod] = useState(() => toPeriod(new Date()));
    const [metric, setMetric] = useState<Metric>('calls');
    const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

    const storeUsers = useUsersListStore(s => s.users);
    const storeRaw = useMentorWidgetStatsStore(s => s.raw);
    const storeLoading = useMentorWidgetStatsStore(s => s.loading);
    const fetchUsers = useUsersListStore(s => s.fetchUsers);
    const fetchStats = useMentorWidgetStatsStore(s => s.fetchStats);

    function toggleLine(name: string) {
        setHiddenLines(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    useEffect(() => { if (!testData) fetchUsers(); }, []);

    const interns = useMemo(
        () => testData ? testData.interns : (storeUsers as Intern[]).filter(u => u.crm_id),
        [testData, storeUsers]
    );

    const raw = testData ? testData.raw : storeRaw;
    const loading = testData ? false : storeLoading;

    useEffect(() => {
        if (testData || !interns.length) return;
        fetchStats(interns, period);
    }, [interns, period]);

    const chartData = buildChartData(raw, metric);

    function changePeriod(delta: number) {
        const y = parseInt(period.slice(0, 4));
        const m = parseInt(period.slice(4)) - 1;
        setPeriod(toPeriod(new Date(y, m + delta, 1)));
    }

    const periodLabel = new Date(
        parseInt(period.slice(0, 4)),
        parseInt(period.slice(4)) - 1,
        1,
    ).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});

    return (
        <div className="w-full bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h5 className="font-semibold text-gray-800">Показатели стажёров</h5>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button onClick={() => changePeriod(-1)}
                            className="p-1 rounded hover:bg-gray-100 text-lg leading-none">‹
                    </button>
                    <span className="capitalize">{periodLabel}</span>
                    <button onClick={() => changePeriod(1)}
                            className="p-1 rounded hover:bg-gray-100 text-lg leading-none">›
                    </button>
                </div>
            </div>

            <div className={'flex flex-col md:flex-row gap-4'}>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {METRICS.map(m => (
                        <Button
                            key={m.key}
                            onClick={() => setMetric(m.key)}
                            variant="primary"
                            className="whitespace-nowrap"
                        >
                            {m.label}
                        </Button>
                    ))}
                </div>

                {loading ? (
                    <div className="h-52 flex items-center justify-center text-sm text-gray-400">Загрузка...</div>
                ) : interns.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm text-gray-400">Нет закреплённых стажёров</div>
                ) : (
                    <div className={'flex flex-col gap-2 w-full'}>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{top: 4, right: 16, left: 0, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                <XAxis dataKey="date" tick={{fontSize: 11}}/>
                                <YAxis tick={{fontSize: 11}} width={50}/>
                                <Tooltip/>
                                {interns.map((intern, i) => (
                                    <Line
                                        key={intern.id}
                                        type="monotone"
                                        dataKey={intern.name}
                                        stroke={COLORS[i % COLORS.length]}
                                        dot={false}
                                        strokeWidth={2}
                                        connectNulls
                                        hide={hiddenLines.has(intern.name)}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="flex flex-wrap gap-3 mb-2">
                            {interns.map((intern, i) => (
                                <label key={intern.id}
                                       className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={!hiddenLines.has(intern.name)}
                                        onChange={() => toggleLine(intern.name)}
                                        className="w-3 h-3 rounded"
                                        style={{accentColor: COLORS[i % COLORS.length]}}
                                    />
                                    <span style={{color: COLORS[i % COLORS.length]}} className="font-medium">
                                        {intern.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}