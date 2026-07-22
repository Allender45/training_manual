'use client';

import { useState } from "react";
import Button from "@/components/Button/Button";
import {Checkbox, Select} from "@/components";
import PricingCriteriaDetails from "@/components/trainers/PricingCriteriaDetails/PricingCriteriaDetails";

export interface PricingQuizTrainerProps {
    onComplete?: () => void;
}

type PricingQuestion = {
    id: number;
    description: string;
    task: string;
    audio1: string;
    audio2: string;
    workerPrice: number;
    correctPriceForClient: number;
    correctWorkersNumber: number;
    correctTransportSize: string;
    successMsg: string;
    errorMsg: string;
};

const questions: PricingQuestion[] = [
    // {
    //     id: 1,
    //     description: "Клиенту нужно поднять шкаф. Да, просто поднять шкаф.",
    //     task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
    //     audio1: "/records/trainers/prising/2-1.mp3",
    //     audio2: "/records/trainers/prising/2-2.mp3",
    //     workerPrice: 550,
    //     correctPriceForClient: 475,
    //     correctWorkersNumber: 2,
    //     correctTransportSize: '',
    //     successMsg: "Всё верно, отлично. Прослушай полный разговор.",
    //     errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    // },
    // {
    //     id: 2,
    //     description: "Клиенту нужны разнорабочие для работы с измельчителем веток.",
    //     task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
    //     audio1: "/records/trainers/prising/1-1.mp3",
    //     audio2: "/records/trainers/prising/1-2.mp3",
    //     workerPrice: 400,
    //     correctPriceForClient: 475,
    //     correctWorkersNumber: 2,
    //     correctTransportSize: '',
    //     successMsg: "Всё верно, отлично. Прослушай полный разговор.",
    //     errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    // },
    // {
    //     id: 3,
    //     description: "Погрузка личных вещей из квартиры и гаража.",
    //     task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
    //     audio1: "/records/trainers/prising/3-1.mp3",
    //     audio2: "/records/trainers/prising/3-2.mp3",
    //     workerPrice: 500,
    //     correctPriceForClient: 500,
    //     correctWorkersNumber: 1,
    //     correctTransportSize: '',
    //     successMsg: "Всё верно, отлично. Прослушай полный разговор.",
    //     errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    // },
    // {
    //     id: 4,
    //     description: "Перенос плит керамогранита 10-15кг 150шт. Спуск с второго этажа.",
    //     task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
    //     audio1: "/records/trainers/prising/4-1.mp3",
    //     audio2: "/records/trainers/prising/4-2.mp3",
    //     workerPrice: 500,
    //     correctPriceForClient: 575,
    //     correctWorkersNumber: 1,
    //     correctTransportSize: '',
    //     successMsg: "Всё верно, отлично. Прослушай полный разговор.",
    //     errorMsg: "Неверно. Посмотри критерии поднятия цен.",
    // },
    {
        id: 1,
        description: "Клиенту нужно поднять стиральную машину из автомобиля на 4 этаж.",
        task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
        audio1: "/records/trainers/prising/5-1.mp3",
        audio2: "/records/trainers/prising/5-2.mp3",
        workerPrice: 550,
        correctPriceForClient: 550,
        correctWorkersNumber: 2,
        correctTransportSize: '',
        successMsg: "Всё верно, отлично. Прослушай полный разговор.",
        errorMsg: "Неверно. Где-то ошибка. Проверь всё ещё раз. Если совсем не получается, попроси помощи наставника.",
    },
    {
        id: 2,
        description: "Клиенту нужно вынести унитаз и раковину из подъезда. 3 этаж, есть лифт.",
        task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
        audio1: "/records/trainers/prising/6-1.mp3",
        audio2: "/records/trainers/prising/6-2.mp3",
        workerPrice: 450,
        correctPriceForClient: 450,
        correctWorkersNumber: 1,
        correctTransportSize: '',
        successMsg: "Всё верно, отлично. Прослушай полный разговор.",
        errorMsg: "Неверно. Где-то ошибка. Проверь всё ещё раз. Если совсем не получается, попроси помощи наставника.",
    },
    {
        id: 3,
        description: "Клиенту нужно разобрать обеденный стол и погрузить его в машину.",
        task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
        audio1: "/records/trainers/prising/7-1.mp3",
        audio2: "/records/trainers/prising/7-2.mp3",
        workerPrice: 550,
        correctPriceForClient: 625,
        correctWorkersNumber: 1,
        correctTransportSize: '',
        successMsg: "Всё верно, отлично. Прослушай полный разговор.",
        errorMsg: "Неверно. Где-то ошибка. Проверь всё ещё раз. Если совсем не получается, попроси помощи наставника.",
    },
    {
        id: 4,
        description: "Клиенту нужно поднять 42 доски на 11 этаж по лестнице.",
        task: "Нужно указать стоимость человеко-часа для клиента, количество рабочих и транспорт, если нужен.",
        audio1: "/records/trainers/prising/8-1.mp3",
        audio2: "/records/trainers/prising/8-2.mp3",
        workerPrice: 500,
        correctPriceForClient: 650,
        correctWorkersNumber: 3,
        correctTransportSize: '',
        successMsg: "Всё верно, отлично. Прослушай полный разговор.",
        errorMsg: "Неверно. Где-то ошибка. Проверь всё ещё раз. Если совсем не получается, попроси помощи наставника.",
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

            <div className="text-sm text-gray-800">
                <p><b>Описание обращения:</b> {question.description}</p>
                <span className="font-medium"><b>Задача:</b> </span>{question.task}
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500">Запись звонка</span>
                <audio key={`audio1-${currentQ}`} controls src={question.audio1} className="w-full" />
            </div>

            <PricingCriteriaDetails />

            {phase !== 'correct' && (
                <div className="flex flex-col gap-3">
                    {phase === 'wrong' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                            ❌ {question.errorMsg}
                        </div>
                    )}
                    <div>Базовая ставка рабочего: {question.workerPrice}₽</div>
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