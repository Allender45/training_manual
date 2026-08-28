'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, Modal, EntityTable, EventRow } from '@/containers';
import { Button, Input, Select, Checkbox } from '@/components';

type Department = { id: number; name: string };
type Slot = { id?: number; label: string; capacity: string };
type SlotWithTaken = { id: number; label: string; capacity: number; taken: number };
type Participant = {
    id: number;
    user_id: number;
    slot_id: number | null;
    first_name: string;
    last_name: string;
    registered_at: string;
};
type EventDetail = { event: EventRow; slots: SlotWithTaken[]; participants: Participant[] };

const emptyForm = {
    title: '',
    description: '',
    category: '',
    startsAt: '',
    visibility: 'all' as 'all' | 'department',
    departmentId: '',
    hideParticipants: false,
};

type EditForm = typeof emptyForm & { status: string };

function toLocalInputValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [events, setEvents] = useState<EventRow[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [detail, setDetail] = useState<EventDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>({ ...emptyForm, status: 'open' });
    const [editSlots, setEditSlots] = useState<Slot[]>([]);
    const [savingDetail, setSavingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [movingParticipantId, setMovingParticipantId] = useState<number | null>(null);

    const router = useRouter();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchEvents();
        fetchDepartments();
    }, []);

    async function fetchEvents() {
        const res = await fetch('/api/events');
        if (res.ok) {
            const data = await res.json();
            setEvents(data.events);
        }
    }

    async function fetchDepartments() {
        const res = await fetch('/api/departments');
        if (res.ok) {
            const data = await res.json();
            setDepartments(data.departments);
        }
    }

    function resetForm() {
        setForm(emptyForm);
        setSlots([]);
        setFormError(null);
    }

    function addSlot() {
        setSlots(prev => [...prev, { label: `Дорожка ${prev.length + 1}`, capacity: '1' }]);
    }

    function updateSlot(index: number, patch: Partial<Slot>) {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
    }

    function removeSlot(index: number) {
        setSlots(prev => prev.filter((_, i) => i !== index));
    }

    async function handleAdd() {
        if (!form.title.trim()) { setFormError('Название обязательно'); return; }
        if (!form.startsAt) { setFormError('Дата начала обязательна'); return; }
        if (form.visibility === 'department' && !form.departmentId) { setFormError('Выберите подразделение'); return; }

        setAdding(true);
        setFormError(null);
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    startsAt: new Date(form.startsAt).toISOString(),
                    visibility: form.visibility,
                    departmentId: form.departmentId ? Number(form.departmentId) : null,
                    hideParticipants: form.hideParticipants,
                    slots: slots.map(s => ({ label: s.label, capacity: Number(s.capacity) || 1 })),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error ?? 'Ошибка'); return; }
            setEvents(prev => [data.event, ...prev]);
            setModalOpen(false);
            resetForm();
        } catch {
            setFormError('Ошибка соединения с сервером');
        } finally {
            setAdding(false);
        }
    }

    async function openDetail(row: EventRow) {
        setDetailError(null);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/events/${row.id}`);
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }
            applyDetail(data);
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setDetailLoading(false);
        }
    }

    function applyDetail(data: EventDetail) {
        setDetail(data);
        setEditForm({
            title: data.event.title,
            description: data.event.description ?? '',
            category: data.event.category ?? '',
            startsAt: toLocalInputValue(data.event.starts_at),
            visibility: data.event.visibility === 'department' ? 'department' : 'all',
            departmentId: data.event.department_id ? String(data.event.department_id) : '',
            hideParticipants: data.event.hide_participants,
            status: data.event.status,
        });
        setEditSlots(data.slots.map(s => ({ id: s.id, label: s.label, capacity: String(s.capacity) })));
    }

    function closeDetail() {
        setDetail(null);
        setDetailError(null);
    }

    function addEditSlot() {
        setEditSlots(prev => [...prev, { label: `Дорожка ${prev.length + 1}`, capacity: '1' }]);
    }

    function updateEditSlot(index: number, patch: Partial<Slot>) {
        setEditSlots(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
    }

    async function handleSaveDetail() {
        if (!detail) return;
        if (!editForm.title.trim()) { setDetailError('Название обязательно'); return; }
        if (!editForm.startsAt) { setDetailError('Дата начала обязательна'); return; }
        if (editForm.visibility === 'department' && !editForm.departmentId) { setDetailError('Выберите подразделение'); return; }

        setSavingDetail(true);
        setDetailError(null);
        try {
            const res = await fetch(`/api/events/${detail.event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editForm.title,
                    description: editForm.description,
                    category: editForm.category,
                    startsAt: new Date(editForm.startsAt).toISOString(),
                    visibility: editForm.visibility,
                    departmentId: editForm.departmentId ? Number(editForm.departmentId) : null,
                    hideParticipants: editForm.hideParticipants,
                    status: editForm.status,
                    slots: editSlots.map(s => ({ id: s.id, label: s.label, capacity: Number(s.capacity) || 1 })),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }
            setEvents(prev => prev.map(e => e.id === data.event.id ? data.event : e));
            setDetail(prev => prev ? { ...prev, event: data.event, slots: data.slots } : prev);
            setEditSlots(data.slots.map((s: SlotWithTaken) => ({ id: s.id, label: s.label, capacity: String(s.capacity) })));
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setSavingDetail(false);
        }
    }

    async function handleDelete(row: EventRow) {
        if (!confirm(`Удалить мероприятие «${row.title}»?`)) return;
        const res = await fetch(`/api/events/${row.id}`, { method: 'DELETE' });
        if (res.ok) setEvents(prev => prev.filter(e => e.id !== row.id));
    }

    async function handleMoveParticipant(participantId: number, slotValue: string) {
        if (!detail) return;
        setMovingParticipantId(participantId);
        setDetailError(null);
        try {
            const res = await fetch(`/api/events/${detail.event.id}/participants/${participantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId: slotValue ? Number(slotValue) : null }),
            });
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }

            const refreshed = await fetch(`/api/events/${detail.event.id}`);
            const refreshedData = await refreshed.json();
            if (refreshed.ok) applyDetail(refreshedData);
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setMovingParticipantId(null);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <EntityTable
                        entityType="events"
                        data={events}
                        onAdd={() => setModalOpen(true)}
                        onRowClick={row => openDetail(row as EventRow)}
                        onDelete={row => handleDelete(row as EventRow)}
                        buttonDel
                    />
                </main>
            </div>

            {/* Модалка создания */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Добавление мероприятия" className="max-w-xl">
                <div className="flex flex-col gap-4">
                    <Input label="Название" name="title" value={form.title}
                           onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormError(null); }} />
                    <Input label="Описание" name="description" type="textarea" rows={3} value={form.description}
                           onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    <Input label="Категория" name="category" value={form.category}
                           onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                    <Input label="Дата и время начала" name="startsAt" type="datetime" value={form.startsAt}
                           onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))} />

                    <Select
                        label="Кому видно" name="visibility" value={form.visibility}
                        onChange={e => setForm(p => ({ ...p, visibility: e.target.value as 'all' | 'department', departmentId: '' }))}
                        options={[
                            { value: 'all', label: 'Всем' },
                            { value: 'department', label: 'Определённому подразделению' },
                        ]}
                    />

                    {form.visibility === 'department' && (
                        <Select
                            label="Подразделение" name="departmentId" value={form.departmentId}
                            onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}
                            placeholder="Выберите подразделение"
                            options={departments.map(d => ({ value: String(d.id), label: d.name }))}
                        />
                    )}

                    <Checkbox
                        label="Скрыть список записавшихся от участников" name="hideParticipants"
                        checked={form.hideParticipants}
                        onChange={e => setForm(p => ({ ...p, hideParticipants: e.target.checked }))}
                        variant="switch"
                    />

                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Дорожки/слоты (необязательно)</p>
                            <Button variant="outline" size="sm" onClick={addSlot}>+ Добавить</Button>
                        </div>
                        {slots.length === 0 && <p className="text-xs text-gray-400">Без ограничения мест</p>}
                        {slots.map((slot, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <Input
                                    value={slot.label}
                                    onChange={e => updateSlot(i, { label: e.target.value })}
                                    placeholder="Название дорожки"
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Input
                                    type="number"
                                    value={slot.capacity}
                                    onChange={e => updateSlot(i, { capacity: e.target.value })}
                                    placeholder="Мест"
                                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
                            </div>
                        ))}
                    </div>

                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Отменить</Button>
                        <Button onClick={handleAdd} loading={adding}>Добавить</Button>
                    </div>
                </div>
            </Modal>

            {/* Модалка деталей/редактирования */}
            <Modal isOpen={!!detail || detailLoading} onClose={closeDetail} title="Мероприятие" className="max-w-2xl">
                {detailLoading && !detail && <p className="text-sm text-gray-500">Загрузка...</p>}
                {detail && (
                    <div className="flex flex-col gap-4">
                        <Input label="Название" name="title" value={editForm.title}
                               onChange={e => { setEditForm(p => ({ ...p, title: e.target.value })); setDetailError(null); }} />
                        <Input label="Описание" name="description" type="textarea" rows={3} value={editForm.description}
                               onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                        <Input label="Категория" name="category" value={editForm.category}
                               onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                        <Input label="Дата и время начала" name="startsAt" type="datetime" value={editForm.startsAt}
                               onChange={e => setEditForm(p => ({ ...p, startsAt: e.target.value }))} />

                        <Select
                            label="Кому видно" name="visibility" value={editForm.visibility}
                            onChange={e => setEditForm(p => ({ ...p, visibility: e.target.value as 'all' | 'department', departmentId: '' }))}
                            options={[
                                { value: 'all', label: 'Всем' },
                                { value: 'department', label: 'Определённому подразделению' },
                            ]}
                        />

                        {editForm.visibility === 'department' && (
                            <Select
                                label="Подразделение" name="departmentId" value={editForm.departmentId}
                                onChange={e => setEditForm(p => ({ ...p, departmentId: e.target.value }))}
                                placeholder="Выберите подразделение"
                                options={departments.map(d => ({ value: String(d.id), label: d.name }))}
                            />
                        )}

                        <Select
                            label="Статус" name="status" value={editForm.status}
                            onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                            options={[
                                { value: 'open', label: 'Открыто' },
                                { value: 'closed', label: 'Закрыто' },
                            ]}
                        />

                        <Checkbox
                            label="Скрыть список записавшихся от участников" name="hideParticipants"
                            checked={editForm.hideParticipants}
                            onChange={e => setEditForm(p => ({ ...p, hideParticipants: e.target.checked }))}
                            variant="switch"
                        />

                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700">Дорожки/слоты</p>
                                <Button variant="outline" size="sm" onClick={addEditSlot}>+ Добавить</Button>
                            </div>
                            {editSlots.length === 0 && <p className="text-xs text-gray-400">Без ограничения мест</p>}
                            {editSlots.map((slot, i) => (
                                <div key={slot.id ?? `new-${i}`} className="flex items-center gap-2 mb-2">
                                    <Input
                                        value={slot.label}
                                        onChange={e => updateEditSlot(i, { label: e.target.value })}
                                        placeholder="Название дорожки"
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Input
                                        type="number"
                                        value={slot.capacity}
                                        onChange={e => updateEditSlot(i, { capacity: e.target.value })}
                                        placeholder="Мест"
                                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        {detailError && <p className="text-red-500 text-sm">{detailError}</p>}
                        <div className="flex gap-3 justify-end pt-2 border-b border-gray-100 pb-4">
                            <Button variant="outline" onClick={closeDetail}>Закрыть</Button>
                            <Button onClick={handleSaveDetail} loading={savingDetail}>Сохранить</Button>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Записавшиеся ({detail.participants.length})
                            </p>
                            {detail.participants.length === 0 ? (
                                <p className="text-sm text-gray-400">Никто не записался</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {detail.participants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                            <span className="text-sm text-gray-700">{p.last_name} {p.first_name}</span>
                                            {detail.slots.length > 0 ? (
                                                <select
                                                    value={p.slot_id ?? ''}
                                                    disabled={movingParticipantId === p.id}
                                                    onChange={e => handleMoveParticipant(p.id, e.target.value)}
                                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="">Без дорожки</option>
                                                    {detail.slots.map(s => (
                                                        <option
                                                            key={s.id}
                                                            value={s.id}
                                                            disabled={s.id !== p.slot_id && s.taken >= s.capacity}
                                                        >
                                                            {s.label} ({s.taken}/{s.capacity})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-400">Без дорожек</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}