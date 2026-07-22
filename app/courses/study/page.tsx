'use client';

import React, {useState, useEffect} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useUserStore, useNotificationsStore, useAchievementsStore} from '@/store';
import {Header, Sidebar, Modal} from '@/containers';
import {Clock, BookOpen, Video, Music, FileText, ClipboardList, CheckCircle, XCircle} from 'lucide-react';
import {CallCardTrainer, CaseQuizTrainer, PricingQuizTrainer, NewOrderTrainer, Button, FullOrderCreate} from '@/components';

type Course = {
    id: number;
    title: string;
    icon: string;
    description: string;
    comment: string | null;
    study_time_minutes: number | null;
    is_active: boolean;
    test_id: number | null;
};

type CourseTrainer = {
    id: number;
    name: string;
    component: string;
};

type Manual = {
    id: number;
    title: string;
    icon: string;
    type: 'text' | 'video' | 'audio';
    description: string;
    content: string | null;
    prerequisite_id: number | null;
    is_active: boolean;
};

type CourseTest = {
    id: number;
    title: string;
    time_limit: number | null;
    shuffle_questions: boolean;
    shuffle_answers: boolean;
    notify_trainee: string | null;
    achievement_id: number | null;
};

type TestQuestion = {
    id: number;
    question: string;
    options: string[];
};

type TestSubmitResult = {
    score: number;
    total: number;
    correct: number;
    results: { question_id: number; correct: boolean; correct_answer?: string }[];
};

