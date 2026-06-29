'use client';

import { useState } from "react";

export interface CaseQuizTrainerProps {
    onComplete?: () => void;
}

const questions = [
    {
        title: 'Кейс 1: Повышение на 1 пункт',
        situation: 'Клиент просит скидку 500₽. Как ответить?',
        options: ['Дать скидку', 'Сказать, что цена фиксированная', 'Дать скидку при необходимости'],
        correct: 'Дать скидку при необходимости',
        successMsg: '✅ Правильно!\nЛучше предложить бонус, чем просто скидку — сохраняешь маржу.',
        errorMsg: '❌ Неверно\nЛучше предложить бонус, чем просто скидку — сохраняешь маржу.',
    },
    {
        title: 'Кейс 2: Повышение на 2 пункта',
        situation: 'Срочная заявка через 2 часа. На сколько повысить цену?',
        options: ['+0%', '+50%', '+20%'],
        correct: '+20%',
        successMsg: '✅ Правильно!\nСрочность = повышение на 20-30%.',
        errorMsg: '❌ Неверно\nСрочность = повышение на 20-30%.',
    },
    {
        title: 'Кейс 3: Понижение на 3 пункта',
        situation: 'Долгая заявка без нагрузки. Как поступить?',
        options: ['Не брать заявку', 'Оставить цену без изменений', 'Сделать скидку 15%'],
        correct: 'Сделать скидку 15%',
        successMsg: '✅ Правильно!\nЛучше сделать небольшую скидку, чем терять заявку.',
        errorMsg: '❌ Неверно\nЛучше сделать небольшую скидку, чем терять заявку.',
    },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function CaseQuizTrainer({ onComplete }: CaseQuizTrainerProps) {
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [finished, setFinished] = useState(false);
    const [shuffled, setShuffled] = useState(() =>
        shuffle(questions).map(q => ({ ...q, options: shuffle(q.options) }))
    );

    const question = shuffled[currentQ];
    const isCorrect = selected === question.correct;

    const handleSelect = (option: string) => {
        if (selected) return;
        setSelected(option);
        if (option === question.correct) {
            setTimeout(() => {
                if (currentQ + 1 < questions.length) {
                    setCurrentQ(currentQ + 1);
                    setSelected(null);
                } else {
                    setFinished(true);
                    onComplete?.();
                }
            }, 1500);
        }
    };

    const handleReset = () => {
        setShuffled(shuffle(questions).map(q => ({ ...q, options: shuffle(q.options) })));
        setCurrentQ(0);
        setSelected(null);
        setFinished(false);
    };

    if (finished) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <p className="text-2xl font-bold text-green-600">🎉 Тест завершён!</p>
                <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Пройти снова
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {currentQ + 1} / {shuffled.length}
            </div>
            <h2 className="text-lg font-bold text-gray-800">{question.title}</h2>
            <p className="text-gray-600">{question.situation}</p>
            <div className="flex flex-col gap-2 mt-2">
                {question.options.map((option) => {
                    let cls = 'px-4 py-3 rounded-xl border text-left transition-all font-medium ';
                    if (selected) {
                        if (option === question.correct) cls += 'bg-green-50 border-green-500 text-green-700 cursor-default';
                        else if (option === selected) cls += 'bg-red-50 border-red-400 text-red-600 cursor-default';
                        else cls += 'bg-white border-gray-200 text-gray-400 cursor-default';
                    } else {
                        cls += 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
                    }
                    return (
                        <button key={option} className={cls} onClick={() => handleSelect(option)}>
                            {option}
                        </button>
                    );
                })}
            </div>
            {selected && (
                <div className={`mt-2 p-3 rounded-xl text-sm whitespace-pre-line ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {isCorrect ? question.successMsg : question.errorMsg}
                </div>
            )}
            {selected && !isCorrect && (
                <button
                    onClick={() => setSelected(null)}
                    className="mt-1 text-sm text-blue-600 hover:underline self-start"
                >
                    Попробовать снова
                </button>
            )}
        </div>
    );
}