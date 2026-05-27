'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar, EntityTable, Modal } from '@/containers';
import { AdaptationPlanRow } from '@/containers/EntityTable/EntityTable';
import { Button, Input, Checkbox } from '@/components';

type PlanForm = {
    name: string;
    calls: string;
    conversion: string;
    revenue_new: string;
    revenue_total: string;
    comment: string;
    is_active: boolean;
};

const emptyForm: PlanForm = {
    name: '',
    calls: '',
    conversion: '',
    revenue_new: '',
    revenue_total: '',
    comment: '',
    is_active: true,
};

export default function AdaptationPlansPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();
    const [plans, setPlans] = useState<AdaptationPlanRow[]>([]);
    const activeUser = useUserStore(s => s.user);
    const [onlyMine, setOnlyMine] = useState(false);

    const visiblePlans = onlyMine
        ? plans.filter(p => p.author_id === activeUser?.id)
        : plans;

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AdaptationPlanRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdaptationPlanRow | null>(null);
    const [form, setForm] = useState<PlanForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    function loadPlans() {
        fetch('/api/adaptation-plans')
            .then(r => r.json())
            .then(data => setPlans(data.plans ?? []));
    }

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        loadPlans();
    }, []);

    function openCreate() {
        setForm(emptyForm);
        setSaveError(null);
        setCreateOpen(true);
    }

    function openEdit(row: AdaptationPlanRow) {
        setForm({
            name: row.name,
            calls: row.calls != null ? String(row.calls) : '',
            conversion: row.conversion ?? '',
            revenue_new: row.revenue_new ?? '',
            revenue_total: row.revenue_total ?? '',
            comment: row.comment ?? '',
            is_active: row.is_active,
        });
        setSaveError(null);
        setEditTarget(row);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function bodyFromForm() {
        return {
            ...form,
            calls: form.calls ? Number(form.calls) : null,
            conversion: form.conversion || null,
            revenue_new: form.revenue_new || null,
            revenue_total: form.revenue_total || null,
            comment: form.comment || null,
        };
    }

    async function handleCreate() {
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch('/api/adaptation-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyFromForm()),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка сохранения'); return; }
            setCreateOpen(false);
            loadPlans();
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleEdit() {
        if (!editTarget) return;
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`/api/adaptation-plans/${editTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyFromForm()),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка сохранения'); return; }
            setEditTarget(null);
            loadPlans();
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/adaptation-plans/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setDeleteError(data.error ?? 'Ошибка удаления'); return; }
            setDeleteTarget(null);
            loadPlans();
        } catch {
            setDeleteError('Ошибка соединения с сервером');
        } finally {
            setDeleting(false);
        }
    }

    const planForm = (onSubmit: () => void) => (
        <div className="flex flex-col gap-4">
            <Input label="Название" name="name" value={form.name} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Звонки" name="calls" type="number" value={form.calls} onChange={handleChange} />
                <Input label="Конверсия, %" name="conversion" type="number" value={form.conversion} onChange={handleChange} />
                <Input label="Касса от новых клиентов" name="revenue_new" type="number" value={form.revenue_new} onChange={handleChange} />
                <Input label="Касса общая" name="revenue_total" type="number" value={form.revenue_total} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
                <label className="block text-gray-500 text-sm font-medium mb-2">Комментарий</label>
                <textarea
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>
            <Checkbox
                label="Активен"
                name="is_active"
                checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                variant="switch"
            />
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null); }} disabled={saving}>
                    Отмена
                </Button>
                <Button onClick={onSubmit} loading={saving} disabled={!form.name.trim()}>
                    Сохранить
                </Button>
            </div>
        </div>
    );

    console.log(plans)

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <EntityTable
                        entityType="adaptation_plans"
                        data={plans}
                        onAdd={openCreate}
                        buttonEdit
                        buttonDel
                        onEdit={row => openEdit(row as AdaptationPlanRow)}
                        onDelete={row => { setDeleteTarget(row as AdaptationPlanRow); setDeleteError(null); }}
                        additionalFilters={
                            <div className="self-end mb-1">
                                <Checkbox
                                    label="Только мои"
                                    name="onlyMine"
                                    checked={onlyMine}
                                    onChange={e => setOnlyMine(e.target.checked)}
                                    variant="switch"
                                />
                            </div>
                        }
                    />
                </main>
            </div>

            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Новый план адаптации">
                {planForm(handleCreate)}
            </Modal>

            <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Редактирование плана">
                {planForm(handleEdit)}
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Удаление плана">
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        ⚠️ Удалять следует только <strong>ошибочно созданный</strong> план адаптации.
                        Для остальных случаев используйте функцию <strong>деактивации</strong>.
                    </div>
                    <p className="text-sm text-gray-600">
                        Вы уверены, что хотите удалить план <strong>{deleteTarget?.name}</strong>?
                        Это действие нельзя отменить.
                    </p>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                            Отмена
                        </Button>
                        <Button onClick={handleDelete} loading={deleting}>
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}