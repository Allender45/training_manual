'use client';

import {useState, useEffect} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useUserStore, useCoursesStore, useManualsStore, useAchievementsStore, useTrainersStore, useTestsStore } from '@/store';
import {Header, Sidebar} from '@/containers';
import {Input, Button, Select, Checkbox} from '@/components';

type CourseForm = {
    title: string;
    description: string;
    comment: string;
    prerequisite_course_id: string;
    study_time_minutes: string;
    achievement_id: string;
    is_active: boolean;
    trainer_id: string;
    test_id: string;
};

const emptyForm: CourseForm = {
    title: '', description: '', comment: '',
    prerequisite_course_id: '', study_time_minutes: '', achievement_id: '',
    is_active: true, trainer_id: '', test_id: '',
};

export default function NewCoursePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const isEditMode = !!courseId;
    const {fetchUser} = useUserStore();
    const {courses, fetch: fetchCourses} = useCoursesStore();
    const {manuals: allManuals, fetch: fetchManuals} = useManualsStore();
    const {achievements, fetch: fetchAchievements} = useAchievementsStore();
    const {trainers, fetch: fetchTrainers} = useTrainersStore();
    const { tests, fetch: fetchTests } = useTestsStore();

    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [currentIcon, setCurrentIcon] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [manualRows, setManualRows] = useState<string[]>(['']);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetchCourses();
        fetchManuals();
        fetchAchievements();
        fetchTrainers();
        fetchTests();

        if (isEditMode) {
            fetch(`/api/manuals?course_id=${courseId}`)
                .then(r => r.json())
                .then(d => {
                    const ids = (d.manuals ?? []).map((m: any) => String(m.id));
                    setManualRows(ids.length > 0 ? ids : ['']);
                });

            fetch(`/api/courses/${courseId}`)
                .then(r => r.json())
                .then(d => {
                    const c = d.course;
                    setForm({
                        title: c.title ?? '',
                        description: c.description ?? '',
                        comment: c.comment ?? '',
                        prerequisite_course_id: c.prerequisite_course_id ? String(c.prerequisite_course_id) : '',
                        study_time_minutes: c.study_time_minutes ? String(c.study_time_minutes) : '',
                        achievement_id: c.achievement_id ? String(c.achievement_id) : '',
                        is_active: c.is_active ?? true,
                        trainer_id: c.trainer_id ? String(c.trainer_id) : '',
                        test_id: c.test_id ? String(c.test_id) : '',
                    });
                    setCurrentIcon(c.icon ?? null);
                })
                .finally(() => setLoading(false));
        }
    }, [courseId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const {name, value, type} = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({...prev, [name]: (e.target as HTMLInputElement).checked}));
        } else {
            setForm(prev => ({...prev, [name]: value}));
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
        if (!isEditMode && !iconFile) {
            setSaveError('Выберите иконку курса');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            fd.append('title', form.title.trim());
            fd.append('description', form.description.trim());
            fd.append('comment', form.comment.trim());
            fd.append('prerequisite_course_id', form.prerequisite_course_id);
            fd.append('study_time_minutes', form.study_time_minutes);
            fd.append('achievement_id', form.achievement_id);
            fd.append('is_active', String(form.is_active));
            fd.append('trainer_id', form.trainer_id);
            fd.append('test_id', form.test_id);
            if (iconFile) fd.append('icon', iconFile);

            const res = isEditMode
                ? await fetch(`/api/courses/${courseId}`, {method: 'PATCH', body: fd})
                : await fetch('/api/courses', {method: 'POST', body: fd});

            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }
            router.push('/courses');

            if (isEditMode) {
                const ids = manualRows.filter(id => id !== '').map(Number);
                await fetch(`/api/courses/${courseId}/manuals`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({manual_ids: ids}),
                });
            }
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    const previewSrc = iconPreview ?? (isEditMode ? currentIcon : null);

    if (loading) return (
        <div className="flex min-h-screen bg-gray-100 items-center justify-center">
            <p className="text-gray-500">Загрузка...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {isEditMode ? 'Редактирование курса' : 'Новый курс'}
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input label="Название *" name="title" value={form.title} onChange={handleChange}/>
                                </div>

                                <div>
                                    <div className="flex items-end gap-3">
                                        {previewSrc ? (
                                            <img src={previewSrc} alt="preview"
                                                 className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-200"/>
                                        ) : (
                                            <div
                                                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-dashed border-gray-300">
                                                <span
                                                    className="text-gray-400 text-xs text-center leading-tight">нет<br/>фото</span>
                                            </div>
                                        )}
                                        <Input
                                            label="Загрузка файла"
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
                                    name="prerequisite_course_id"
                                    value={form.prerequisite_course_id}
                                    onChange={handleChange}
                                    options={[
                                        {value: '', label: 'Не требуется'},
                                        ...courses
                                            .filter(c => !isEditMode || String(c.id) !== courseId)
                                            .map(c => ({value: String(c.id), label: c.title}))
                                    ]}
                                    size="sm"
                                />
                                <Select
                                    label="Достижение"
                                    name="achievement_id"
                                    value={form.achievement_id}
                                    onChange={handleChange}
                                    options={[
                                        {value: '', label: 'Не требуется'},
                                        ...achievements
                                            .map(c => ({value: String(c.id), label: c.title}))
                                    ]}
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
                                      onChange={handleChange} variant="switch"/>

                            {isEditMode && (
                                <div>
                                    <label className="block text-gray-500 text-sm mb-2">Содержимое</label>
                                    <div className="flex flex-col gap-2">
                                        {manualRows.map((val, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <Select
                                                        label=""
                                                        name={`manual_${idx}`}
                                                        value={val}
                                                        onChange={e => {
                                                            const next = [...manualRows];
                                                            next[idx] = e.target.value;
                                                            setManualRows(next);
                                                        }}
                                                        options={[
                                                            {value: '', label: '— выберите материал —'},
                                                            ...allManuals.map(m => ({
                                                                value: String(m.id),
                                                                label: m.title
                                                            }))
                                                        ]}
                                                    />
                                                </div>
                                                {manualRows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualRows(manualRows.filter((_, i) => i !== idx))}
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                    >✕</button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setManualRows([...manualRows, ''])}
                                            className="self-start text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                        >
                                            <span className="font-bold text-base">+ Добавить материал</span>
                                        </button>
                                    </div>

                                    <div className="mt-5">
                                        <Select
                                            label="Тренажёр"
                                            name="trainer_id"
                                            value={form.trainer_id}
                                            onChange={handleChange}
                                            options={[
                                                {value: '', label: '— не выбран —'},
                                                ...trainers.map(t => ({value: String(t.id), label: t.name}))
                                            ]}
                                            size="sm"
                                        />
                                    </div>

                                    <div className="mt-5">
                                        <Select
                                            label="Тест"
                                            name="test_id"
                                            value={form.test_id}
                                            onChange={handleChange}
                                            options={[
                                                { value: '', label: '— не выбран —' },
                                                ...tests.map(t => ({ value: String(t.id), label: t.title }))
                                            ]}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            )}

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