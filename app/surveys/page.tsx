'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { hasFeature } from '@/lib/permissions';
import { Header, Sidebar } from '@/containers';
import { Table, Badge } from '@/components';
import { Column } from '@/components/Table/Table';
import { ClipboardList } from 'lucide-react';

type Survey = {
    id: number;
    status: string;
    scheduled_at: string;
    conducted_at: string | null;
    checklist_title: string;
    trigger_title: string | null;
    intern_name: string;
    mentor_name: string | null;
};

const STATUS_BADGE: Record<string, { variant: 'yellow' | 'blue' | 'green' | 'gray'; text: string }> = {
    assigned:    { variant: 'yellow', text: 'Назначена' },
    in_progress: { variant: 'blue',   text: 'В работе' },
    done:        { variant: 'green',  text: 'Проведена' },
    cancelled:   { variant: 'gray',   text: 'Отменена' },
};

const STATUS_FILTERS = [
    { value: '',            label: 'Все' },
    { value: 'assigned',    label: 'Назначенные' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done',        label: 'Проведённые' },
];

export default function SurveysPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser, user } = useUserStore();
    const rid = user?.role_id ?? null;

    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    useEffect(() => {
        if (!user) return;
        loadSurveys();
    }, [user, statusFilter]);

    async function loadSurveys() {
        setLoading(true);
        try {
            const query = statusFilter ? `?status=${statusFilter}` : '';
            const res = await fetch(`/api/surveys${query}`);
            const data = await res.json();
            setSurveys(data.surveys ?? []);
        } catch {
            setSurveys([]);
        } finally {
            setLoading(false);
        }
    }

    const columns: Column<Survey>[] = [
        {
            key: 'intern_name', header: 'Стажёр',
            render: row => <span className="font-medium text-gray-800">{row.intern_name}</span>,
        },
        {
            key: 'checklist_title', header: 'Чек-лист',
            render: row => <span className="text-sm text-gray-700">{row.checklist_title}</span>,
        },
        {
            key: 'trigger_title', header: 'Триггер',
            render: row => row.trigger_title
                ? <span className="text-sm text-gray-600">{row.trigger_title}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            key: 'status', header: 'Статус',
            render: row => {
                const badge = STATUS_BADGE[row.status] ?? STATUS_BADGE.assigned;
                return <Badge variant={badge.variant} text={badge.text} />;
            },
        },
        {
            key: 'scheduled_at', header: 'Назначена',
            render: row => <span className="text-sm text-gray-500">{new Date(row.scheduled_at).toLocaleDateString('ru-RU')}</span>,
        },
        {
            key: 'conducted_at', header: 'Проведена',
            render: row => row.conducted_at
                ? <span className="text-sm text-gray-500">{new Date(row.conducted_at).toLocaleDateString('ru-RU')}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            key: 'actions', header: '',
            render: row => row.status !== 'done' && row.status !== 'cancelled' ? (
                <button
                    onClick={() => router.push(`/surveys/${row.id}`)}
                    className="flex items-center gap-1.5 text-sm text-[#41A141] hover:text-[#358535] font-medium"
                >
                    <ClipboardList size={14} />
                    {row.status === 'in_progress' ? 'Продолжить' : 'Провести'}
                </button>
            ) : (
                <button
                    onClick={() => router.push(`/surveys/${row.id}`)}
                    className="text-sm text-gray-400 hover:text-gray-600"
                >
                    Просмотр
                </button>
            ),
        },
    ];

    const viewAll = hasFeature(rid, 'checklistsManage');

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {viewAll ? 'Беседы со стажёрами' : 'Мои беседы'}
                            </h3>
                            <div className="flex gap-2">
                                {STATUS_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setStatusFilter(f.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                            statusFilter === f.value
                                                ? 'bg-[#41A141] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-400">Загрузка...</div>
                        ) : (
                            <Table<Survey>
                                columns={columns}
                                data={surveys}
                                keyField="id"
                                emptyText="Бесед нет"
                                onRowClick={row => router.push(`/surveys/${row.id}`)}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}