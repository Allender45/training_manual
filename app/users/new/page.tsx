'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {useUserStore} from '@/store/userStore';
import {Header, Sidebar} from '@/containers';
import {Input, Button, Select} from '@/components';

type NewUserForm = {
    last_name: string; first_name: string; middle_name: string;
    phone: string; email: string;
    password: string;
    confirmPassword: string;
    role: string;
    passport_series: string; passport_number: string;
    birthday: string; comment: string;
};

const emptyForm: NewUserForm = {
    last_name: '', first_name: '', middle_name: '',
    phone: '', email: '', password: '', confirmPassword: '',
    role: '',
    passport_series: '', passport_number: '',
    birthday: '', comment: '',
};

export default function NewUserPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const {fetchUser} = useUserStore();

    const [form, setForm] = useState<NewUserForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/roles')
            .then(r => r.json())
            .then(data => setRoleOptions(
                (data.roles ?? []).map((r: { name: string }) => ({value: r.name, label: r.name}))
            ));
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const {name, value} = e.target;
        if (name === 'birthday') {
            setForm(prev => ({...prev, birthday: formatBirthday(value)}));
        } else {
            setForm(prev => ({...prev, [name]: value}));
        }
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
    }

    async function handleSave() {
        if (form.password !== form.confirmPassword) {
            setSaveError('Пароли не совпадают');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k !== 'confirmPassword') fd.append(k, v);
            });
            if (photoFile) fd.append('photo', photoFile);

            const res = await fetch('/api/users', {method: 'POST', body: fd});
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }
            router.push('/users');
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

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Новый пользователь</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col gap-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Фамилия *" name="last_name" value={form.last_name}
                                       onChange={handleChange}/>
                                <Input label="Имя *" name="first_name" value={form.first_name} onChange={handleChange}/>
                                <Input label="Отчество *" name="middle_name" value={form.middle_name}
                                       onChange={handleChange}/>
                                <Input label="Телефон *" name="phone" type="tel" value={form.phone}
                                       onChange={handleChange}/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Пароль *" name="password" type="password" value={form.password}
                                       onChange={handleChange}/>
                                <Input label="Подтверждение пароля *" name="confirmPassword" type="password"
                                       value={form.confirmPassword} onChange={handleChange}/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Email" name="email" type="email" value={form.email}
                                       onChange={handleChange}/>

                                <Select label="Роль" name="role" value={form.role} onChange={handleChange}
                                        options={roleOptions} placeholder="Выберите роль"/>

                                <Input label="Дата рождения" name="birthday" value={form.birthday}
                                       onChange={handleChange}
                                       placeholder="ГГГГ-ММ-ДД"/>
                                <Input label="Серия паспорта" name="passport_series" value={form.passport_series}
                                       onChange={handleChange}/>
                                <Input label="Номер паспорта" name="passport_number" value={form.passport_number}
                                       onChange={handleChange}/>
                                <Input label="Фото" accept="image/*"
                                       onChange={handlePhotoChange} type='fileUpload'/>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                                <textarea name="comment" value={form.comment} onChange={handleChange} rows={3}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                            </div>
                            {saveError && <p className="text-red-500 text-sm mt-4">{saveError}</p>}

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => router.push('/users')}>Отменить</Button>
                                <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}