function formatStudyTime(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function pluralManuals(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'материал';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'материала';
    return 'материалов';
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const TYPE_CONFIG = {
    text:  {label: 'Текст', icon: FileText, color: 'bg-blue-50 text-blue-700'},
    video: {label: 'Видео', icon: Video,    color: 'bg-purple-50 text-purple-700'},
    audio: {label: 'Аудио', icon: Music,    color: 'bg-amber-50 text-amber-700'},
} as const;

const TRAINER_COMPONENTS: Record<string, React.ComponentType<any>> = {
    CallCardTrainer,
    CaseQuizTrainer,
    PricingQuizTrainer,
    NewOrderTrainer,
    FullOrderCreate,
};

export default function CourseStudyPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const {user, fetchUser} = useUserStore();
    const push = useNotificationsStore(s => s.push);
    const showAchievement = useNotificationsStore(s => s.showAchievement);
    const { achievements, fetch: fetchAchievements } = useAchievementsStore();

    const [course, setCourse] = useState<Course | null>(null);
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [trainers, setTrainers] = useState<CourseTrainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [courseTest, setCourseTest] = useState<CourseTest | null>(null);
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
    const [testLoading, setTestLoading] = useState(false);
    const [testPhase, setTestPhase] = useState<'intro' | 'test' | 'result'>('intro');
    const [completedTrainers, setCompletedTrainers] = useState<Set<number>>(new Set());
    const [openTrainerId, setOpenTrainerId] = useState<number | null>(null);
    const [testPassed, setTestPassed] = useState(false);
    const [testAttempted, setTestAttempted] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [testResult, setTestResult] = useState<TestSubmitResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
        if (!courseId) {
            setError('ID курса не указан');
            setLoading(false);
            return;
        }

        setCourse(null);
        setManuals([]);
        setTrainers([]);
        setCourseTest(null);
        setLoading(true);
        setError(null);

        fetch(`/api/courses/${courseId}`)
            .then(r => r.json())
            .then(courseData => {
                if (courseData.error) { setError(courseData.error); return Promise.reject(null); }
                setCourse(courseData.course);
                const testId = courseData.course?.test_id;
                return Promise.all([
                    fetch(`/api/manuals?course_id=${courseId}`).then(r => r.json()),
                    testId ? fetch(`/api/courseTests/${testId}`).then(r => r.json()) : Promise.resolve(null),
                    fetch(`/api/courses/${courseId}/trainers`).then(r => r.json()),
                ]);
            })
            .then(results => {
                if (!results) return;
                const [manualsData, testData, trainersData] = results;
                setManuals((manualsData.manuals ?? []).filter((m: Manual) => m.is_active));
                if (testData?.test?.is_active) {
                    setCourseTest(testData.test);
                    setTestQuestions(testData.questions ?? []);
                }
                setTrainers(trainersData.trainers ?? []);
            })
            .catch(e => { if (e !== null) setError('Ошибка загрузки данных'); })
            .finally(() => setLoading(false));
    }, [courseId]);

    useEffect(() => { fetchAchievements(); }, []);

    useEffect(() => {
        if (testPhase !== 'test' || timeLeft === null) return;
        if (timeLeft <= 0) {
            finishTest();
            return;
        }
        const id = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
        return () => clearTimeout(id);
    }, [testPhase, timeLeft]);

    async function openTestModal() {
        if (!courseTest) return;
        setTestModalOpen(true);
        setTestPhase('intro');
        setCurrentQ(0);
        setSelectedAnswers({});
        setTimeLeft(null);
        setTestResult(null);
        setSubmitError(null);
        setTestLoading(true);
        try {
            const res = await fetch(`/api/courseTests/${courseTest.id}`);
            const data = await res.json();
            const qs: any[] = data.questions ?? [];
            const shuffledQs = courseTest.shuffle_questions ? shuffle(qs) : qs;
            setTestQuestions(shuffledQs.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options ?? [],
            })));
        } finally {
            setTestLoading(false);
        }
    }

    function startTest() {
        setTestPhase('test');
        if (courseTest?.time_limit) setTimeLeft(courseTest.time_limit * 60);
    }

    function selectAnswer(answer: string) {
        if (selectedAnswers[currentQ] !== undefined) return;
        setSelectedAnswers(prev => ({...prev, [currentQ]: answer}));
    }

    function nextQuestion() {
        if (currentQ < testQuestions.length - 1) {
            setCurrentQ(prev => prev + 1);
        } else {
            finishTest();
        }
    }

    async function finishTest() {
        if (submitting || !courseTest) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`/api/courseTests/${courseTest.id}/submit`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    answers: testQuestions.map((q, i) => ({
                        question_id: q.id,
                        answer: selectedAnswers[i] ?? null,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSubmitError(data.error ?? 'Ошибка проверки ответов');
                return;
            }

            setTestResult(data);
            setTestPhase('result');

            if (data.correct === data.total) {
                setTestPassed(true);

                if (courseTest?.notify_trainee) {
                    push({text: 'Стажёр: ' + user?.last_name + ' ' + user?.first_name + ' ' + user?.middle_name + ' ' + courseTest.notify_trainee, icon: '📋'});
                }

                if (courseTest?.achievement_id) {
                    const achievement = achievements.find(a => a.id === courseTest.achievement_id);
                    if (achievement) showAchievement(achievement);
                }

                if (course?.id) {
                    fetch('/api/user-progress', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            content_type: 'course',
                            content_id: course.id,
                            score: data.score,
                        }),
                    }).catch(() => {});
                }
            }

            setTestAttempted(true);
        } catch {
            setSubmitError('Ошибка соединения с сервером');
        } finally {
            setSubmitting(false);
        }
    }

    function closeTestModal() {
        setTestModalOpen(false);
        setTestPhase('intro');
        setCurrentQ(0);
        setSelectedAnswers({});
        setTimeLeft(null);
    }

    function handleTrainerComplete(trainerId: number) {
        setCompletedTrainers(prev => new Set([...prev, trainerId]));
        setOpenTrainerId(null);
    }

    const allTrainersCompleted = trainers.length === 0 || trainers.every(t => completedTrainers.has(t.id));

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6 max-w-4xl">

                    {loading && (
                        <div className="flex items-center justify-center h-64 text-gray-400">Загрузка...</div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
                    )}

                    {course && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                                <div className="flex items-start gap-5">
                                    <img src={course.icon} alt={course.title}
                                         className="w-20 h-20 object-contain flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                                            {!course.is_active && (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Неактивен</span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm mb-3">{course.description}</p>
                                        <div className="flex items-center gap-5 text-sm text-gray-400">
                                            {course.study_time_minutes && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14}/>{formatStudyTime(course.study_time_minutes)}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen size={14}/>{manuals.length} {pluralManuals(manuals.length)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {course.comment && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400 italic">
                                        {course.comment}
                                    </div>
                                )}
                            </div>

                            <h2 className="text-base font-semibold text-gray-600 mb-3">Материалы курса</h2>

                            {manuals.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400 text-sm">
                                    К этому курсу ещё не добавлены материалы
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {manuals.map((manual, index) => {
                                        const cfg = TYPE_CONFIG[manual.type];
                                        const TypeIcon = cfg.icon;
                                        return (
                                            <div key={manual.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                                <div className="p-4 flex items-center gap-4 border-b border-gray-100">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-semibold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <img src={manual.icon} alt={manual.title}
                                                         className="w-10 h-10 object-contain flex-shrink-0"/>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-gray-800">{manual.title}</span>
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                                                                <TypeIcon size={11}/>{cfg.label}
                                                            </span>
                                                        </div>
                                                        {manual.description && (
                                                            <p className="text-sm text-gray-400 mt-0.5">{manual.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    {manual.type === 'text' && manual.content ? (
                                                        <div className="text-sm text-gray-700 leading-relaxed"
                                                             dangerouslySetInnerHTML={{__html: manual.content}}/>
                                                    ) : manual.type === 'video' && manual.content ? (
                                                        <video src={manual.content} controls
                                                               className="w-full rounded-xl bg-black max-h-96"/>
                                                    ) : manual.type === 'audio' && manual.content ? (
                                                        <audio src={manual.content} controls className="w-full"/>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">Содержимое не добавлено</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {trainers.length > 0 && (
                                <div className="mt-6 flex flex-col gap-3">
                                    {trainers.map(trainer => {
                                        const completed = completedTrainers.has(trainer.id);
                                        return (
                                            <div key={trainer.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        {completed
                                                            ? <CheckCircle size={22} className="text-green-600"/>
                                                            : <BookOpen size={22} className="text-amber-600"/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{trainer.name}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {completed ? 'Тренажёр пройден' : 'Практический тренажёр'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant={completed ? 'outline' : 'primary'}
                                                    onClick={() => setOpenTrainerId(trainer.id)}
                                                >
                                                    {completed ? 'Повторить' : 'Начать'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {courseTest && (
                                <div className={`mt-6 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 ${!allTrainersCompleted ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <ClipboardList size={22} className="text-indigo-600"/>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{courseTest.title}</p>
                                            <p className="text-sm text-gray-400">
                                                {courseTest.time_limit ? `${courseTest.time_limit} мин · ` : ''}
                                                {!allTrainersCompleted ? 'Сначала пройдите тренажёры' : testPassed ? 'Тест пройден' : 'Тест по курсу'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={testPassed ? 'outline' : 'primary'}
                                        onClick={openTestModal}
                                        disabled={!allTrainersCompleted}
                                    >
                                        {testPassed ? 'Повторить' : testAttempted ? 'Пройти повторно' : 'Пройти тест'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            <Modal isOpen={testModalOpen} onClose={closeTestModal} title={courseTest?.title ?? 'Тест'}>
                {testLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">Загрузка вопросов...</div>

                ) : testPhase === 'intro' ? (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                            <p><span className="text-gray-400">Вопросов: </span>{testQuestions.length}</p>
                            {courseTest?.time_limit && (
                                <p><span className="text-gray-400">Время: </span>{courseTest.time_limit} мин</p>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">После начала нельзя изменить уже отвеченный вопрос.</p>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={closeTestModal}>Отмена</Button>
                            <Button onClick={startTest}>Начать тест</Button>
                        </div>
                    </div>

                ) : testPhase === 'test' && testQuestions[currentQ] ? (() => {
                    const q = testQuestions[currentQ];
                    const chosen = selectedAnswers[currentQ];
                    return (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>Вопрос {currentQ + 1} из {testQuestions.length}</span>
                                {timeLeft !== null && (
                                    <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600'}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                )}
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                     style={{width: `${((currentQ + 1) / testQuestions.length) * 100}%`}}/>
                            </div>
                            <p className="font-medium text-gray-800 text-sm leading-relaxed">{q.question}</p>
                            <div className="flex flex-col gap-2">
                                {q.options.map((opt, oi) => {
                                    let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ';
                                    if (!chosen) {
                                        cls += 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 cursor-pointer';
                                    } else if (opt === chosen) {
                                        cls += 'border-indigo-400 bg-indigo-50 text-indigo-800 font-medium';
                                    } else {
                                        cls += 'border-gray-100 text-gray-400';
                                    }
                                    return (
                                        <button key={oi} className={cls} onClick={() => selectAnswer(opt)}>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {chosen && (
                                <div className="flex justify-end pt-1">
                                    <Button onClick={nextQuestion} loading={submitting}>
                                        {currentQ < testQuestions.length - 1 ? 'Следующий' : 'Завершить'}
                                    </Button>
                                </div>
                            )}
                            {submitError && (
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <p className="text-sm text-red-600">{submitError}</p>
                                    <Button variant="outline" onClick={finishTest} loading={submitting}>Попробовать снова</Button>
                                </div>
                            )}
                        </div>
                    );
                })() : testPhase === 'result' && testResult ? (
                    <div className="flex flex-col gap-4">
                        <div className={`rounded-2xl p-5 text-center ${
                            testResult.correct === testResult.total ? 'bg-green-50' :
                                testResult.correct >= testResult.total * 0.7 ? 'bg-indigo-50' : 'bg-amber-50'
                        }`}>
                            <p className="text-3xl font-bold text-gray-800">{testResult.correct} / {testResult.total}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {testResult.correct === testResult.total ? '🎉 Отлично! Все ответы верны' :
                                    testResult.correct >= testResult.total * 0.7 ? '👍 Хороший результат' :
                                        '📚 Стоит повторить материал'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                            {testQuestions.map((q, i) => {
                                const r = testResult.results.find(r => r.question_id === q.id);
                                const correct = r?.correct === true;
                                const userAnswer = selectedAnswers[i];
                                return (
                                    <div key={i} className={`rounded-xl p-3 text-sm ${correct ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex items-start gap-2">
                                            {correct
                                                ? <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5"/>
                                                : <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>}
                                            <div>
                                                <p className="text-gray-700 font-medium">{q.question}</p>
                                                {!correct && userAnswer && (
                                                    <p className="text-red-600 mt-0.5">Ваш ответ: {userAnswer}</p>
                                                )}
                                                {!correct && !userAnswer && (
                                                    <p className="text-red-600 mt-0.5">Нет ответа</p>
                                                )}
                                                {!correct && r?.correct_answer && (
                                                    <p className="text-green-700 mt-0.5">Верно: {r.correct_answer}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={closeTestModal}>Закрыть</Button>
                            <Button onClick={openTestModal}>Пройти заново</Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {openTrainerId !== null && (() => {
                const trainer = trainers.find(t => t.id === openTrainerId);
                if (!trainer) return null;
                const Component = TRAINER_COMPONENTS[trainer.component];
                return (
                    <Modal
                        isOpen={true}
                        onClose={() => setOpenTrainerId(null)}
                        title={trainer.name}
                        className="max-w-2xl"
                    >
                        {Component && (
                            <Component onComplete={() => handleTrainerComplete(trainer.id)}/>
                        )}
                    </Modal>
                );
            })()}
        </div>
    );
}