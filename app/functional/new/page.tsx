'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Sidebar } from '@/containers';
import { Input, Button, CKEditorField, Checkbox } from '@/components';

export default function NewFunctionalPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);

    async function handleSave() {
        if (!title.trim()) {
            setSaveError('Заполните обязательное поле: название');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch('/api/functional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), content, is_active: isActive }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }
            router.push('/functional');
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
                <main className="flex-1 p-6 max-w-4xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Новая инструкция</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col gap-6">

                            <Input
                                label="Название *"
                                name="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />

                            <CKEditorField
                                label="Содержимое"
                                value={content}
                                onChange={setContent}
                                minHeight={300}
                            />

                            <Checkbox
                                label="Активна"
                                name="is_active"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                                variant="switch"
                            />

                            {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => router.push('/functional')}>
                                    Отменить
                                </Button>
                                <Button onClick={handleSave} loading={saving}>
                                    Сохранить
                                </Button>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}