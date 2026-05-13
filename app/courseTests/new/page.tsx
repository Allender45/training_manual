'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { Input, Button, Checkbox, Select } from '@/components';
import { Plus, Trash2, X } from 'lucide-react';

type QuestionDraft = {
    question: string;
    correct_answer: string;
    wrong_answers: string[];
};

type NewTestForm = {
    title: string;
    time_limit: string;
    course_id: string;
    shuffle_questions: boolean;
    shuffle_answers: boolean;
    is_active: boolean;
};

const emptyForm: NewTestForm = {
    title: '', time_limit: '', course_id: '', shuffle_questions: true, shuffle_answers: true, is_active: true,
};

function emptyQuestion(): QuestionDraft {
    return { question: '', correct_answer: '', wrong_answers: ['', ''] };
}

export default function NewTestPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { fetchUser } = useUserStore();

    const [form, setForm] = useState<NewTestForm>(emptyForm);
    const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        fetch('/api/courses').then(r => r.json())
            .then(d => setCourseOptions(
                (d.courses ?? []).map((c: { id: number; title: string }) => ({ value: String(c.id), label: c.title }))
            )).catch(() => {});
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        const type = e.target.type;
        const checked = (e.target as HTMLInputElement).checked;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    function updateQuestion(index: number, field: keyof QuestionDraft, value: string | string[]) {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    }

    function updateWrongAnswer(qIndex: number, aIndex: number, value: string) {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const updated = [...q.wrong_answers];
            updated[aIndex] = value;
            return { ...q, wrong_answers: updated };
        }));
    }

    function addWrongAnswer(qIndex: number) {
        setQuestions(prev => prev.map((q, i) =>
            i === qIndex ? { ...q, wrong_answers: [...q.wrong_answers, ''] } : q
        ));
    }

    function removeWrongAnswer(qIndex: number, aIndex: number) {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            return { ...q, wrong_answers: q.wrong_answers.filter((_, ai) => ai !== aIndex) };
        }));
    }

    function addQuestion() {
        setQuestions(prev => [...prev, emptyQuestion()]);
    }

    function removeQuestion(index: number) {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSave() {
        if (!form.title.trim()) { setSaveError('Заполните название теста'); return; }
        const time_limit = form.time_limit ? Number(form.time_limit) : null;
        if (form.time_limit && (isNaN(time_limit!) || time_limit! <= 0)) {
            setSaveError('Лимит времени должен быть положительным числом');
            return;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) { setSaveError(`Вопрос ${i + 1}: заполните текст вопроса`); return; }
            if (!q.correct_answer.trim()) { setSaveError(`Вопрос ${i + 1}: заполните верный ответ`); return; }
            if (!q.wrong_answers.filter(a => a.trim()).length) { setSaveError(`Вопрос ${i + 1}: добавьте хотя бы один неверный ответ`); return; }
        }
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch('/api/courseTests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title:             form.title.trim(),
                    time_limit,
                    course_id:         form.course_id || null,
                    shuffle_questions: form.shuffle_questions,
                    shuffle_answers:   form.shuffle_answers,
                    is_active:         form.is_active,
                    questions: questions.map((q, i) => ({
                        question:       q.question.trim(),
                        correct_answer: q.correct_answer.trim(),
                        wrong_answers:  q.wrong_answers.filter(a => a.trim()),
                        order_position: i,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? 'Ошибка'); return; }
            router.push('/courseTests');
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
                        <h3 className="text-xl font-semibold text-gray-800">Новый тест</h3>
                    </div>

                    <div className="flex flex-col gap-4">

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Настройки</h4>
                            <div className="flex flex-col gap-4">
                                <Input label="Название *" name="title" value={form.title} onChange={handleChange} />
                                <Input
                                    label="Лимит времени (мин)"
                                    name="time_limit"
                                    type="number"
                                    value={form.time_limit}
                                    onChange={handleChange}
                                    placeholder="Без ограничений"
                                />
                                <Select
                                    label="Курс"
                                    name="course_id"
                                    value={form.course_id}
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'Не привязан' }, ...courseOptions]}
                                />
                                <div className="flex flex-col gap-3">
                                    <Checkbox label="Перемешивать вопросы" name="shuffle_questions"
                                              checked={form.shuffle_questions} onChange={handleChange} variant="switch" />
                                    <Checkbox label="Перемешивать ответы" name="shuffle_answers"
                                              checked={form.shuffle_answers} onChange={handleChange} variant="switch" />
                                    <Checkbox label="Активен" name="is_active"
                                              checked={form.is_active} onChange={handleChange} variant="switch" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
                                Вопросы ({questions.length})
                            </h4>

                            {questions.map((q, qi) => (
                                <div key={qi} className="bg-white rounded-2xl shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold text-gray-600">Вопрос {qi + 1}</span>
                                        {questions.length > 1 && (
                                            <button onClick={() => removeQuestion(qi)}
                                                    className="text-gray-300 hover:text-red-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="block text-gray-500 text-sm mb-1">Текст вопроса *</label>
                                            <textarea
                                                value={q.question}
                                                onChange={e => updateQuestion(qi, 'question', e.target.value)}
                                                rows={2}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                        <Input
                                            label="Верный ответ *"
                                            value={q.correct_answer}
                                            onChange={e => updateQuestion(qi, 'correct_answer', e.target.value)}
                                        />
                                        <div>
                                            <label className="block text-gray-500 text-sm mb-2">Неверные ответы *</label>
                                            <div className="flex flex-col gap-2">
                                                {q.wrong_answers.map((wa, ai) => (
                                                    <div key={ai} className="flex items-center gap-2">
                                                        <input
                                                            value={wa}
                                                            onChange={e => updateWrongAnswer(qi, ai, e.target.value)}
                                                            placeholder={`Вариант ${ai + 1}`}
                                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        {q.wrong_answers.length > 1 && (
                                                            <button onClick={() => removeWrongAnswer(qi, ai)}
                                                                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addWrongAnswer(qi)}
                                                        className="text-sm text-blue-500 hover:text-blue-700 text-left flex items-center gap-1 mt-1">
                                                    <Plus size={14} /> Добавить вариант
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={addQuestion}
                                    className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
                                <Plus size={16} /> Добавить вопрос
                            </button>
                        </div>

                        {saveError && <p className="text-red-500 text-sm px-1">{saveError}</p>}

                        <div className="flex gap-3 pb-6">
                            <Button variant="outline" onClick={() => router.push('/courseTests')}>Отменить</Button>
                            <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}