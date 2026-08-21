'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store';
import { Header, Sidebar } from '@/containers';
import { Button, Checkbox, VoiceTextAnswer } from '@/components';
import { ArrowLeft, ChevronDown, ChevronUp, Star } from 'lucide-react';

type SurveyInfo = {
    id: number;
    status: string;
    checklist_title: string;
    checklist_description: string | null;
    intern_name: string;
    mentor_name: string | null;
    summary: string | null;
};

type SurveyItem = {
    id: number;
    position: number;
    question: string;
    answer_type: string;
    is_required: boolean;
    speech_module: string | null;
    answer_value: { bool?: boolean; rating?: number; text?: string } | null;
    answer_audio_url: string | null;
};

type AnswerState = Record<number, { value: Record<string, unknown> | null; audioUrl: string | null }>;

export default function SurveyConductPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const params = useParams();
    const { fetchUser } = useUserStore();

    const [survey, setSurvey] = useState<SurveyInfo | null>(null);
    const [items, setItems] = useState<SurveyItem[]>([]);
    const [answers, setAnswers] = useState<AnswerState>({});
    const [summary, setSummary] = useState('');
    const [expandedSpeech, setExpandedSpeech] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const editable = survey ? !['done', 'cancelled'].includes(survey.status) : false;

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        loadSurvey();
    }, []);

    async function loadSurvey() {
        setLoading(true);
        try {
            const res = await fetch(`/api/surveys/${params.id}`);
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Ошибка загрузки'); return; }
            setSurvey(data.survey);
            setItems(data.items);
            setSummary(data.survey.summary ?? '');
            setAnswers(Object.fromEntries(data.items.map((i: SurveyItem) => [
                i.id,
                { value: i.answer_value, audioUrl: i.answer_audio_url },
            ])));
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    }

    function setAnswer(itemId: number, value: Record<string, unknown> | null) {
        setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], value } }));
    }

    function setAudio(itemId: number, audioUrl: string | null) {
        setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], audioUrl } }));
    }

    async function save(finish: boolean) {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/surveys/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: Object.entries(answers)
                        .filter(([, a]) => a.value !== null)
                        .map(([itemId, a]) => ({ item_id: Number(itemId), value: a.value, audio_url: a.audioUrl })),
                    summary,
                    finish,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Ошибка сохранения'); return; }
            if (finish) {
                router.push('/surveys');
            } else {
                loadSurvey();
            }
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    function renderAnswer(item: SurveyItem) {
        const answer = answers[item.id];
        const value = (answer?.value ?? null) as SurveyItem['answer_value'];

        if (!editable) {
            return (
                <div className="text-sm text-gray-700">
                    {item.answer_type === 'yesno' && (value?.bool === true ? 'Да' : value?.bool === false ? 'Нет' : '—')}
                    {item.answer_type === 'checkbox' && (value?.bool ? 'Выполнено' : '—')}
                    {item.answer_type === 'rating' && (value?.rating ? `Оценка: ${value.rating} / 5` : '—')}
                    {item.answer_type === 'text' && (value?.text
                        ? <p className="whitespace-pre-wrap">{String(value.text)}</p> : '—')}
                    {item.answer_type === 'text' && answer?.audioUrl && (
                        <audio controls src={answer.audioUrl} className="h-8 mt-2 w-full max-w-md" />
                    )}
                </div>
            );
        }

        switch (item.answer_type) {
            case 'yesno':
                return (
                    <div className="flex gap-2">
                        {[true, false].map(v => (
                            <button key={String(v)} type="button"
                                    onClick={() => setAnswer(item.id, { bool: v })}
                                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                                        value?.bool === v
                                            ? 'bg-[#41A141] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}>
                                {v ? 'Да' : 'Нет'}
                            </button>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <Checkbox label="Выполнено" name={`item_${item.id}`}
                              checked={value?.bool === true}
                              onChange={e => setAnswer(item.id, { bool: e.target.checked })} />
                );
            case 'rating':
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button"
                                    onClick={() => setAnswer(item.id, { rating: n })}
                                    className="p-1">
                                <Star size={22}
                                      className={n <= (value?.rating ?? 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-gray-300 hover:text-amber-300'} />
                            </button>
                        ))}
                    </div>
                );
            case 'text':
                return (
                    <VoiceTextAnswer
                        value={String(value?.text ?? '')}
                        audioUrl={answer?.audioUrl ?? null}
                        onChange={text => setAnswer(item.id, { text })}
                        onAudioChange={url => setAudio(item.id, url)}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto">
                        <button onClick={() => router.push('/surveys')}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
                            <ArrowLeft size={16} />
                            К списку бесед
                        </button>

                        {loading ? (
                            <div className="py-10 text-center text-gray-400">Загрузка...</div>
                        ) : error && !survey ? (
                            <div className="py-10 text-center text-red-500">{error}</div>
                        ) : survey && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="mb-6 pb-4 border-b border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-800">{survey.checklist_title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Стажёр: <span className="font-medium text-gray-700">{survey.intern_name}</span>
                                        {survey.mentor_name && <> · Наставник: {survey.mentor_name}</>}
                                    </p>
                                    {survey.checklist_description && (
                                        <p className="text-sm text-gray-500 mt-2">{survey.checklist_description}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-5">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <div className="flex gap-2 mb-1">
                                                <span className="text-xs text-gray-400 pt-0.5">{index + 1}.</span>
                                                <div
                                                    className="text-sm font-medium text-gray-800 flex-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                    dangerouslySetInnerHTML={{ __html: item.question }}
                                                />
                                                {item.is_required && <span className="text-red-400 text-xs">*</span>}
                                            </div>

                                            {item.speech_module && (
                                                <div className="ml-5 mb-3">
                                                    <button type="button"
                                                            onClick={() => setExpandedSpeech(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                            className="flex items-center gap-1 text-xs text-[#41A141] hover:text-[#358535] font-medium">
                                                        {expandedSpeech[item.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        Речевой модуль
                                                    </button>
                                                    {expandedSpeech[item.id] && (
                                                        <div
                                                            className="mt-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                            dangerouslySetInnerHTML={{ __html: item.speech_module }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            <div className="ml-5">
                                                {renderAnswer(item)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Итог беседы
                                    </label>
                                    <textarea
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]
                                                   focus:outline-none focus:ring-2 focus:ring-[#41A141]/30 focus:border-[#41A141]
                                                   disabled:bg-gray-50"
                                        value={summary}
                                        onChange={e => setSummary(e.target.value)}
                                        placeholder="Краткие выводы, договорённости..."
                                        disabled={!editable}
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

                                {editable && (
                                    <div className="flex gap-3 mt-6">
                                        <Button variant="outline" onClick={() => save(false)} loading={saving}>
                                            Сохранить черновик
                                        </Button>
                                        <Button onClick={() => save(true)} loading={saving}>
                                            Завершить беседу
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}