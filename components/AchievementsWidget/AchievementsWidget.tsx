'use client';

import { useEffect, useState } from 'react';
import { Trophy, Plus } from 'lucide-react';
import Modal from '@/containers/Modal/Modal';
import {hasFeature} from "@/lib/permissions";
import {useUserStore} from "@/store";

type Achievement = {
    id: number;
    icon: string;
    title: string;
    description: string | null;
};

type UserAchievement = Achievement & { completed_at: string };

type Props = {
    variant?: 'widget' | 'block';
    className?: string;
};

export default function AchievementsWidget({ variant = 'widget', className }: Props) {
    const user = useUserStore(s => s.user);
    const rid = user?.role_id ?? null;
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [adding, setAdding] = useState<number | null>(null);

    useEffect(() => {
        loadUserAchievements();
    }, []);

    function loadUserAchievements() {
        setLoading(true);
        fetch('/api/user-achievements')
            .then(r => r.json())
            .then(d => setAchievements(d.achievements ?? []))
            .finally(() => setLoading(false));
    }

    function openModal() {
        setModalOpen(true);
        setLoadingAll(true);
        fetch('/api/achievements')
            .then(r => r.json())
            .then(d => setAllAchievements(d.achievements ?? []))
            .finally(() => setLoadingAll(false));
    }

    async function handleAdd(achievementId: number) {
        setAdding(achievementId);
        try {
            await fetch('/api/user-achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ achievement_id: achievementId }),
            });
            const res = await fetch('/api/user-achievements');
            const data = await res.json();
            setAchievements(data.achievements ?? []);
        } finally {
            setAdding(null);
        }
    }

    const earnedIds = new Set(achievements.map(a => a.id));
    const available = allAchievements.filter(a => !earnedIds.has(a.id));

    const isBlock = variant === 'block';

    if (loading) return (
        <div className={isBlock ? className : 'bg-white rounded-xl shadow-sm p-4'}>
            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
    );

    const empty = (
        <div className="flex flex-col items-center py-8 text-center">
            <Trophy size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Пока нет достижений</p>
            <p className="text-xs text-gray-300 mt-1">Проходите курсы и тренировки, чтобы получить награды</p>
        </div>
    );

    if (isBlock) {
        return (
            <>
                <div className={className}>
                    <div className="flex items-center gap-2 mb-5">
                        <h4 className="text-base font-semibold text-gray-800">Достижения</h4>
                        {achievements.length > 0 && (
                            <span className="text-sm text-gray-400 ml-1">· {achievements.length}</span>
                        )}
                        {hasFeature(rid, 'userProfileAddAchievementsButton') &&
                            <button
                                onClick={openModal}
                                className="ml-auto w-7 h-7 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        }
                    </div>

                    {achievements.length === 0 ? empty : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {achievements.map(a => (
                                <div key={a.id} className="flex items-start gap-2">
                                    {a.icon ? (
                                        <img src={a.icon} alt={a.title} className="w-14 h-14 object-contain flex-shrink-0" title={`${a.title}\n${a.description}`} />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-2xl flex-shrink-0">
                                            🏆
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Добавить достижение" className="max-w-lg">
                    {loadingAll ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : available.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <Trophy size={32} className="text-gray-200 mb-2" />
                            <p className="text-sm text-gray-400">Все достижения уже получены</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {available.map(a => (
                                <button
                                    key={a.id}
                                    disabled={adding === a.id}
                                    onClick={() => handleAdd(a.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors text-left disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {a.icon ? (
                                        <img src={a.icon} alt={a.title} className="w-12 h-12 object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-xl flex-shrink-0">
                                            🏆
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                                        {a.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                                        )}
                                    </div>
                                    <Plus size={16} className="text-amber-400 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </Modal>
            </>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Trophy size={16} />
                </div>
                <p className="text-sm font-semibold text-gray-700">Достижения</p>
                {achievements.length > 0 && (
                    <span className="ml-auto text-sm text-gray-400">{achievements.length}</span>
                )}
            </div>

            {achievements.length === 0 ? empty : (
                <div className="flex flex-col gap-2">
                    {achievements.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-amber-100 bg-amber-50">
                            {a.icon ? (
                                <img src={a.icon} alt={a.title} className="w-10 h-10 object-contain flex-shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-xl flex-shrink-0">
                                    🏆
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm leading-tight">{a.title}</p>
                                {a.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.description}</p>
                                )}
                            </div>
                            <p className="text-xs text-amber-400 ml-auto flex-shrink-0">
                                {new Date(a.completed_at).toLocaleDateString('ru-RU')}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}