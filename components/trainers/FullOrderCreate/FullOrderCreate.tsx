'use client';

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { Checkbox, Select } from '@/components';
import PricingCriteriaDetails from '@/components/trainers/PricingCriteriaDetails/PricingCriteriaDetails';
import ReviewResult from '@/components/ReviewResult/ReviewResult';
import { PaymentType, Review, PAYMENT_OPTIONS } from '@/components/trainers/review';

export interface FullOrderCreateProps {
    onComplete?: () => void;
}

type OrderForm = {
    city: string;
    street: string;
    apartment: string;
    dateTime: string;
    nearestTime: boolean;
    payment: PaymentType;
    workDescription: string;
};

type PricingForm = {
    priceForClient: string;
    workerPayment: string;
    workersNumber: string;
    needsTransport: boolean;
    transportType: string;
    transportParam: string;
    transportSize: string;
};

type CaseData = {
    id: number;
    audioSrc: string;
    company: string;
    client: string;
    city: string;
    correctCity: string;
    address: string;
    transcript: string;
    workerPrice: number;
    correctPriceForClient: number;
    payment: PaymentType;
    time: string;
    correctWorkersNumber: number;
    correctTransportSize: string;
};

const CASES: CaseData[] = [
    {
        id: 1,
        audioSrc: '/records/trainers/full_order_create/1-1.mp3',
        company: 'Гриффиндор',
        client: 'Др. Франкенштейн',
        city: '',
        correctCity: 'Вологда',
        address: 'Маршала Конева 22',
        transcript: `Работы: Перевезти мебель, диван и шкаф. Спустить с 8 этажа.`,
        workerPrice: 500,
        correctPriceForClient: 575,
        payment: 'cash',
        time: '15:00',
        correctWorkersNumber: 2,
        correctTransportSize: '3',
    },
    {
        id: 2,
        audioSrc: '/records/trainers/full_order_create/2-1.mp3',
        company: 'Пуффинхуй',
        client: 'Хагри',
        city: '',
        correctCity: 'Орск',
        address: 'Шпалорезная 38',
        transcript: `Работы: Разобрать стенку, вынести мусор.`,
        workerPrice: 450,
        correctPriceForClient: 525,
        payment: 'card',
        time: 'сейчас',
        correctWorkersNumber: 1,
        correctTransportSize: '',
    },
    {
        id: 3,
        audioSrc: '/records/trainers/full_order_create/3.mp3',
        company: 'Слизермин',
        client: 'Вовка без морды',
        city: 'Кострома',
        correctCity: 'Кострома',
        address: 'Волжская 12',
        transcript: `Работы: Разгрузить фуру. Коробки по 40 кг.`,
        workerPrice: 400,
        correctPriceForClient: 475,
        payment: 'card',
        time: 'сейчас',
        correctWorkersNumber: 6,
        correctTransportSize: '',
    },
];

const INIT_PRICING: PricingForm = { priceForClient: '', workerPayment: '', workersNumber: '', needsTransport: false, transportType: '', transportParam: '', transportSize: '' };

