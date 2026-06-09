'use client';

import { useState } from "react";
import Button from "@/components/Button/Button";
import {Checkbox, Select} from "@/components";

export interface PricingQuizTrainerProps {
    onComplete?: () => void;
}

type PricingQuestion = {
    id: number;
    description: string;
    task: string;
    audio1: string;
    audio2: string;
    correctPriceForClient: number;
    correctWorkersNumber: number;
    correctTransportSize: string;
    successMsg: string;
    errorMsg: string;
};

const questions: PricingQuestion[] = [
    {
        id: 1,
        description: "Клиенту нужно поднять шкаф. Да, просто поднять шкаф. Минимальная стоимость 1 часа рабочего в Альметьевске на момент звонка - 550₽.",
        task: "Нужно указать стоимость человеко-часа для клиента, для рабочего и количество рабочих.",
        audio1: "/records/trainers/prising/2-1.mp3",
        audio2: "/records/trainers/prising/2-2.mp3",
        correctPriceForClient: 475,
        correctWorkersNumber: 2,
        correctTransportSize: '',
        successMsg: "Всё верно, отлично. Прослушай полный разговор.",
        errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    },
];

function PricingQuiz({ onComplete }: { onComplete?: () => void }) {
    const [currentQ, setCurrentQ] = useState(0);
    const [priceForClient, setPriceForClient] = useState('');
    const [workerPayment, setWorkerPayment] = useState('');
    const [workersNumber, setWorkersNumber] = useState('');
    const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering');
    const [finished, setFinished] = useState(false);
    const [needsTransport, setNeedsTransport] = useState(false);
    const [transportType, setTransportType] = useState('');
    const [transportParam, setTransportParam] = useState('');
    const [transportSize, setTransportSize] = useState('');

    const question = questions[currentQ];

    function handleSubmit() {
        const clientOk  = parseInt(priceForClient, 10) === question.correctPriceForClient;
        const numbersOk = parseInt(workersNumber,  10) === question.correctWorkersNumber;
        const transportOk = !question.correctTransportSize || transportSize === question.correctTransportSize;
        if (clientOk && numbersOk && transportOk) {
            setPhase('correct');
        } else {
            setPhase('wrong');
        }
    }

    function handleNext() {
        if (currentQ + 1 < questions.length) {
            setCurrentQ(prev => prev + 1);
            setPriceForClient('');
            setWorkerPayment('');
            setWorkersNumber('');
            setPhase('answering');
        } else {
            setFinished(true);
            onComplete?.();
        }
    }

    function handleReset() {
        setCurrentQ(0);
        setPriceForClient('');
        setWorkerPayment('');
        setWorkersNumber('');
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
                            <label className="text-xs font-medium text-gray-500">Цена человеко часа</label>
                            <input
                                type="number"
                                value={priceForClient}
                                onChange={e => {
                                    setPriceForClient(e.target.value);
                                    const val = parseInt(e.target.value || '0', 10);
                                    setWorkerPayment(val > 0 ? String(Math.round(val * 0.7)) : '');
                                }}
                                placeholder="Введите сумму ₽"
                                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                    phase === 'wrong' && parseInt(priceForClient, 10) !== question.correctPriceForClient
                                        ? 'border-red-300 focus:ring-red-400'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-medium text-gray-500">Оплата исполнителю</label>
                            <input
                                type="number"
                                value={workerPayment}
                                placeholder="Введите сумму ₽"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-medium text-gray-500">Кол-во человек</label>
                            <input
                                type="number"
                                value={workersNumber}
                                onChange={e => setWorkersNumber(e.target.value)}
                                className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                    phase === 'wrong' && parseInt(workersNumber, 10) !== question.correctWorkersNumber
                                        ? 'border-red-300 focus:ring-red-400'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                    </div>

                    <Checkbox
                        label="Нужен транспорт/техника"
                        name="needsTransport"
                        checked={needsTransport}
                        onChange={e => setNeedsTransport(e.target.checked)}
                    />

                    {needsTransport && (
                        <div className="flex gap-3 flex-wrap">
                            <Select
                                label="Тип техники"
                                name="transportType"
                                value={transportType}
                                onChange={e => {
                                    setTransportType(e.target.value);
                                    setTransportParam('');
                                    setTransportSize('');
                                }}
                                placeholder="Выберите..."
                                options={[
                                    { value: 'gazel', label: 'Газель' },
                                    { value: 'truck', label: 'Грузовой автомобиль' },
                                    { value: 'crane', label: 'Автовышка' },
                                    { value: 'tank',  label: 'Автоцистерна' },
                                ]}
                                className="flex-1"
                            />

                            <Select
                                label="Параметр"
                                name="transportParam"
                                value={transportParam}
                                onChange={e => {
                                    setTransportParam(e.target.value);
                                    setTransportSize('');
                                }}
                                placeholder="Выберите..."
                                options={[
                                    { value: 'length', label: 'Длина газели' },
                                ]}
                                className="flex-1"
                                disabled={transportType !== 'gazel'}
                            />

                            <Select
                                label="Размер"
                                name="transportSize"
                                value={transportSize}
                                onChange={e => setTransportSize(e.target.value)}
                                placeholder="Выберите..."
                                options={[
                                    { value: '3',   label: '3 м' },
                                    { value: '4.2', label: '4,2 м' },
                                    { value: '5',   label: '5 м' },
                                ]}
                                className="flex-1"
                                disabled={transportParam !== 'length'}
                            />
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={!priceForClient || !workersNumber}>Ответить</Button>
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