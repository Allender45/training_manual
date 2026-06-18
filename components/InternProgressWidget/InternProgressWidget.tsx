'use client';

import {useEffect} from 'react';
import {PhoneCall, Percent, UserPlus, Wallet} from 'lucide-react';
import {useUsersListStore, useMentorWidgetStatsStore, useMentorInternsPlansStore} from '@/store';
import type {ApiDayItem} from '@/store';

type AdaptationInfo = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type Score = { calls: number; conv: number; revNew: number; revTotal: number };

export type TestData = {
    users: Array<{ id: number; name: string; crm_id: number | null }>;
    raw: { intern: { id: number; name: string; crm_id: number | null }; data: ApiDayItem[] }[];
    plans: Record<number, AdaptationInfo | null>;
};

function computeScore(data: ApiDayItem[], plan: AdaptationInfo): Score {
    const last5 = [...data]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(d => d.calls.total >= 5)
        .slice(0, 5);
    return {
        calls:    plan.plan_calls     != null ? last5.filter(d => d.calls.total >= plan.plan_calls!).length : 0,
        conv:     plan.plan_conversion != null ? last5.filter(d => d.conversions.newClientConversionPercent >= plan.plan_conversion!).length : 0,
        revNew:   plan.plan_revenue_new  != null ? last5.filter(d => d.cash.newClients >= plan.plan_revenue_new!).length : 0,
        revTotal: plan.plan_revenue_total != null ? last5.filter(d => d.cash.total >= plan.plan_revenue_total!).length : 0,
    };
}

function scoreColor(s: number) {
    return s === 5 ? 'text-green-600' : s >= 3 ? 'text-amber-500' : 'text-red-500';
}

function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const BADGES = [
    {key: 'calls'    as const, Icon: PhoneCall},
    {key: 'conv'     as const, Icon: Percent},
    {key: 'revNew'   as const, Icon: UserPlus},
    {key: 'revTotal' as const, Icon: Wallet},
];

const AVATAR_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];

export default function InternProgressWidget({testData}: { testData?: TestData }) {
    const storeUsers  = useUsersListStore(s => s.users);
    const fetchUsers  = useUsersListStore(s => s.fetchUsers);
    const storeRaw    = useMentorWidgetStatsStore(s => s.raw);
    const storePlans  = useMentorInternsPlansStore(s => s.plans);
    const fetchPlans  = useMentorInternsPlansStore(s => s.fetchPlans);

    const users = testData ? testData.users : storeUsers.filter(u => u.adaptation_access);
    const raw   = testData ? testData.raw   : storeRaw;
    const plans = testData ? testData.plans : storePlans;

    useEffect(() => { if (!testData) fetchUsers(); }, []);

    useEffect(() => {
        if (testData || !users.length) return;
        fetchPlans(users.map(u => u.id));
    }, [users]);

    if (!users.length) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center px-4 py-3 border-b">
                <h5 className="text-sm text-gray-800">Прогресс стажёров за последние 5 дней</h5>
            </div>
            <ul className="divide-y">
                {users.map((intern, i) => {
                    const internRaw = raw.find(r => r.intern.id === intern.id);
                    const plan = plans[intern.id];
                    const score = plan ? computeScore(internRaw?.data ?? [], plan) : null;

                    return (
                        <li key={intern.id} className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                                {initials(intern.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{intern.name}</p>
                                {score ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {BADGES.map(({key, Icon}) => (
                                            <span key={key} className={`inline-flex items-center gap-0.5 text-xs font-semibold ${scoreColor(score[key])}`}>
                                                <Icon size={11}/>
                                                {score[key]}/5
                                            </span>
                                        ))}
                                    </div>
                                ) : plan === null ? (
                                    <p className="text-xs text-gray-400 mt-0.5">Адаптация не назначена</p>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-0.5">Загрузка...</p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}