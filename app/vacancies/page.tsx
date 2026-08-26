'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar, Modal, EntityTable, VacancyRow } from '@/containers';
import { Button, Input, Select } from '@/components';
import { ImageOff } from 'lucide-react';

const emptyForm = {
    title: '',
    description: '',
    imageUrl: '',
};

type EditForm = typeof emptyForm & { status: string };

function VacancyImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/vacancies/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Ошибка загрузки'); return; }
            onChange(data.imageUrl);
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Изображение</p>
            <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {value ? (
                        <img src={`/api/vacancies/image?url=${encodeURIComponent(value)}`} alt="Превью" className="w-full h-full object-cover" />
                    ) : (
                        <ImageOff size={22} className="text-gray-300" />
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                        {value ? 'Изменить картинку' : 'Загрузить картинку'}
                    </Button>
                    {value && (
                        <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-500 text-left">
                            Удалить
                        </button>
                    )}
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default function VacanciesPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [vacancies, setVacancies] = useState<VacancyRow[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [detail, setDetail] = useState<VacancyRow | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ ...emptyForm, status: 'open' });
    const [savingDetail, setSavingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const router = useRouter();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchVacancies();
    }, []);

    async function fetchVacancies() {
        const res = await fetch('/api/vacancies');
        if (res.ok) {
            const data = await res.json();
            setVacancies(data.vacancies);
        }
    }

    function resetForm() {
        setForm(emptyForm);
        setFormError(null);
    }

    async function handleAdd() {
        if (!form.title.trim()) { setFormError('Название обязательно'); return; }
        if (!form.description.trim()) { setFormError('Описание обязательно'); return; }

        setAdding(true);
        setFormError(null);
        try {
            const res = await fetch('/api/vacancies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error ?? 'Ошибка'); return; }
            setVacancies(prev => [data.vacancy, ...prev]);
            setModalOpen(false);
            resetForm();
        } catch {
            setFormError('Ошибка соединения с сервером');
        } finally {
            setAdding(false);
        }
    }

    function openDetail(row: VacancyRow) {
        setDetail(row);
        setDetailError(null);
        setEditForm({
            title: row.title,
            description: row.description,
            imageUrl: row.image_url ?? '',
            status: row.status,
        });
    }

    function closeDetail() {
        setDetail(null);
        setDetailError(null);
    }

    async function handleSaveDetail() {
        if (!detail) return;
        if (!editForm.title.trim()) { setDetailError('Название обязательно'); return; }
        if (!editForm.description.trim()) { setDetailError('Описание обязательно'); return; }

        setSavingDetail(true);
        setDetailError(null);
        try {
            const res = await fetch(`/api/vacancies/${detail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) { setDetailError(data.error ?? 'Ошибка'); return; }
            setVacancies(prev => prev.map(v => v.id === data.vacancy.id ? data.vacancy : v));
            setDetail(data.vacancy);
        } catch {
            setDetailError('Ошибка соединения с сервером');
        } finally {
            setSavingDetail(false);
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
                        entityType="vacancies"
                        data={vacancies}
                        onAdd={() => setModalOpen(true)}
                        onRowClick={row => openDetail(row as VacancyRow)}
                    />
                </main>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Добавление вакансии" className="max-w-xl">
                <div className="flex flex-col gap-4">
                    <Input label="Название" name="title" value={form.title}
                           onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormError(null); }} />
                    <Input label="Описание" name="description" type="textarea" rows={4} value={form.description}
                           onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    <VacancyImageField value={form.imageUrl} onChange={url => setForm(p => ({ ...p, imageUrl: url }))} />

                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Отменить</Button>
                        <Button onClick={handleAdd} loading={adding}>Добавить</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!detail} onClose={closeDetail} title="Вакансия" className="max-w-xl">
                {detail && (
                    <div className="flex flex-col gap-4">
                        <Input label="Название" name="title" value={editForm.title}
                               onChange={e => { setEditForm(p => ({ ...p, title: e.target.value })); setDetailError(null); }} />
                        <Input label="Описание" name="description" type="textarea" rows={4} value={editForm.description}
                               onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                        <VacancyImageField value={editForm.imageUrl} onChange={url => setEditForm(p => ({ ...p, imageUrl: url }))} />
                        <Select
                            label="Статус" name="status" value={editForm.status}
                            onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                            options={[
                                { value: 'open', label: 'Открыта' },
                                { value: 'closed', label: 'Закрыта' },
                            ]}
                        />

                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-600">Отклики: {detail.leads_count}</span>
                            <Button
                                variant="outline" size="sm"
                                onClick={() => router.push(`/vacancies/leads?vacancyId=${detail.id}`)}
                            >
                                Показать отклики
                            </Button>
                        </div>

                        {detailError && <p className="text-red-500 text-sm">{detailError}</p>}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={closeDetail}>Закрыть</Button>
                            <Button onClick={handleSaveDetail} loading={savingDetail}>Сохранить</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}