'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components';

interface FormState {
    phone: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({ phone: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: form.phone, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Ошибка входа');
            } else {
                router.push('/home');
            }
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-sm p-4">

                    {/* Logo */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 w-[80%] m-auto">
                            <a href="/"><img src="/raz_logo.png" alt="logo" /></a>
                        </div>
                    </div>

                    {/* Sign In Form */}
                    <h2 className="p-5 text-gray-800 text-xl font-semibold m-auto">Авторизация</h2>
                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">
                            <Input label="Телефон" name="phone" type="tel"
                                   value={form.phone} onChange={handleChange}
                                   placeholder="+7(123)456-78-90" icon="phone" />
                        </div>

                        <div className="mb-4">
                            <Input label="Пароль" name="password" type="password"
                                   value={form.password} onChange={handleChange}
                                   placeholder="" icon="lock" />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={rememberMe}
                                       onChange={e => setRememberMe(e.target.checked)}
                                       className="w-4 h-4 rounded border-gray-300" />
                                <span className="text-sm text-gray-600">Запомнить</span>
                            </label>
                            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                Забыл пароль
                            </a>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                                {error}
                            </div>
                        )}

                        <Button type="submit" loading={loading} className="w-full mb-4" size="lg">
                            Войти
                        </Button>

                        <p className="text-center text-gray-500 text-sm">
                            Нет аккаунта?{' '}
                            <a href="/register" className="text-blue-600 hover:underline">Зарегистрироваться</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}