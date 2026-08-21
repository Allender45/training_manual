'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { hasFeature } from '@/lib/permissions';
import { Header, Sidebar, Modal } from '@/containers';
import { Table, Button, Input, Select, Checkbox, Badge, CKEditorField, VoiceTextAnswer } from '@/components';
import { Column } from '@/components/Table/Table';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

type Checklist = {
    id: number;
    title: string;
    description: string | null;
    is_active: boolean;
    items_count: number;
    created_at: string;
};

type ItemForm = {
    question: string;
    answer_type: string;
    is_required: boolean;
    speech_module: string;
};

const emptyItem: ItemForm = { question: '', answer_type: 'yesno', is_required: true, speech_module: '' };

const ANSWER_TYPE_OPTIONS = [
    { value: 'yesno',    label: 'Да / Нет' },
    { value: 'checkbox', label: 'Флажок (выполнено)' },
    { value: 'rating',   label: 'Оценка 1–5' },
    { value: 'text',     label: 'Текст' },
];

export default function ChecklistsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser, user } = useUserStore();
    const rid = user?.role_id ?? null;

    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Checklist | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [demoText, setDemoText] = useState('');
    const [demoAudio, setDemoAudio] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        loadChecklists();
    }, []);

    async function loadChecklists() {
        setLoading(true);
        try {
            const res = await fetch('/api/checklists');
            const data = await res.json();
            setChecklists(data.checklists ?? []);
        } catch {
            setChecklists([]);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setTitle('');
        setDescription('');
        setIsActive(true);
        setItems([{ ...emptyItem }]);
        setSaveError(null);
    }

    function openCreate() {
        setEditing(null);
        resetForm();
        setModalOpen(true);
    }

    async function openEdit(row: Checklist) {
        setSaveError(null);
        try {
            const res = await fetch(`/api/checklists/${row.id}`);
            const data = await res.json();
            if (!res.ok) { alert(data.error ?? 'Ошибка загрузки'); return; }
            setEditing(row);
            setTitle(data.checklist.title);
            setDescription(data.checklist.description ?? '');
            setIsActive(data.checklist.is_active);
            setItems(data.items.map((i: any) => ({
                question: i.question,
                answer_type: i.answer_type,
                is_required: i.is_required,
                speech_module: i.speech_module ?? '',
            })));
            setModalOpen(true);
        } catch {
            alert('Ошибка соединения с сервером');
        }
    }

    function updateItem(index: number, patch: Partial<ItemForm>) {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
    }

    function moveItem(index: number, delta: number) {
        setItems(prev => {
            const next = [...prev];
            const target = index + delta;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    async function handleSave() {
        if (!title.trim()) { setSaveError('Укажите название'); return; }
        if (items.some(i => !i.question.replace(/<[^>]*>/g, '').trim())) {
            setSaveError('У всех вопросов должен быть текст');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const url = editing ? `/api/checklists/${editing.id}` : '/api/checklists';
            const res = await fetch(url, {
                method: editing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, is_active: isActive, items }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            setModalOpen(false);
            loadChecklists();
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(row: Checklist) {
        if (!confirm(`Удалить чек-лист «${row.title}»?`)) return;
        await fetch(`/api/checklists/${row.id}`, { method: 'DELETE' });
        loadChecklists();
    }

    const columns: Column<Checklist>[] = [
        {
            key: 'title', header: 'Название',
            render: row => <span className="font-medium text-gray-800">{row.title}</span>,
        },
        {
            key: 'description', header: 'Описание',
            render: row => row.description
                ? <span className="text-sm text-gray-600 line-clamp-2">{row.description}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            key: 'items_count', header: 'Вопросов',
            render: row => <span className="text-sm text-gray-700">{row.items_count}</span>,
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

    const canManage = hasFeature(rid, 'checklistsManage');

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Чек-листы для бесед</h3>
                            {canManage && (
                                <Button size="sm" onClick={openCreate}>
                                    <Plus size={14} className="mr-1" />
                                    Добавить
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-10 text-center text-gray-400">Загрузка...</div>
                        ) : (
                            <Table<Checklist>
                                columns={columns}
                                data={checklists}
                                keyField="id"
                                emptyText="Чек-листы не созданы"
                                buttonEdit={canManage}
                                buttonDel={canManage}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>

                    <div className="mt-6 max-w-xl">
                        <VoiceTextAnswer value={demoText} audioUrl={demoAudio}
                                         onChange={setDemoText} onAudioChange={setDemoAudio} />
                    </div>
                </main>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Редактировать чек-лист' : 'Новый чек-лист'}
                className=""
            >
                <div className="flex flex-col gap-4">
                    <Input label="Название *" name="title" value={title} onChange={e => setTitle(e.target.value)} />
                    <Input label="Описание" name="description" value={description}
                           onChange={e => setDescription(e.target.value)} />
                    <Checkbox label="Активен" name="is_active" checked={isActive}
                              onChange={e => setIsActive(e.target.checked)} variant="switch" />

                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Вопросы</p>
                        <div className="flex flex-col gap-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                                    <span className="text-xs text-gray-400 pt-2.5 w-5 flex-shrink-0">{index + 1}.</span>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <CKEditorField
                                            label="Вопрос *"
                                            value={item.question}
                                            onChange={value => updateItem(index, { question: value })}
                                            placeholder="Текст вопроса"
                                            minHeight={100}
                                        />
                                        <CKEditorField
                                            label="Речевой модуль"
                                            value={item.speech_module}
                                            onChange={value => updateItem(index, { speech_module: value })}
                                            placeholder="Как разговаривать, примеры формулировок..."
                                            minHeight={100}
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="w-48">
                                                <Select
                                                    label="" name={`type_${index}`}
                                                    value={item.answer_type}
                                                    onChange={e => updateItem(index, { answer_type: e.target.value })}
                                                    options={ANSWER_TYPE_OPTIONS}
                                                    size="sm"
                                                />
                                            </div>
                                            <Checkbox
                                                label="Обязательный" name={`required_${index}`}
                                                checked={item.is_required}
                                                onChange={e => updateItem(index, { is_required: e.target.checked })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                                                className="p-1 rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                                            <ArrowUp size={14} />
                                        </button>
                                        <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                                                className="p-1 rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                                            <ArrowDown size={14} />
                                        </button>
                                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                                                disabled={items.length === 1}
                                                className="p-1 rounded text-red-400 hover:bg-red-50 disabled:opacity-30">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button size="sm" variant="outline" className="mt-3"
                                onClick={() => setItems(prev => [...prev, { ...emptyItem }])}>
                            <Plus size={14} className="mr-1" />
                            Добавить вопрос
                        </Button>
                    </div>

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