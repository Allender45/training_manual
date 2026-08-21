'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { hasFeature } from '@/lib/permissions';
import { Header, Sidebar } from '@/containers';
import Modal from '@/containers/modals/Modal/Modal';
import { Table, Button, Input, Select, Checkbox, Badge } from '@/components';
import { Column } from '@/components/Table/Table';
import { Plus, Play } from 'lucide-react';

type Trigger = {
    id: number;
    title: string;
    metric_key: string;
    operator: string;
    threshold: number;
    is_active: boolean;
    checklist_id: number | null;
    checklist_title: string | null;
    created_at: string;
};

type TriggerForm = {
    title: string;
    metric_key: string;
    operator: string;
    threshold: string;
    is_active: boolean;
    checklist_id: string;
};

const emptyForm: TriggerForm = { title: '', metric_key: '', operator: '>=', threshold: '', is_active: true, checklist_id: '' };

const OPERATOR_OPTIONS = [
    { value: '>=', label: '≥ (больше или равно)' },
    { value: '>',  label: '> (больше)' },
    { value: '<=', label: '≤ (меньше или равно)' },
    { value: '<',  label: '< (меньше)' },
    { value: '=',  label: '= (равно)' },
];

export default function ChecklistTriggersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser, user } = useUserStore();
    const rid = user?.role_id ?? null;

    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Trigger | null>(null);
    const [form, setForm] = useState<TriggerForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [checklists, setChecklists] = useState<{ id: number; title: string }[]>([]);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        loadTriggers();
        loadChecklists();
    }, []);

    async function loadChecklists() {
        try {
            const res = await fetch('/api/checklists');
            const data = await res.json();
            setChecklists(data.checklists ?? []);
        } catch {
            setChecklists([]);
        }
    }

    async function loadTriggers() {
        setLoading(true);
        try {
            const res = await fetch('/api/checklistTriggers');
            const data = await res.json();
            setTriggers(data.triggers ?? []);
        } catch {
            setTriggers([]);
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setSaveError(null);
        setModalOpen(true);
    }

    function openEdit(row: Trigger) {
        setEditing(row);
        setForm({
            title: row.title,
            metric_key: row.metric_key,
            operator: row.operator,
            threshold: String(row.threshold),
            is_active: row.is_active,
            checklist_id: row.checklist_id ? String(row.checklist_id) : '',
        });
        setSaveError(null);
        setModalOpen(true);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    }

    async function handleSave() {
        if (!form.title.trim() || !form.metric_key.trim() || form.threshold === '') {
            setSaveError('Заполните поля: название, метрика, порог');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const url = editing ? `/api/checklistTriggers/${editing.id}` : '/api/checklistTriggers';
            const res = await fetch(url, {
                method: editing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, threshold: Number(form.threshold) }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            setModalOpen(false);
            loadTriggers();
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(row: Trigger) {
        if (!confirm(`Удалить триггер «${row.title}»?`)) return;
        await fetch(`/api/checklistTriggers/${row.id}`, { method: 'DELETE' });
        loadTriggers();
    }

    async function handleRunEngine() {
        setRunning(true);
        try {
            const res = await fetch('/api/triggerEngine/run', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) { alert(data.error ?? 'Ошибка запуска'); return; }
            alert(`Проверка завершена.\nПодходящих стажёров: ${data.checked}\nНазначено бесед: ${data.created}` +
                (data.errors?.length ? `\nОшибок: ${data.errors.length}` : ''));
        } catch {
            alert('Ошибка соединения с сервером');
        } finally {
            setRunning(false);
        }
    }

    const columns: Column<Trigger>[] = [
        {
            key: 'title', header: 'Название',
            render: row => <span className="font-medium text-gray-800">{row.title}</span>,
        },
        {
            key: 'metric_key', header: 'Метрика',
            render: row => <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{row.metric_key}</code>,
        },
        {
            key: 'condition', header: 'Условие срабатывания',
            render: row => <span className="text-sm text-gray-700">{row.operator} {row.threshold}</span>,
        },
        {
            key: 'checklist_title', header: 'Чек-лист',
            render: row => row.checklist_title
                ? <span className="text-sm text-gray-700">{row.checklist_title}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            key: 'is_active', header: 'Статус',
            render: row => <Badge variant={row.is_active ? 'green' : 'gray'} text={row.is_active ? 'Активен' : 'Неактивен'} />,
        },
        {
            key: 'created_at', header: 'Создан',
            render: row => <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleDateString('ru-RU')}</span>,
        },
    ];

    const canManage = hasFeature(rid, 'checklistTriggersManage');

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Триггеры бесед по чек-листам</h3>
                            {canManage && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handleRunEngine} loading={running}>
                                        <Play size={14} className="mr-1" />
                                        Проверить триггеры
                                    </Button>
                                    <Button size="sm" onClick={openCreate}>
                                        <Plus size={14} className="mr-1" />
                                        Добавить
                                    </Button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-400">Загрузка...</div>
                        ) : (
                            <Table<Trigger>
                                columns={columns}
                                data={triggers}
                                keyField="id"
                                emptyText="Триггеры не созданы"
                                buttonEdit={canManage}
                                buttonDel={canManage}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                </main>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Редактировать триггер' : 'Новый триггер'}
                className="max-w-md"
            >
                <div className="flex flex-col gap-4">
                    <Input label="Название *" name="title" value={form.title} onChange={handleChange} />
                    <Input
                        label="Ключ метрики *"
                        name="metric_key"
                        value={form.metric_key}
                        onChange={handleChange}
                        placeholder="Например: shifts_count"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Оператор"
                            name="operator"
                            value={form.operator}
                            onChange={handleChange}
                            options={OPERATOR_OPTIONS}
                        />
                        <Input
                            label="Порог *"
                            name="threshold"
                            type="number"
                            value={form.threshold}
                            onChange={handleChange}
                            placeholder="50"
                        />
                    </div>
                    <Select
                        label="Чек-лист"
                        name="checklist_id"
                        value={form.checklist_id}
                        onChange={handleChange}
                        options={[
                            { value: '', label: '— не выбран —' },
                            ...checklists.map(c => ({ value: String(c.id), label: c.title })),
                        ]}
                    />
                    <Checkbox label="Активен" name="is_active" checked={form.is_active}
                              onChange={handleChange} variant="switch" />

                    {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Отменить</Button>
                        <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}