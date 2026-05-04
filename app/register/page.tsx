'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface FormState {
    last_name: string;
    first_name: string;
    middle_name: string;
    phone: string;
    email: string;
    passport_series: string;
    passport_number: string;
    birthday: string;
    comment: string;
    password: string;
    confirm_password: string;
}

const INITIAL: FormState = {
    last_name: '', first_name: '', middle_name: '',
    phone: '', email: '',
    passport_series: '', passport_number: '',
    birthday: '', comment: '',
    password: '', confirm_password: '',
};

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value.length > 0 && !value.startsWith('7')) {
            value = '7' + value;
        }
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        if (value.length >= 2) {
            value = value.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
        }
        setForm(prev => ({ ...prev, phone: value }));
    }

    function handleBirthdayChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '.' + value.slice(2);
        }
        if (value.length >= 5) {
            value = value.slice(0, 5) + '.' + value.slice(5);
        }
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        setForm(prev => ({ ...prev, birthday: value }));
    }

    function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setPhoto(file);
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirm_password) {
            setError('Пароли не совпадают');
            return;
        }

        const data = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            if (key !== 'confirm_password') data.append(key, val);
        });
        if (photo) data.append('photo', photo);

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', body: data });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? 'Ошибка регистрации');
                return;
            }
            setSuccess(true);
        } catch {
            setError('Не удалось подключиться к серверу');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center max-w-md w-full">
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Регистрация завершена</h2>
                    <p className="text-gray-500 text-sm mb-6">Ваш аккаунт успешно создан</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-blue-600 text-white py-3 rounded-3 text-lg font-medium hover:bg-blue-700 transition"
                    >
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    {/* Logo */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">P</span>
                            </div>
                            <span className="text-xl font-semibold text-gray-800">Portal</span>
                        </div>
                    </div>

                    {/* Sign Up Form */}
                    <h2 className="mb-4 text-gray-800 text-xl font-semibold">Регистрация</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* ФИО */}
                        <div className="space-y-3">
                            <Field label="Фамилия *" name="last_name" value={form.last_name} onChange={handleChange} required />
                            <Field label="Имя *" name="first_name" value={form.first_name} onChange={handleChange} required />
                            <Field label="Отчество *" name="middle_name" value={form.middle_name} onChange={handleChange} required />
                        </div>

                        {/* Телефон и Email */}
                        <div className="space-y-3">
                            <Field label="Телефон *" name="phone" type="tel" value={form.phone} onChange={handlePhoneChange} required placeholder="+7 (999) 999-99-99" />
                            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@domain.com" />
                        </div>

                        {/* День рождения */}
                        <Field label="День рождения" name="birthday" type="text" value={form.birthday} onChange={handleBirthdayChange} placeholder="dd.mm.yyyy" />

                        {/* Фото */}
                        <div>
                            <label className="block text-gray-500 text-sm mb-2">Фото</label>
                            <div className="flex items-center gap-3">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="preview" className="w-12 h-12 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Выбрать фото
                                </button>
                                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handlePhoto} />
                            </div>
                        </div>

                        {/* Паспорт */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Серия паспорта" name="passport_series" value={form.passport_series} onChange={handleChange} maxLength={4} placeholder="XXXX" />
                            <Field label="Номер паспорта" name="passport_number" value={form.passport_number} onChange={handleChange} maxLength={6} placeholder="XXXXXX" />
                        </div>

                        {/* Комментарий */}
                        <div>
                            <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                            <textarea
                                name="comment"
                                value={form.comment}
                                onChange={handleChange}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Пароли */}
                        <div className="space-y-3">
                            <Field label="Пароль *" name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} />
                            <Field label="Повторите пароль *" name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required minLength={8} />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-3 text-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>

                        {/* Divider */}
                        <div className="text-center text-gray-500 text-sm pt-2">
                            Уже есть аккаунт? <a href="/login" className="text-blue-600 hover:underline">Войти</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ---------- Вспомогательный компонент поля ---------- */
function Field({
                   label, name, type = 'text', value, onChange, required, placeholder, maxLength, minLength,
               }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean; placeholder?: string; maxLength?: number; minLength?: number;
}) {
    return (
        <div className="relative">
            <label htmlFor={name} className="block text-gray-500 text-sm mb-2">{label}</label>
            <div className="relative">
                <input
                    id={name} name={name} type={type} value={value} onChange={onChange}
                    required={required} placeholder={placeholder} maxLength={maxLength} minLength={minLength}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Иконки как в шаблоне */}
                {name === 'last_name' || name === 'first_name' || name === 'middle_name' ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                ) : name === 'email' ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                ) : name === 'phone' ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                ) : name === 'password' || name === 'confirm_password' ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                ) : null}
            </div>
        </div>
    );
}