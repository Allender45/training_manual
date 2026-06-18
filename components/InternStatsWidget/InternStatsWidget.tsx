'use client';

import {useEffect} from 'react';
import {Users, BookOpen, GraduationCap} from 'lucide-react';
import {useUsersListStore} from '@/store';

export default function InternStatsWidget() {
    const users = useUsersListStore(s => s.users);
    const loading = useUsersListStore(s => s.loading);
    const fetchUsers = useUsersListStore(s => s.fetchUsers);

    useEffect(() => {
        fetchUsers();
    }, []);

    const total = users.length;
    const onAdaptation = users.filter(u => u.adaptation_access).length;
    const onTraining = total - onAdaptation;

    const cards = [
        {label: 'Всего стажёров', value: total, icon: Users, color: 'bg-purple-100 text-purple-600'},
        {label: 'На обучении', value: onTraining, icon: BookOpen, color: 'bg-blue-100 text-blue-600'},
        {label: 'На адаптации', value: onAdaptation, icon: GraduationCap, color: 'bg-green-100 text-green-600'},
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                    <div className={'flex flex-col'}>
                        <div>
                            <p className="text-sm text-gray-500">{cards[0].label}</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {loading ? '—' : cards[0].value}
                            </p>
                        </div>
                        <div className={'flex gap-2 items-baseline'}>
                            <p className="text-xs text-gray-400">{cards[1].label}</p>
                            <p className="text-sm font-bold text-gray-800">
                                {loading ? '—' : cards[1].value}
                            </p>
                        </div>
                        <div className={'flex gap-2 items-baseline'}>
                            <p className="text-xs text-gray-400">{cards[2].label}</p>
                            <p className="text-sm font-bold text-gray-800">
                                {loading ? '—' : cards[2].value}
                            </p>
                        </div>
                    </div>
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cards[0].color}`}>
                        <Users size={20}/>
                    </div>
                </div>
            </div>
        </div>
    );
}