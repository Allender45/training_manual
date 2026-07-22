'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useUsersListStore } from '@/store';
import { computeScore, scoreColor, BADGES } from '@/lib/adaptationUtils'
import { toPeriod } from '@/lib/date'

type Intern = {
    id: number;
    name: string;
    crm_id: number | null;
    adaptation_access: boolean;
    courses_completed: number;
    courses_total: number;
};

type AdaptationPlan = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type DayItem = {
    date: string;
    calls: { total: number };
    conversions: { newClientConversionPercent: number };
    cash: { newClients: number; total: number };
};

function InternTable({ interns, plans, stats }: {
    interns: Intern[];
    plans: Record<number, AdaptationPlan | null>;
    stats: Record<number, DayItem[]>;
}) {
    if (!interns.length) return (
        <p className="px-10 py-4 text-sm text-gray-400">Нет стажёров</p>
    );

    return (
        <table className="w-full">
            <thead>
            <tr className="text-xs font-medium text-gray-400 border-b border-gray-100">
                <th className="px-10 py-2 text-left w-12">#</th>
                <th className="px-4 py-2 text-left">ФИО</th>
                <th className="px-4 py-2 text-left">Прогресс</th>
                <th className="px-4 py-2 text-left">Адаптация (5 дн.)</th>
            </tr>
            </thead>
            <tbody>
            {interns.map((intern, idx) => {
                const plan = plans[intern.id];
                const internStats = stats[intern.id] ?? [];
                const score = plan ? computeScore(internStats, plan) : null;
                const progress = intern.courses_total > 0
                    ? Math.round((intern.courses_completed / intern.courses_total) * 100)
                    : 0;

                return (
                    <tr
                        key={intern.id}
                        onClick={() => window.location.href = `/users/edit?id=${intern.id}`}
                        className="border-b border-gray-100 last:border-0 hover:bg-white cursor-pointer transition-colors"
                    >
                        <td className="px-10 py-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{intern.name}</td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {intern.courses_completed}/{intern.courses_total}
                                    </span>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            {!intern.adaptation_access ? (
                                <span className="text-xs text-gray-300">—</span>
                            ) : score ? (
                                <div className="flex items-center gap-2">
                                    {BADGES.map(({ key, Icon }) => (
                                        <span key={key} className={`inline-flex items-center gap-0.5 text-xs font-semibold ${scoreColor(score[key])}`}>
                                                <Icon size={11} />
                                            {score[key]}/5
                                            </span>
                                    ))}
                                </div>
                            ) : plan === null ? (
                                <span className="text-xs text-gray-400">Не назначена</span>
                            ) : (
                                <span className="text-xs text-gray-400">Загрузка...</span>
                            )}
                        </td>
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
}

export default function TeachersTable() {
    const mentors  = useUsersListStore(s => s.mentors);
    const loading  = useUsersListStore(s => s.loading);
    const fetchMentors = useUsersListStore(s => s.fetchMentors);

    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [internCache, setInternCache] = useState<Record<number, Intern[]>>({});
    const [internLoading, setInternLoading] = useState<Record<number, boolean>>({});
    const [plans, setPlans] = useState<Record<number, AdaptationPlan | null>>({});
    const [stats, setStats] = useState<Record<number, DayItem[]>>({});

    useEffect(() => {
        fetchMentors();
    }, []);

    async function toggleMentor(mentorId: number) {
        if (expanded.has(mentorId)) {
            setExpanded(prev => { const next = new Set(prev); next.delete(mentorId); return next; });
            return;
        }
        setExpanded(prev => new Set(prev).add(mentorId));
        if (internCache[mentorId]) return;

        setInternLoading(p => ({ ...p, [mentorId]: true }));
        try {
            const res = await fetch(`/api/teachers/${mentorId}`);
            const data = await res.json();
            const list: Intern[] = data.interns ?? [];
            setInternCache(p => ({ ...p, [mentorId]: list }));

            const withAdaptation = list.filter(i => i.adaptation_access);
            const period = toPeriod(new Date());

            await Promise.all([
                ...withAdaptation.map(intern =>
                    fetch(`/api/adaptations/${intern.id}`)
                        .then(r => r.json())
                        .then(d => setPlans(p => ({ ...p, [intern.id]: d.adaptation ?? null })))
                        .catch(() => setPlans(p => ({ ...p, [intern.id]: null })))
                ),
                ...withAdaptation.filter(i => i.crm_id).map(intern =>
                    fetch(`/api/adaptations/statistics?userId=${intern.crm_id}&period=${period}`)
                        .then(r => r.json())
                        .then(d => setStats(p => ({ ...p, [intern.id]: d.data ?? [] })))
                        .catch(() => setStats(p => ({ ...p, [intern.id]: [] })))
                ),
            ]);
        } finally {
            setInternLoading(p => ({ ...p, [mentorId]: false }));
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Наставники</h3>
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                            <div className="h-4 w-6 bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 flex-1 max-w-48 bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                            <div className="h-6 w-6 bg-gray-100 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : mentors.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Наставники не найдены</p>
            ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left w-10">#</th>
                            <th className="px-4 py-3 text-left">ФИО</th>
                            <th className="px-4 py-3 text-left">Подразделение</th>
                            <th className="px-4 py-3 text-center">Стажёры</th>
                            <th className="w-10" />
                        </tr>
                        </thead>
                        <tbody>
                        {mentors.map((mentor, idx) => (
                            <React.Fragment key={mentor.id}>
                                <tr
                                    onClick={() => toggleMentor(mentor.id)}
                                    className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${expanded.has(mentor.id) ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                                >
                                    <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{mentor.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400">—</td>
                                    <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                                                {mentor.intern_count}
                                            </span>
                                    </td>
                                    <td className="px-3 text-right">
                                        <ChevronRight
                                            size={16}
                                            className={`text-gray-400 transition-transform duration-200 ${expanded.has(mentor.id) ? 'rotate-90' : ''}`}
                                        />
                                    </td>
                                </tr>

                                {expanded.has(mentor.id) && (
                                    <tr>
                                        <td colSpan={5} className="p-0 bg-gray-50 border-b">
                                            {internLoading[mentor.id] ? (
                                                <p className="px-10 py-4 text-sm text-gray-400">Загрузка стажёров...</p>
                                            ) : (
                                                <InternTable
                                                    interns={internCache[mentor.id] ?? []}
                                                    plans={plans}
                                                    stats={stats}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}