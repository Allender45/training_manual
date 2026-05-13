'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Clock, BookOpen, Video, Music, FileText, ChevronRight } from 'lucide-react';

type Course = {
    id: number;
    title: string;
    icon: string;
    description: string;
    comment: string | null;
    study_time_minutes: number | null;
    is_active: boolean;
};

type Manual = {
    id: number;
    title: string;
    icon: string;
    type: 'text' | 'video' | 'audio';
    description: string;
    content: string | null;
    prerequisite_id: number | null;
    is_active: boolean;
};

function formatStudyTime(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function pluralManuals(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'материал';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'материала';
    return 'материалов';
}

const TYPE_CONFIG = {
    text:  { label: 'Текст', icon: FileText, color: 'bg-blue-50 text-blue-700'   },
    video: { label: 'Видео', icon: Video,    color: 'bg-purple-50 text-purple-700' },
    audio: { label: 'Аудио', icon: Music,    color: 'bg-amber-50 text-amber-700'  },
} as const;

export default function CourseStudyPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const { fetchUser } = useUserStore();

    const [course, setCourse] = useState<Course | null>(null);
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        if (!courseId) { setError('ID курса не указан'); setLoading(false); return; }

        Promise.all([
            fetch(`/api/courses/${courseId}`).then(r => r.json()),
            fetch(`/api/manuals?course_id=${courseId}`).then(r => r.json()),
        ]).then(([courseData, manualsData]) => {
            if (courseData.error) { setError(courseData.error); return; }
            setCourse(courseData.course);
            setManuals((manualsData.manuals ?? []).filter((m: Manual) => m.is_active));
        }).catch(() => setError('Ошибка загрузки данных'))
            .finally(() => setLoading(false));
    }, [courseId]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 max-w-4xl">

                    {loading && (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                            Загрузка...
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {course && (
                        <>
                            {/* Шапка курса */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                                <div className="flex items-start gap-5">
                                    <img
                                        src={course.icon}
                                        alt={course.title}
                                        className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-gray-100"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                                            {!course.is_active && (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                    Неактивен
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm mb-3">{course.description}</p>
                                        <div className="flex items-center gap-5 text-sm text-gray-400">
                                            {course.study_time_minutes && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {formatStudyTime(course.study_time_minutes)}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen size={14} />
                                                {manuals.length} {pluralManuals(manuals.length)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {course.comment && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400 italic">
                                        {course.comment}
                                    </div>
                                )}
                            </div>

                            {/* Список материалов */}
                            <h2 className="text-base font-semibold text-gray-600 mb-3">Материалы курса</h2>

                            {manuals.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400 text-sm">
                                    К этому курсу ещё не добавлены материалы
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {manuals.map((manual, index) => {
                                        const cfg = TYPE_CONFIG[manual.type];
                                        const TypeIcon = cfg.icon;
                                        return (
                                            <div key={manual.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                {/* Шапка материала */}
                                                <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-semibold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <img
                                                        src={manual.icon}
                                                        alt={manual.title}
                                                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-gray-800">{manual.title}</span>
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                                <TypeIcon size={11} />
                                                                {cfg.label}
                            </span>
                                                        </div>
                                                        {manual.description && (
                                                            <p className="text-sm text-gray-400 mt-0.5">{manual.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Контент */}
                                                <div className="p-5">
                                                    {manual.type === 'text' && manual.content ? (
                                                        <div
                                                            className="text-sm text-gray-700 leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: manual.content }}
                                                        />
                                                    ) : manual.type === 'video' && manual.content ? (
                                                        <video
                                                            src={manual.content}
                                                            controls
                                                            className="w-full rounded-xl bg-black max-h-96"
                                                        />
                                                    ) : manual.type === 'audio' && manual.content ? (
                                                        <audio src={manual.content} controls className="w-full" />
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">Содержимое не добавлено</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}