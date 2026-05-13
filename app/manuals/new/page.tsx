'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Input, Button, Checkbox, Select, CKEditorField } from '@/components';

type ManualType = 'text' | 'video' | 'audio';

type NewManualForm = {
    title: string;
    type: ManualType;
    description: string;
    course_id: string;
    prerequisite_id: string;
    comment: string;
    is_active: boolean;
};

const emptyForm: NewManualForm = {
    title: '', type: 'text', description: '',
    course_id: '', prerequisite_id: '', comment: '', is_active: true,
};

export default function NewManualPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [form, setForm] = useState<NewManualForm>(emptyForm);
    const [content, setContent] = useState('');
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
    const [manualOptions, setManualOptions] = useState<{ value: string; label: string }[]>([]);
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [contentPreview, setContentPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/courses').then(r => r.json())
            .then(d => setCourseOptions(
                (d.courses ?? []).map((c: { id: number; title: string }) => ({ value: String(c.id), label: c.title }))
            )).catch(() => {});
        fetch('/api/manuals').then(r => r.json())
            .then(d => setManualOptions(
                (d.manuals ?? []).map((m: { id: number; title: string }) => ({ value: String(m.id), label: m.title }))
            )).catch(() => {});
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type } = e.target;
        if (name === 'type') {
            setContent('');
            setContentFile(null);
            setContentPreview(null);
        }
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    }

    function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
    }

    function handleContentFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setContentFile(file);
        setContentPreview(URL.createObjectURL(file));
    }

    async function handleSave() {
        if (!form.title.trim() || !form.description.trim()) {
            setSaveError('Заполните обязательные поля: название, описание');
            return;
        }
        if (!iconFile) {
            setSaveError('Выберите иконку материала');
            return;
        }
        if (form.type !== 'text' && !contentFile) {
            setSaveError('Выберите файл для видео или аудио материала');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            fd.append('icon',           iconFile);
            fd.append('title',          form.title.trim());
            fd.append('type',           form.type);
            fd.append('description',    form.description.trim());
            fd.append('content',        content.trim());
            fd.append('course_id',      form.course_id);
            fd.append('prerequisite_id', form.prerequisite_id);
            fd.append('comment',        form.comment.trim());
            fd.append('is_active',      String(form.is_active));
            fd.append('content',        content.trim());

            if (contentFile) fd.append('contentFile', contentFile);
            const res = await fetch('/api/manuals', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            router.push('/manuals');
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Новый материал</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input label="Название *" name="title" value={form.title} onChange={handleChange} />
                                </div>

                                <div>
                                    <div className="flex items-end gap-3">
                                        {iconPreview ? (
                                            <img src={iconPreview} alt="preview"
                                                 className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-dashed border-gray-300">
                                                <span className="text-gray-400 text-xs text-center leading-tight">нет<br/>фото</span>
                                            </div>
                                        )}
                                        <Input label="Иконка" type="fileUpload" accept="image/*" onChange={handleIconChange} />
                                    </div>
                                </div>

                                <Select
                                    label="Тип материала *"
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'text',  label: '📝 Текст' },
                                        { value: 'video', label: '🎥 Видео' },
                                        { value: 'audio', label: '🎵 Аудио' },
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Курс"
                                    name="course_id"
                                    value={form.course_id}
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'Не привязан' }, ...courseOptions]}
                                />
                                <Select
                                    label="Предварительный материал"
                                    name="prerequisite_id"
                                    value={form.prerequisite_id}
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'Не требуется' }, ...manualOptions]}
                                />
                            </div>

                            {form.type === 'text' ? (
                                <CKEditorField
                                    label="Содержание"
                                    value={content}
                                    onChange={setContent}
                                    placeholder="Введите текст материала..."
                                    minHeight={200}
                                />
                            ) : (
                                <div>
                                    <label className="block text-gray-500 text-sm mb-2">
                                        {form.type === 'video' ? 'Видео файл *' : 'Аудио файл *'}
                                    </label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            label=""
                                            type="fileUpload"
                                            accept={form.type === 'video' ? 'video/*' : 'audio/*'}
                                            onChange={handleContentFileChange}
                                        />
                                        {contentPreview && form.type === 'video' && (
                                            <video
                                                src={contentPreview}
                                                controls
                                                className="w-full rounded-lg max-h-52 bg-black"
                                            />
                                        )}
                                        {contentPreview && form.type === 'audio' && (
                                            <audio src={contentPreview} controls className="w-full" />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-500 text-sm mb-2">Описание *</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                                <textarea
                                    name="comment"
                                    value={form.comment}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <Checkbox label="Активен" name="is_active" checked={form.is_active}
                                      onChange={handleChange} variant="switch" />

                            {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => router.push('/manuals')}>Отменить</Button>
                                <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}