'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Input, Button, Checkbox, CKEditorField } from '@/components';

type NewManualForm = {
    title: string;
    description: string;
    comment: string;
    is_active: boolean;
};

const emptyForm: NewManualForm = {
    title: '', description: '', comment: '', is_active: true,
};

export default function NewManualPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [form, setForm] = useState<NewManualForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    }

    async function handleSave() {
        if (!form.title.trim() || !form.description.trim()) {
            setSaveError('Заполните обязательные поля: название, описание');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch('/api/manuals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title:       form.title.trim(),
                    description: form.description.trim(),
                    comment:     form.comment.trim() || null,
                    is_active:   form.is_active,
                }),
            });
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

                            <Input label="Название *" name="title" value={form.title} onChange={handleChange}/>

                            <div>
                                <CKEditorField
                                    label="Содержание"
                                    value={content}
                                    onChange={setContent}
                                    placeholder="Введите текст материала..."
                                    minHeight={200}
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