export default function FullOrderCreate({ onComplete }: FullOrderCreateProps) {
    const [pricing, setPricing] = useState<PricingForm>(INIT_PRICING);
    const [reviewing, setReviewing] = useState(false);
    const [review, setReview] = useState<Review | null>(null);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [pricingError, setPricingError] = useState(false);
    const [priceForClient, setPriceForClient] = useState('');
    const [workerPayment, setWorkerPayment] = useState('');
    const [currentCase, setCurrentCase] = useState(0);
    const caseData = CASES[currentCase];
    const [order, setOrder] = useState<OrderForm>(getInitOrder(CASES[0]));
    const [formError, setFormError] = useState<string | null>(null);

    function getInitOrder(c: CaseData): OrderForm {
        return {
            city: c.city,
            street: '',
            apartment: '',
            dateTime: '',
            nearestTime: false,
            payment: 'cash',
            workDescription: '',
        };
    }

    function handleOrderChange(field: keyof OrderForm, value: string) {
        setOrder(prev => ({ ...prev, [field]: value }));
    }

    function handlePricingChange<K extends keyof PricingForm>(field: K, value: PricingForm[K]) {
        setPricing(prev => ({ ...prev, [field]: value }));
    }

    const orderValid = !!(order.city.trim() && order.street.trim() && order.workDescription.trim() && (order.nearestTime || order.dateTime));
    const pricingValid = !!(pricing.priceForClient &&  pricing.workersNumber);
    const isValid = orderValid && pricingValid;

    function handleNext() {
        if (currentCase + 1 < CASES.length) {
            const nextIdx = currentCase + 1;
            setCurrentCase(nextIdx);
            setOrder(getInitOrder(CASES[nextIdx]));
            setPricing(INIT_PRICING);
            setReview(null);
            setReviewError(null);
            setPricingError(false);
            setFormError(null);
        } else {
            onComplete?.();
        }
    }

    async function handleSubmit() {
        const clientOk    = parseInt(pricing.priceForClient, 10) === caseData.correctPriceForClient;
        const numbersOk   = parseInt(pricing.workersNumber,  10) === caseData.correctWorkersNumber;
        const transportOk = !caseData.correctTransportSize || pricing.transportSize === caseData.correctTransportSize;
        const cityOk    = order.city.trim().toLowerCase() === caseData.correctCity.toLowerCase();
        const addressOk = order.street.trim().toLowerCase() === caseData.address.toLowerCase();
        const paymentOk = order.payment === caseData.payment;
        const timeOk    = caseData.time === 'сейчас'
            ? order.nearestTime
            : order.dateTime.slice(11, 16) === caseData.time;

        if (!cityOk || !addressOk || !paymentOk || !timeOk) {
            setFormError('Неверно заполнены поля заявки. Проверьте город, адрес, вид оплаты и время.');
            return;
        }
        setFormError(null);

        if (!clientOk || !numbersOk || !transportOk) {
            setPricingError(true);
            return;
        }

        setPricingError(false);
        setReviewing(true);
        setReview(null);
        setReviewError(null);
        try {
            const formData = {
                company: caseData.company,
                city: order.city,
                client: caseData.client,
                address: order.street,
                apartment: order.apartment || '',
                dateTime: order.nearestTime ? '' : order.dateTime,
                workDescription: order.workDescription,
                payment: PAYMENT_OPTIONS.find(o => o.value === order.payment)?.label ?? order.payment,
                priceForClient: pricing.priceForClient,
                workerPayment: pricing.workerPayment,
                workersNumber: pricing.workersNumber,
                needsTransport: pricing.needsTransport,
                transportType: pricing.transportType,
                transportSize: pricing.transportSize,
            };

            const res = await fetch('/api/trainers/review-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ form: formData, transcript: caseData.transcript }),
            });
            const data = await res.json();
            if (!res.ok) {
                setReviewError(data.error ?? 'Ошибка сервера');
                return;
            }
            setReview(data);
        } catch {
            setReviewError('Ошибка соединения с сервером');
        } finally {
            setReviewing(false);
        }
    }

    function handleReset() {
        setOrder(getInitOrder(caseData));
        setPricing(INIT_PRICING);
        setReview(null);
        setReviewError(null);
        setPricingError(false);
        setFormError(null);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {currentCase + 1} / {CASES.length}
            </div>

            <audio controls src={caseData.audioSrc} className="w-full" />

            <h3 className="text-base font-semibold text-gray-800">Новая заявка</h3>

            <Input
                label="Город"
                name="city"
                value={order.city}
                onChange={e => handleOrderChange('city', e.target.value)}
                placeholder="Введите город"
                required
            />

            <div>
                <label className="block text-gray-500 text-sm mb-2">Клиент</label>
                <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 select-none">
                    {caseData.client}
                </div>
            </div>

            <Input
                label="Что делать? (Характер работ) ГЛАГОЛ + продолжительность работ!!!"
                name="workDescription"
                value={order.workDescription}
                onChange={e => handleOrderChange('workDescription', e.target.value)}
                placeholder="Например: грузить коробки 8 часов"
                required
                type="textarea"
            />

            <Input
                label="Адрес"
                name="street"
                value={order.street}
                onChange={e => handleOrderChange('street', e.target.value)}
                placeholder="Улица, дом"
                required
            />

            <Input
                label="Точный адрес"
                name="apartment"
                value={order.apartment}
                onChange={e => handleOrderChange('apartment', e.target.value)}
                placeholder="Квартира / офис"
            />

            <Input
                label="Дата и время"
                name="dateTime"
                type="datetime"
                value={order.dateTime}
                onChange={e => handleOrderChange('dateTime', e.target.value)}
                disabled={order.nearestTime}
                nearestTimeCheckbox={false}
            />

            <Checkbox
                label="В ближайшее время"
                name="nearestTime"
                checked={order.nearestTime}
                onChange={e => setOrder(prev => ({ ...prev, nearestTime: e.target.checked, dateTime: e.target.checked ? '' : prev.dateTime }))}
            />

            <div className="flex flex-col gap-2">
                <label className="block text-gray-500 text-sm">Вид оплаты</label>
                <div className="flex gap-5">
                    {PAYMENT_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="radio"
                                name="payment"
                                value={opt.value}
                                checked={order.payment === opt.value}
                                onChange={() => setOrder(prev => ({ ...prev, payment: opt.value }))}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    ❌ {formError}
                </div>
            )}

            {pricingError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    ❌ Неверно указаны данные ценообразования. Проверьте цену и количество человек.
                </div>
            )}

            <PricingCriteriaDetails />

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div>Базовая ставка рабочего: {caseData.workerPrice}₽</div>
                <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-xs font-medium text-gray-500">Цена человеко-часа</label>
                        <input
                            type="number"
                            value={pricing.priceForClient}
                            onChange={e => {
                                handlePricingChange('priceForClient', e.target.value);
                                setPriceForClient(e.target.value);
                                const val = parseInt(e.target.value || '0', 10);
                                setWorkerPayment(val > 0 ? String(Math.round(val * 0.7)) : '');
                            }}
                            placeholder="Введите сумму ₽"
                            className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                pricingError && parseInt(pricing.priceForClient, 10) !== caseData.correctPriceForClient
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
                            onChange={e => handlePricingChange('workerPayment', e.target.value)}
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
                            value={pricing.workersNumber}
                            onChange={e => handlePricingChange('workersNumber', e.target.value)}
                            placeholder="Введите кол-во"
                            className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:border-transparent transition ${
                                pricingError && parseInt(pricing.workersNumber, 10) !== caseData.correctWorkersNumber
                                    ? 'border-red-300 focus:ring-red-400'
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                    </div>
                </div>

                <Checkbox
                    label="Нужен транспорт/техника"
                    name="needsTransport"
                    checked={pricing.needsTransport}
                    onChange={e => handlePricingChange('needsTransport', e.target.checked)}
                />

                {pricing.needsTransport && (
                    <div className="flex gap-3">
                        <Select
                            label="Тип техники"
                            name="transportType"
                            value={pricing.transportType}
                            onChange={e => handlePricingChange('transportType', e.target.value)}
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
                            value={pricing.transportParam}
                            onChange={e => handlePricingChange('transportParam', e.target.value)}
                            placeholder="Выберите..."
                            options={[
                                { value: 'length', label: 'Длина газели' },
                            ]}
                            className="flex-1"
                            disabled={pricing.transportType !== 'gazel'}
                        />
                        <Select
                            label="Размер"
                            name="transportSize"
                            value={pricing.transportSize}
                            onChange={e => handlePricingChange('transportSize', e.target.value)}
                            placeholder="Выберите..."
                            options={[
                                { value: '3',   label: '3 м' },
                                { value: '4.2', label: '4,2 м' },
                                { value: '5',   label: '5 м' },
                            ]}
                            className="flex-1"
                            disabled={pricing.transportParam !== 'length'}
                        />
                    </div>
                )}
            </div>

            { !review?.passed && (
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSubmit} disabled={!isValid || reviewing}>
                        {reviewing ? 'Проверяю...' : 'Оформить заявку'}
                    </Button>
                </div>
            )}

            {reviewError && (
                <p className="text-red-500 text-sm">{reviewError}</p>
            )}

            {review && (
                <div className="space-y-3 text-sm">
                    <ReviewResult
                        strongPoints={review.strong_points}
                        weakPoints={review.weak_points}
                        recommendations={review.recommendations}
                    />
                    <div className="flex justify-end pt-2">
                        {review.passed ? (
                            <Button onClick={handleNext}>
                                {currentCase + 1 < CASES.length ? 'Следующий кейс →' : 'Завершить →'}
                            </Button>
                        ) : (
                            <Button onClick={handleReset}>Заполнить повторно</Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}