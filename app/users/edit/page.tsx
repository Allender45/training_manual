'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Input, Button, Select, Checkbox } from '@/components';

type EditUserForm = {
    last_name: string; first_name: string; middle_name: string;
    phone: string; email: string;
    role: string;
    passport_series: string; passport_number: string;
    birthday: string; comment: string;
    is_active: boolean;
};

type UserData = {
    id: number;
    photo: string | null;
    registered_at: string | null;
};

const emptyForm: EditUserForm = {
    last_name: '', first_name: '', middle_name: '',
    phone: '', email: '', role: '',
    passport_series: '', passport_number: '',
    birthday: '', comment: '',
    is_active: true,
};

export default function EditUserPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const { fetchUser } = useUserStore();

    const [form, setForm] = useState<EditUserForm>(emptyForm);
    const [originalForm, setOriginalForm] = useState<EditUserForm>(emptyForm);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm) || photoFile !== null;

    const initials = [form.last_name, form.first_name, form.middle_name]
        .filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/roles')
            .then(r => r.json())
            .then(data => setRoleOptions(
                (data.roles ?? []).map((r: { name: string }) => ({ value: r.name, label: r.name }))
            ));
        if (userId) {
            fetch(`/api/users/${userId}`)
                .then(r => r.json())
                .then(data => {
                    const u = data.user;
                    const filled: EditUserForm = {
                        last_name: u.last_name ?? '',
                        first_name: u.first_name ?? '',
                        middle_name: u.middle_name ?? '',
                        phone: u.phone ?? '',
                        email: u.email ?? '',
                        role: u.role ?? '',
                        passport_series: u.passport_series ?? '',
                        passport_number: u.passport_number ?? '',
                        birthday: u.birthday ?? '',
                        comment: u.comment ?? '',
                        is_active: u.is_active ?? true,
                    };
                    setForm(filled);
                    setOriginalForm(filled);
                    setUser({ id: u.id, photo: u.photo ?? null, registered_at: u.registered_at ?? null });
                })
                .finally(() => setLoading(false));
        }
    }, [userId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        const type = (e.target as HTMLInputElement).type;
        const checked = (e.target as HTMLInputElement).checked;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    function handlePhotoClick() {
        fileInputRef.current?.click();
    }

    function handleReset() {
        setForm(originalForm);
        setPhotoFile(null);
        setPhotoPreview(null);
    }

    async function handleSave() {
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            if (photoFile) fd.append('photo', photoFile);

            const res = await fetch(`/api/users/${userId}`, { method: 'PATCH', body: fd });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            router.push('/users');
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Редактирование пользователя</h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex w-full gap-5 mb-6">
                            <div className="flex flex-col flex-1 items-center gap-2 flex-shrink-0">
                                {photoPreview || user?.photo ? (
                                    <img src={photoPreview ?? user!.photo!} alt="Фото профиля" className="w-28 h-28 rounded-full object-cover" />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold select-none">
                                        {initials}
                                    </div>
                                )}
                                <span className="text-xs text-gray-400">
                                    {user?.registered_at ? `С ${new Date(user.registered_at).toLocaleDateString('ru-RU')}` : ''}
                                </span>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                <button className="text-sm text-blue-600 hover:underline" onClick={handlePhotoClick}>
                                    Изменить фото
                                </button>
                            </div>
                            <div className="flex flex-col flex-1 gap-4">
                                <Input label="Фамилия" name="last_name" value={form.last_name} onChange={handleChange} icon="user" />
                                <Input label="Имя" name="first_name" value={form.first_name} onChange={handleChange} icon="user" />
                                <Input label="Отчество" name="middle_name" value={form.middle_name} onChange={handleChange} icon="user" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Телефон" name="phone" type="tel" value={form.phone} onChange={handleChange} icon="phone" />
                            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} icon="email" placeholder="example@mail.ru" />
                            <Input label="Дата рождения" name="birthday" value={form.birthday} onChange={handleChange} placeholder="ГГГГ-ММ-ДД" />
                            <Input label="Серия паспорта" name="passport_series" value={form.passport_series} onChange={handleChange} placeholder="1234" />
                            <Select label="Роль" name="role" value={form.role} onChange={handleChange} placeholder="Выберите роль" options={roleOptions} />
                            <Input label="Номер паспорта" name="passport_number" value={form.passport_number} onChange={handleChange} placeholder="567890" />
                            <div className="sm:col-span-2">
                                <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                                <textarea name="comment" value={form.comment} onChange={handleChange} rows={3}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>
                            <Checkbox label="Активен" name="is_active" checked={form.is_active} onChange={handleChange} variant="switch" />
                        </div>

                        {saveError && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{saveError}</div>
                        )}
                        <div className="flex gap-3 mt-6 pt-5 border-t justify-end">
                            <Button variant="outline" onClick={handleReset} disabled={!isDirty}>Сбросить</Button>
                            <Button onClick={handleSave} disabled={!isDirty} loading={saving}>Сохранить</Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}