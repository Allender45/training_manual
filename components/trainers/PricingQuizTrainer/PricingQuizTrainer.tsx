'use client';

import { useState } from "react";
import Button from "@/components/Button/Button";

export interface PricingQuizTrainerProps {
    onComplete?: () => void;
}

type PricingQuestion = {
    id: number;
    description: string;
    task: string;
    audio1: string;
    audio2: string;
    correctAnswerLoaders: number;
    correctAnswerTransport: number;
    successMsg: string;
    errorMsg: string;
};

const questions: PricingQuestion[] = [
    {
        id: 1,
        description: "Клиент просит помочь перевезти линолеум. Стоимость 1 часа грузчика в Перми на момент звонка - 500₽. Газели - 1000₽.",
        task: "Указать общую цену за работу.",
        audio1: "/records/trainers/prising/1-1.mp3",
        audio2: "/records/trainers/prising/1-2.mp3",
        correctAnswerLoaders: 3000,
        correctAnswerTransport: 2000,
        successMsg: "Всё верно, отлично. Прослушай продолжение разговора.",
        errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    },
];

function PricingQuiz({ onComplete }: { onComplete?: () => void }) {
    const [currentQ, setCurrentQ] = useState(0);
    const [inputLoaders, setInputLoaders] = useState('');
    const [inputTransport, setInputTransport] = useState('');
    const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering');
    const [finished, setFinished] = useState(false);

    const question = questions[currentQ];

    function handleSubmit() {
        const loadersOk = parseInt(inputLoaders, 10) === question.correctAnswerLoaders;
        const transportOk = parseInt(inputTransport, 10) === question.correctAnswerTransport;
        if (loadersOk && transportOk) {
            setPhase('correct');
        } else {
            setPhase('wrong');
        }
    }

    function handleNext() {
        if (currentQ + 1 < questions.length) {
            setCurrentQ(prev => prev + 1);
            setInputLoaders('');
            setInputTransport('');
            setPhase('answering');
        } else {
            setFinished(true);
            onComplete?.();
        }
    }

    function handleReset() {
        setCurrentQ(0);
        setInputLoaders('');
        setInputTransport('');
        setPhase('answering');
        setFinished(false);
    }

    if (finished) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                <p className="text-2xl font-bold text-green-600">🎉 Тест завершён!</p>
                <Button onClick={handleReset} variant="outline">Пройти снова</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {currentQ + 1} / {questions.length}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                {question.description}
            </div>

            <details className="rounded-xl border border-gray-200 overflow-hidden">
                <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition-colors [list-style:none] flex items-center justify-between">
                    <span>📋 Критерии изменения цены</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 transition-transform details-open:rotate-180"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <div className="px-4 pb-4 pt-2 text-sm text-gray-600 flex flex-col gap-4 border-t border-gray-100 max-h-[300px] overflow-y-auto">
                    <div>
                        <p className="font-semibold text-gray-700 mb-2">Критерии для поднятия цены грузчиков:</p>
                        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                            <li>Стройматериалы (от 20 кг/ед): +75 ₽/час к стартовой цене</li>
                            <li>Подъём по лестнице выше 3 этажа: +75 ₽/час к стартовой цене</li>
                            <li>Подъём по лестнице выше 6 этажа: +150 ₽/час к стартовой цене</li>
                            <li>Грязная работа: +75 ₽/час к стартовой цене</li>
                            <li>Сборка/разборка: +75–150 ₽ в зависимости от сложности (либо сдельная оплата)</li>
                            <li>Вечернее время после 19:00: +75 ₽/час к стартовой цене</li>
                            <li>Такелажные работы: +75–150 ₽/час в зависимости от сложности (либо сдельная оплата)</li>
                            <li>Работа за пределами черты города: +75 ₽/час к стартовой цене</li>
                            <li>Если время работы не превысит 15 минут: −75 ₽ от стартовой цены</li>
                            <li>Работа на полный день: −75–150 ₽ от стартовой цены</li>
                        </ol>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 mb-2">Критерии для поднятия цены на услуги транспорта (газели):</p>
                        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                            <li>Вечернее время после 18:00: +100–200 ₽/час</li>
                            <li>Погодные условия, мешающие работе транспорта (снегопад, град, ливни, сильная жара): +100–200 ₽/час</li>
                            <li>Заезды на дополнительные точки: +100 ₽ за адрес</li>
                            <li>Удалённость адресов друг от друга (с правого берега на левый и т.д.): +100–200 ₽/час</li>
                            <li>Выезд за город: 50 ₽/км (оплачивается только в одну сторону)</li>
                            <li>Газель без грузчиков по городу: продаём на 200–300 ₽ выше стоимости ЦРМ</li>
                        </ol>
                    </div>
                </div>
            </details>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500">Запись звонка</span>
                <audio key={`audio1-${currentQ}`} controls src={question.audio1} className="w-full" />
            </div>

            <div className="text-sm text-gray-800">
                <span className="font-medium">Задача: </span>{question.task}
            </div>

            {phase !== 'correct' && (
                <div className="flex flex-col gap-3">
                    {phase === 'wrong' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                            ❌ {question.errorMsg}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-medium text-gray-500">Стоимость грузчиков (₽)</label>
                            <input
                                type="number"
                                value={inputLoaders}
                                onChange={e => setInputLoaders(e.target.value)}
                                placeholder="Введите сумму"
                                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                    phase === 'wrong' && parseInt(inputLoaders, 10) !== question.correctAnswerLoaders
                                        ? 'border-red-300 focus:ring-red-400'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-medium text-gray-500">Стоимость транспорта (₽)</label>
                            <input
                                type="number"
                                value={inputTransport}
                                onChange={e => setInputTransport(e.target.value)}
                                placeholder="Введите сумму"
                                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                    phase === 'wrong' && parseInt(inputTransport, 10) !== question.correctAnswerTransport
                                        ? 'border-red-300 focus:ring-red-400'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={!inputLoaders || !inputTransport}>Ответить</Button>
                    </div>
                </div>
            )}

            {phase === 'correct' && (
                <div className="flex flex-col gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                        ✅ {question.successMsg}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-gray-500">Продолжение разговора</span>
                        <audio key={`audio2-${currentQ}`} controls src={question.audio2} className="w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleNext}>
                            {currentQ + 1 < questions.length ? 'Следующий вопрос →' : 'Завершить тест'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PricingQuizTrainer({ onComplete }: PricingQuizTrainerProps) {
    return <PricingQuiz onComplete={onComplete} />;
}