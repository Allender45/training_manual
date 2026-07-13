'use client';
import { useState, useEffect, useRef } from 'react';
import { useNotificationsStore } from '@/store';
import { X } from 'lucide-react';

export default function AchievementToast() {
    const achievementToast = useNotificationsStore(s => s.achievementToast);
    const dismissAchievement = useNotificationsStore(s => s.dismissAchievement);
    const [leaving, setLeaving] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!achievementToast) return;
        setLeaving(false);
        timerRef.current = setTimeout(startLeave, 5000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [achievementToast?.id]);

    function startLeave() {
        if (timerRef.current) clearTimeout(timerRef.current);
        setLeaving(true);
        setTimeout(() => { dismissAchievement(); setLeaving(false); }, 400);
    }

    if (!achievementToast && !leaving) return null;

    return (
        <div
            style={{ animation: `${leaving ? 'slideOutUp' : 'slideInDown'} 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards` }}
            className="fixed top-6 left-1/2 z-50 bg-white rounded-2xl shadow-xl border border-amber-100 p-5 flex items-center gap-4 w-96"
        >
            <img src={achievementToast!.icon} alt={achievementToast!.title} className="w-16 h-16 object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Достижение получено</p>
                <p className="font-bold text-gray-800 mt-0.5">{achievementToast!.title}</p>
                {achievementToast!.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{achievementToast!.description}</p>
                )}
            </div>
            <button onClick={startLeave} className="text-gray-400 hover:text-gray-600 flex-shrink-0 self-start">
                <X size={16} />
            </button>
        </div>
    );
}