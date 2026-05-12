'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Input, Button, Select, Checkbox } from '@/components';

type EditCourseForm = {
    title: string;
    description: string;
    comment: string;
    prerequisite_manual_id: string;
    study_time_minutes: string;
    achievement_id: string;
    is_active: boolean;
};

export default function EditCoursePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const { fetchUser } = useUserStore();

    const [form, setForm] = useState<EditCourseForm>({
        title: '', description: '', comment: '',
        prerequisite_manual_id: '', study_time_minutes: '', achievement_id: '',
        is_active: true,
    });
    const [currentIcon, setCurrentIcon] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [manualOptions, setManualOptions] = useState<{ value: string; label: string }[]>([]);
    const [achievementOptions, setAchievementOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/manuals').then(r => r.json())
            .then(d => setManualOptions((d.manuals ?? []).map((m: { id: number; title: string }) => ({ value: String(m.id), label: m.title }))))
            .catch(() => {});
        fetch('/api/achievements').then(r => r.json())
            .then(d => setAchievementOptions((d.achievements ?? []).map((a: { id: number; title: string }) => ({ value: String(a.id), label: a.title }))))
            .catch(() => {});

        if (!courseId) { router.push('/courses'); return; }
        fetch(`/api/courses/${courseId}`)
            .then(r => r.json())
            .then(d => {
                const c = d.course;
                setForm({
                    title:                  c.title ?? '',
                    description:            c.description ?? '',
                    comment:                c.comment ?? '',
                    prerequisite_manual_id: c.prerequisite_manual_id ? String(c.prerequisite_manual_id) : '',
                    study_time_minutes:     c.study_time_minutes ? String(c.study_time_minutes) : '',
                    achievement_id:         c.achievement_id ? String(c.achievement_id) : '',
                    is_active:              c.is_active ?? true,
                });
                setCurrentIcon(c.icon ?? null);
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type } = e.target;
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

    async function handleSave() {
        if (!form.title.trim() || !form.description.trim()) {
            setSaveError('Заполните обязательные поля: название, описание');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            fd.append('title', form.title.trim());
            fd.append('description', form.description.trim());
            fd.append('comment', form.comment.trim());
            fd.append('prerequisite_manual_id', form.prerequisite_manual_id);
            fd.append('study_time_minutes', form.study_time_minutes);
            fd.append('achievement_id', form.achievement_id);
            fd.append('is_active', String(form.is_active));
            if (iconFile) fd.append('icon', iconFile);

            const res = await fetch(`/api/courses/${courseId}`, { method: 'PATCH', body: fd });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            router.push('/courses');
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    const previewSrc = iconPreview ?? currentIcon;

    if (loading) return (
        <div className="flex min-h-screen bg-gray-100 items-center justify-center">
            <p className="text-gray-500">Загрузка...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Редактирование курса</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input label="Название *" name="title" value={form.title} onChange={handleChange} />
                                </div>

                                <div>
                                    <label className="block text-gray-500 text-sm mb-2">Иконка</label>
                                    <div className="flex items-center gap-3">
                                        {previewSrc ? (
                                            <img src={previewSrc} alt="preview"
                                                 className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-dashed border-gray-300">
                                                <span className="text-gray-400 text-xs text-center leading-tight">нет<br/>фото</span>
                                            </div>
                                        )}
                                        <Input
                                            label=""
                                            type="fileUpload"
                                            accept="image/*"
                                            onChange={handleIconChange}
                                        />
                                    </div>
                                </div>

                                <Input
                                    label="Время на изучение (мин)"
                                    name="study_time_minutes"
                                    type="number"
                                    value={form.study_time_minutes}
                                    onChange={handleChange}
                                    placeholder="60"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 text-sm mb-2">Описание *</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Требуемый материал"
                                    name="prerequisite_manual_id"
                                    value={form.prerequisite_manual_id}
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'Не требуется' }, ...manualOptions]}
                                    size="sm"
                                />
                                <Select
                                    label="Достижение"
                                    name="achievement_id"
                                    value={form.achievement_id}
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'Не выбрано' }, ...achievementOptions]}
                                    size="sm"
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
                                <Button variant="outline" onClick={() => router.push('/courses')}>Отменить</Button>
                                <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}