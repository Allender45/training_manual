'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function CourseProgressWidget() {
    const [total,     setTotal]     = useState<number | null>(null);
    const [completed, setCompleted] = useState<number | null>(null);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        fetch('/api/progress/summary')
            .then(r => r.json())
            .then(d => { setTotal(d.total); setCompleted(d.completed); })
            .finally(() => setLoading(false));
    }, []);

    const pct = total && completed != null ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-sm text-gray-500">Курсы</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {loading ? '—' : completed}
                        <span className="text-base font-normal text-gray-400"> / {loading ? '—' : total}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">материалов пройдено</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20}/>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{width: `${pct}%`}}
                />
            </div>
        </div>
    );
}