'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {useUserStore} from '@/store/userStore';
import {Header, Sidebar} from '@/containers';
import {Input, Button, Checkbox} from '@/components';
import Select from "@/components/Select/Select";

type ProfileForm = {
    last_name: string; first_name: string; middle_name: string;
    phone: string; email: string; passport_series: string;
    passport_number: string; birthday: string; comment: string;
    role: string;
};

function formatPhoneDisplay(raw: string): string {
    if (!raw) return '';
    const d = ('7' + raw).slice(0, 11);
    let f = '+' + d[0];
    if (d.length > 1) {
        f += ' (' + d.slice(1, Math.min(4, d.length));
        if (d.length >= 4) f += ')';
        if (d.length > 4) f += ' ' + d.slice(4, Math.min(7, d.length));
    }
    if (d.length > 7) f += '-' + d.slice(7, Math.min(9, d.length));
    if (d.length > 9) f += '-' + d.slice(9, 11);
    return f;
}

function userToForm(user: ReturnType<typeof useUserStore.getState>['user']): ProfileForm {
    return {
        last_name: user?.last_name ?? '',
        first_name: user?.first_name ?? '',
        middle_name: user?.middle_name ?? '',
        phone: formatPhoneDisplay(user?.phone ?? ''),
        email: user?.email ?? '',
        role: user?.role ?? '',
        passport_series: user?.passport_series ?? '',
        passport_number: user?.passport_number ?? '',
        birthday: user?.birthday ? String(user.birthday).slice(0, 10) : '',
        comment: user?.comment ?? '',
    };
}

export default function ProfilePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const {user, fetchUser, setUser} = useUserStore();

    const [form, setForm] = useState<ProfileForm>(userToForm(null));
    const [original, setOriginal] = useState<ProfileForm>(userToForm(null));
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    useEffect(() => {
        if (user) {
            const init = userToForm(user);
            setForm(init);
            setOriginal(init);
        }
    }, [user]);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/roles')
            .then(r => r.json())
            .then(data => setRoleOptions(
                (data.roles ?? []).map((r: { name: string }) => ({ value: r.name, label: r.name }))
            ));
    }, []);

    const isDirty = JSON.stringify(form) !== JSON.stringify(original) || photoFile !== null;

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const {name, value} = e.target;
        if (name === 'birthday') {
            setForm(prev => ({...prev, birthday: formatBirthday(value)}));
        } else {
            setForm(prev => ({...prev, [name]: value}));
        }
    }

    function handleReset() {
        setForm(original);
        setPhotoFile(null);
        setPhotoPreview(null);
        setSaveError(null);
    }

    function handlePhotoClick() {
        fileInputRef.current?.click();
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    async function handleSave() {
        setSaving(true);
        setSaveError(null);
        try {
            if (photoFile) {
                const fd = new FormData();
                fd.append('photo', photoFile);
                const photoRes = await fetch('/api/auth/photo', { method: 'POST', body: fd });
                const photoData = await photoRes.json();
                if (!photoRes.ok) {
                    setSaveError(photoData.error ?? 'Ошибка загрузки фото');
                    return;
                }
                if (photoData.user) setUser(photoData.user);
                setPhotoFile(null);
                setPhotoPreview(null);
            }
            const res = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка сохранения');
            } else {
                setOriginal(form);
                if (data.user) setUser(data.user);
            }
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    function formatBirthday(raw: string): string {
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        if (digits.length <= 4) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
        return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }

    const initials = user ? `${user.last_name?.[0] ?? ''}${user.first_name?.[0] ?? ''}` : '?';

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6 max-w-200 m-auto">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Профиль</h3>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className={'flex w-full gap-5'}>
                                {/* Фото */}
                                <div className="flex flex-col flex-1 items-center gap-2 flex-shrink-0">
                                    {photoPreview || user?.photo ? (
                                        <img
                                            src={photoPreview ?? user!.photo!}
                                            alt="Фото профиля"
                                            className="object-fit"
                                        />
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

                                <div className={'flex flex-col  flex-1'}>
                                    <Input label="Фамилия" name="last_name" value={form.last_name}
                                           onChange={handleChange} icon="user"/>
                                    <Input label="Имя" name="first_name" value={form.first_name} onChange={handleChange}
                                           icon="user"/>
                                    <Input label="Отчество" name="middle_name" value={form.middle_name}
                                           onChange={handleChange} icon="user"/>
                                </div>
                            </div>
                        </div>

                        {/* Поля */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <Input label="Телефон" name="phone" type="tel" value={form.phone} onChange={handleChange}
                                   icon="phone"/>
                            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                                   icon="email" placeholder="example@mail.ru"/>
                            <Input label="Дата рождения" name="birthday" value={form.birthday} onChange={handleChange}
                                   placeholder="ГГГГ-ММ-ДД"/>
                            <Input label="Серия паспорта" name="passport_series" value={form.passport_series}
                                   onChange={handleChange} placeholder="1234"/>
                            <Select label="Роль" name="role" value={form.role}
                                    onChange={handleChange} placeholder="Выберите роль"
                                    options={roleOptions} />
                            <Input label="Номер паспорта" name="passport_number" value={form.passport_number}
                                   onChange={handleChange} placeholder="567890"/>
                            <div className="sm:col-span-2">
                                <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                                <textarea name="comment" value={form.comment} onChange={handleChange} rows={3}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                            </div>
                            <Checkbox label="Активен" name="notifications" checked={true} onChange={handleChange}
                                      variant="switch"/>
                        </div>

                        {saveError && (
                            <div
                                className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{saveError}</div>
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