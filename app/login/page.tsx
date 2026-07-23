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
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [forgotError, setForgotError] = useState('');

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

    async function handleForgot(e: React.FormEvent) {
        e.preventDefault();
        setForgotStatus('loading');
        setForgotError('');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: forgotPhone }),
            });
            const data = await res.json();
            if (!res.ok) {
                setForgotError(data.error ?? 'Ошибка');
                setForgotStatus('error');
            } else {
                setForgotStatus('success');
            }
        } catch {
            setForgotError('Ошибка соединения');
            setForgotStatus('error');
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
                            <button
                                type="button"
                                onClick={() => { setForgotOpen(true); setForgotStatus('idle'); setForgotPhone(''); setForgotError(''); }}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Забыл пароль
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                                {error}
                            </div>
                        )}

                        <Button type="submit" loading={loading} className="w-full mb-4" size="lg">
                            Войти
                        </Button>

                        {/*<p className="text-center text-gray-500 text-sm">*/}
                        {/*    Нет аккаунта?{' '}*/}
                        {/*    <a href="/register" className="text-blue-600 hover:underline">Зарегистрироваться</a>*/}
                        {/*</p>*/}
                    </form>
                </div>
            </div>

            {forgotOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Сброс пароля</h3>

                        {forgotStatus === 'success' ? (
                            <div className="text-center">
                                <div className="text-green-600 text-sm mb-4">
                                    ✅ Новый пароль отправлен в Telegram
                                </div>
                                <button
                                    onClick={() => setForgotOpen(false)}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Закрыть
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgot}>
                                <p className="text-sm text-gray-500 mb-4">
                                    Введите номер телефона — новый пароль придёт в Telegram.
                                </p>
                                <Input
                                    label="Телефон"
                                    name="forgotPhone"
                                    type="tel"
                                    value={forgotPhone}
                                    onChange={e => setForgotPhone(e.target.value)}
                                    placeholder="+7(123)456-78-90"
                                    icon="phone"
                                />
                                {forgotStatus === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mt-3">
                                        {forgotError}
                                    </div>
                                )}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setForgotOpen(false)}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={forgotStatus === 'loading'}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {forgotStatus === 'loading' ? 'Отправка...' : 'Отправить'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}