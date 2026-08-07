'use client';

import {useState, useEffect, useMemo} from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {useUserStore, useUsersListStore, useMentorWidgetStatsStore} from '@/store';
import type {ApiDayItem} from '@/store';
import {toPeriod} from '@/lib/date';

type Metric = 'calls' | 'conversion' | 'newCash' | 'totalCash';

type InternRating = {
    name: string;
    calls: number;
    conversion: number;
    newCash: number;
    totalCash: number;
};

const METRICS: { key: Metric; label: string; suffix: string }[] = [
    {key: 'calls', label: '📞 Звонки', suffix: ''},
    {key: 'conversion', label: '🎯 Конверсия', suffix: '%'},
    {key: 'newCash', label: '💰 Касса (новые)', suffix: ' ₽'},
    {key: 'totalCash', label: '🏦 Касса общая', suffix: ' ₽'},
];

const COLORS = ['#2962ff', '#ff9f43', '#00cec9', '#ff6384', '#9966ff'];
const MEDALS = ['🥇', '🥈', '🥉'];

function avg(data: ApiDayItem[], pick: (d: ApiDayItem) => number): number {
    if (!data.length) return 0;
    return data.reduce((sum, d) => sum + pick(d), 0) / data.length;
}

export default function InternRatingChartWidget() {
    const [metric, setMetric] = useState<Metric>('calls');
    const [period, setPeriod] = useState(() => toPeriod(new Date()));

    const user = useUserStore(s => s.user);
    const userLoaded = useUserStore(s => s.loaded);
    const users = useUsersListStore(s => s.users);
    const usersLoading = useUsersListStore(s => s.loading);
    const fetchUsers = useUsersListStore(s => s.fetchUsers);
    const raw = useMentorWidgetStatsStore(s => s.raw);
    const statsLoading = useMentorWidgetStatsStore(s => s.loading);
    const fetchStats = useMentorWidgetStatsStore(s => s.fetchStats);
    const departmentId = user?.department_id ?? null;

    function changePeriod(delta: number) {
        const y = parseInt(period.slice(0, 4));
        const m = parseInt(period.slice(4)) - 1;
        setPeriod(toPeriod(new Date(y, m + delta, 1)));
    }

    useEffect(() => {
        if (departmentId) fetchUsers();
    }, [departmentId]);

    const interns = useMemo(
        () => users
            .filter(u => u.department_id === departmentId && u.crm_id != null)
            .map(u => ({id: u.id, name: u.name, crm_id: u.crm_id})),
        [users, departmentId]
    );

    useEffect(() => {
        if (interns.length) fetchStats(interns, period);
    }, [interns, period]);

    const ratings: InternRating[] = useMemo(() => raw.map(({intern, data}) => ({
        name: intern.name,
        calls: Math.round(avg(data, d => d.calls.total) * 10) / 10,
        conversion: Math.round(avg(data, d => d.conversions.newClientConversionPercent) * 10) / 10,
        newCash: Math.round(avg(data, d => d.cash.newClients)),
        totalCash: Math.round(avg(data, d => d.cash.total)),
    })), [raw]);

    const metricConf = METRICS.find(m => m.key === metric)!;
    const ranked = [...ratings].sort((a, b) => b[metric] - a[metric]);

    const chartData = ranked.map(intern => ({
        name: intern.name.split(' ')[0],
        value: intern[metric],
        color: COLORS[ratings.indexOf(intern) % COLORS.length],
    }));

    const periodLabel = new Date(
        parseInt(period.slice(0, 4)),
        parseInt(period.slice(4)) - 1,
        1,
    ).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});

    function fmt(value: number) {
        return `${value.toLocaleString('ru-RU')}${metricConf.suffix}`;
    }

    if (userLoaded && !departmentId) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm p-4">
                <h5 className="font-semibold text-gray-800 mb-2">🏆 Рейтинг стажёров</h5>
                <div className="h-24 flex items-center justify-center text-sm text-gray-400">
                    Вы не назначены в отдел
                </div>
            </div>
        );
    }

    const loading = !userLoaded || usersLoading || statsLoading;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h5 className="font-semibold text-gray-800">🏆 Рейтинг стажёров</h5>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-500">Среднедневные показатели ·</span>
                    <button onClick={() => changePeriod(-1)}
                            className="p-1 rounded hover:bg-gray-100 text-lg leading-none">‹
                    </button>
                    <span className="capitalize">{periodLabel}</span>
                    <button onClick={() => changePeriod(1)}
                            className="p-1 rounded hover:bg-gray-100 text-lg leading-none">›
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                {METRICS.map(m => (
                    <button
                        key={m.key}
                        onClick={() => setMetric(m.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            metric === m.key
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="h-52 flex items-center justify-center text-sm text-gray-400">Загрузка...</div>
            ) : ratings.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-gray-400">
                    В вашем отделе нет стажёров с привязкой к CRM
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} margin={{top: 4, right: 16, left: 0, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                            <XAxis dataKey="name" tick={{fontSize: 11}}/>
                            <YAxis tick={{fontSize: 11}} width={50}/>
                            <Tooltip formatter={(v) => [fmt(Number(v)), metricConf.label]}/>
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {chartData.map(d => (
                                    <Cell key={d.name} fill={d.color}/>
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {ranked.map((intern, i) => (
                            <div
                                key={intern.name}
                                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5"
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded"
                                    style={{background: COLORS[ratings.indexOf(intern) % COLORS.length]}}
                                />
                                <span className="text-xs font-medium text-gray-700">{intern.name}</span>
                                <span className="text-sm font-bold text-gray-900">{fmt(intern[metric])}</span>
                                <span className="text-xs text-gray-500">
                                    {i < 3 ? MEDALS[i] : `${i + 1} место`}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}