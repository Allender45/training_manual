'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, Modal, EntityTable } from '@/containers';
import { Button, Input } from '@/components';

type Achievement = { id: number; icon: string; title: string; description: string | null };

const emptyForm = { icon: '', title: '', description: '' };
type EditForm = { id: number; icon: string; title: string; description: string };
const emptyEditForm: EditForm = { id: 0, icon: '', title: '', description: '' };

export default function AchievementsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [iconUploading, setIconUploading] = useState(false);
    const [localPreviewAdd, setLocalPreviewAdd] = useState<string | null>(null);
    const [localPreviewEdit, setLocalPreviewEdit] = useState<string | null>(null);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchAchievements();
    }, []);

    async function fetchAchievements() {
        const res = await fetch('/api/achievements');
        if (res.ok) {
            const data = await res.json();
            setAchievements(data.achievements);
        }
    }

    async function handleAdd() {
        if (!form.title.trim()) { setFormError('Название обязательно'); return; }
        setAdding(true);
        setFormError(null);
        try {
            const res = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error ?? 'Ошибка'); return; }
            setAchievements(prev => [...prev, data.achievement]);
            setModalOpen(false);
            setForm(emptyForm);
        } catch {
            setFormError('Ошибка соединения с сервером');
        } finally {
            setAdding(false);
        }
    }

    function handleEdit(achievement: Achievement) {
        setEditForm({ id: achievement.id, icon: achievement.icon ?? '', title: achievement.title, description: achievement.description ?? '' });
        setEditModalOpen(true);
    }

    async function handleSaveEdit() {
        if (!editForm.title.trim()) { setEditError('Название обязательно'); return; }
        setSaving(true);
        setEditError(null);
        try {
            const res = await fetch(`/api/achievements/${editForm.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) { setEditError(data.error ?? 'Ошибка'); return; }
            setAchievements(prev => prev.map(a => a.id === editForm.id ? data.achievement : a));
            setEditModalOpen(false);
        } catch {
            setEditError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/achievements/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setAchievements(prev => prev.filter(a => a.id !== deleteId));
                setDeleteId(null);
            }
        } catch (error) {
            console.error('[handleConfirmDelete]', error);
        } finally {
            setDeleting(false);
        }
    }

    async function uploadIcon(file: File, target: 'add' | 'edit') {
        const localUrl = URL.createObjectURL(file);
        if (target === 'add') setLocalPreviewAdd(localUrl);
        else setLocalPreviewEdit(localUrl);

        setIconUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/achievements/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                if (target === 'add') setForm(p => ({ ...p, icon: data.url }));
                else setEditForm(p => ({ ...p, icon: data.url }));
            }
        } catch (error) {
            console.error('[uploadIcon]', error);
        } finally {
            setIconUploading(false);
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
                        entityType="achievements"
                        data={achievements}
                        buttonEdit
                        buttonDel
                        onEdit={row => handleEdit(row as Achievement)}
                        onDelete={row => setDeleteId((row as Achievement).id)}
                        onAdd={() => setModalOpen(true)}
                    />
                </main>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setForm(emptyForm); setFormError(null); setLocalPreviewAdd(null); }} title="Добавление достижения">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Иконка</label>
                        {(localPreviewAdd || form.icon) && (
                            <img src={localPreviewAdd ?? form.icon}
                                 alt="preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                        )}
                        <input type="file" accept="image/*"
                               disabled={iconUploading}
                               onChange={e => { const f = e.target.files?.[0]; if (f) uploadIcon(f, 'add'); }}
                               className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                        {iconUploading && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <Input label="Название" name="title" value={form.title}
                           onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormError(null); }} />
                    <Input label="Описание" name="description" value={form.description}
                           onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => { setModalOpen(false); setForm(emptyForm); setFormError(null); }}>Отменить</Button>
                        <Button onClick={handleAdd} loading={adding}>Добавить</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditError(null); setLocalPreviewEdit(null); }} title="Изменение достижения">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Иконка</label>
                        {(localPreviewEdit || editForm.icon) && (
                            <img src={localPreviewEdit ?? editForm.icon}
                                 alt="preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                        )}
                        <input type="file" accept="image/*"
                               disabled={iconUploading}
                               onChange={e => { const f = e.target.files?.[0]; if (f) uploadIcon(f, 'edit'); }}
                               className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                        {iconUploading && <span className="text-xs text-gray-400">Загрузка...</span>}
                    </div>
                    <Input label="Название" name="title" value={editForm.title}
                           onChange={e => { setEditForm(p => ({ ...p, title: e.target.value })); setEditError(null); }} />
                    <Input label="Описание" name="description" value={editForm.description}
                           onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                    {editError && <p className="text-red-500 text-sm">{editError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => { setEditModalOpen(false); setEditError(null); }}>Отменить</Button>
                        <Button onClick={handleSaveEdit} loading={saving}>Сохранить</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Подтверждение удаления">
                <p className="text-sm text-gray-600 mb-6">
                    Вы уверены, что хотите удалить достижение <span className="font-medium text-gray-800">
                        {achievements.find(a => a.id === deleteId)?.title}
                    </span>? Это действие нельзя отменить.
                </p>
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDeleteId(null)}>Отменить</Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete} loading={deleting}>Удалить</Button>
                </div>
            </Modal>
        </div>
    );
}