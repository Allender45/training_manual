'use client';

import {useEffect} from 'react';
import {useUsersListStore, useMentorWidgetStatsStore, useMentorInternsPlansStore} from '@/store';
import type {ApiDayItem} from '@/store';
import {Avatar} from '@/components';
import {computeScore, scoreColor, BADGES} from '@/lib/adaptationUtils';
import {getInitials} from '@/lib/format';

type AdaptationInfo = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

export type TestData = {
    users: Array<{ id: number; name: string; crm_id: number | null }>;
    raw: { intern: { id: number; name: string; crm_id: number | null }; data: ApiDayItem[] }[];
    plans: Record<number, AdaptationInfo | null>;
};

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
                            <Avatar
                                size="md"
                                fallback={getInitials(...intern.name.split(' '))}
                                color={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white`}
                                className="font-medium flex-shrink-0"
                            />
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