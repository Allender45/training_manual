'use client';

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { Checkbox, Select } from '@/components';

export interface FullOrderCreateProps {
    onComplete?: () => void;
}

type PaymentType = 'cash' | 'card' | 'invoice';

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

type Review = {
    passed: boolean;
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
    answers: string[];
};

const PAYMENT_OPTIONS: { value: PaymentType; label: string }[] = [
    { value: 'cash',    label: 'Наличные' },
    { value: 'card',    label: 'На карту' },
    { value: 'invoice', label: 'Безнал'   },
];

const CORRECT_FORM = {
    correctPriceForClient: 575,
    correctWorkersNumber: 2,
    correctTransportSize: '3',
} as const;

const TRANSCRIPT = `
Спикер 1: 
00:00:01 - Здравствуйте. Пропущенный был от вас. Чем могу помочь?
Спикер 2: 
00:00:05 - Здравствуйте. У вас грузчики с Газелью есть?
Спикер 1: 
00:00:08 - Да, есть что-то надо сделать.
Спикер 2: 
00:00:10 - Надо перевезти с Конева в черте города кладбища Судима, там есть мебель в этом диван и шкаф в разобранном виде уже всё.
Спикер 1: 
00:00:27 - Так, хорошо. А по какому городу? Мы просто по всей области работаем.
Спикер 2: 
00:00:32 - Вологда.
Спикер 1: 
00:00:35 - Да-да-да, по-по всей области говорю же, поэтому уточняю. Откуда, куда? Ещё раз подскажите, пожалуйста, чтобы я по стоимости точно сказал.
Спикер 2: 
00:00:44 - С Конёва, Конёва, улица Конёва, садим около кладбища. Маршала, которое-да-да, Маршал Конев.
Спикер 1: 
00:00:54 - Ну. Всё. До какого кладбища?
Спикер 2: 
00:00:57 - А вы у пешеходского кольца, там пешеходское кладбище.
Спикер 1: 
00:01:00 - А, я понял, на пешеходском кольце. Так. По стоимости сейчас сориентирую вас. Вам с грузчиками надо будет?
Спикер 2: 
00:01:10 - Ну да, надо было хоть.
Спикер 1: 
00:01:12 - Да, ага. С какого этажа надо будет спустить и на какой этаж поднять там?
Спикер 2: 
00:01:18 - Там на этаж не надо, там дом. А тут с восьмого этажа спустись.
Спикер 1: 
00:01:23 - По лифту.
Спикер 2: 
00:01:25 - Да, есть, есть. Только не грузовое пассажирское.
Спикер 1: 
00:01:27 - Ага. Так, ладно, сейчас подскажу.
Спикер 2: 
00:01:32 - Ага, грузчику. Сначала грузчики приедут, а потом...
Спикер 1: 
00:01:37 - Ну, я думаю, можем машину на минут 20 попозже отправить, они пока спустят, там как раз. Ну, они за час уложатся, всё сделают.
Спикер 2: 
00:01:46 - Да хорошо, если уложишься.
Спикер 1: 
00:01:48 - А когда надо?
Спикер 2: 
00:01:50 - А сегодня был.
Спикер 1: 
00:01:51 - Сегодня часов в 15:00 удобно будет?
Спикер 2: 
00:01:55 - Удобно. Я думаю, если дождь сильно летний мой.
Спикер 1: 
00:01:59 - А какой дом на Конева?
Спикер 2: 
00:02:01 - Двадцать два.
Спикер 1: 
00:02:02 - Двадцать второй. А там на кладбище куда конкретней?
Спикер 2: 
00:02:07 - Там не доезжая кладбище направо. Тут есть этот СНТ.
Спикер 1: 
00:02:19 - Так, хорошо. Ну, водителю там поточнее скажете?
Спикер 2: 
00:02:22 - Ну да, так я буду с ними.
Спикер 1: 
00:02:24 - Всё, ладно. Ну там у водителя, если что, места-то в машине не будет, грузчики с ним поедут, вы на своей?
Спикер 2: 
00:02:30 - У меня есть машина есть.
Спикер 1: 
00:02:31 - А, ну всё, ладненько. А как обращаться к вам могу?
Спикер 2: 
00:02:34 - Юрий.
Спикер 1: 
00:02:35 - Юрий, меня Никита зовут. Очень приятно. А по окончании работы переводом получится рассчитаться?
Спикер 2: 
00:02:42 - А не, наличка у меня.
Спикер 1: 
00:02:44 - Наличкой. Хорошо, тогда вся оплата через водителя будет. К трём часам подъедут. Хорошо. Всё, договорились.
Спикер 2: 
00:02:52 - Угу.
`;

const INIT_ORDER: OrderForm = { city: '', street: '', apartment: '', dateTime: '', nearestTime: false, payment: 'cash', workDescription: '' };
const INIT_PRICING: PricingForm = { priceForClient: '', workerPayment: '', workersNumber: '', needsTransport: false, transportType: '', transportParam: '', transportSize: '' };

export default function FullOrderCreate({ onComplete }: FullOrderCreateProps) {
    const [order, setOrder] = useState<OrderForm>(INIT_ORDER);
    const [pricing, setPricing] = useState<PricingForm>(INIT_PRICING);
    const [reviewing, setReviewing] = useState(false);
    const [review, setReview] = useState<Review | null>(null);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [pricingError, setPricingError] = useState(false);
    const [priceForClient, setPriceForClient] = useState('');
    const [workerPayment, setWorkerPayment] = useState('');

    function handleOrderChange(field: keyof OrderForm, value: string) {
        setOrder(prev => ({ ...prev, [field]: value }));
    }

    function handlePricingChange<K extends keyof PricingForm>(field: K, value: PricingForm[K]) {
        setPricing(prev => ({ ...prev, [field]: value }));
    }

    const orderValid = !!(order.city.trim() && order.street.trim() && order.workDescription.trim() && (order.nearestTime || order.dateTime));
    const pricingValid = !!(pricing.priceForClient &&  pricing.workersNumber);
    const isValid = orderValid && pricingValid;

    async function handleSubmit() {
        const clientOk    = parseInt(pricing.priceForClient, 10) === CORRECT_FORM.correctPriceForClient;
        const numbersOk   = parseInt(pricing.workersNumber,  10) === CORRECT_FORM.correctWorkersNumber;
        const transportOk = !CORRECT_FORM.correctTransportSize || pricing.transportSize === CORRECT_FORM.correctTransportSize;

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
                company: 'Гриффиндор',
                city: order.city,
                client: 'Клиент',
                address: order.street,
                apartment: order.apartment || '',
                dateTime: order.dateTime,
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
                body: JSON.stringify({ form: formData, transcript: TRANSCRIPT }),
            });
            const data = await res.json();
            if (!res.ok) {
                setReviewError(data.error ?? 'Ошибка сервера');
                return;
            }
            setReview(data);
            if (data.passed) onComplete?.();
        } catch {
            setReviewError('Ошибка соединения с сервером');
        } finally {
            setReviewing(false);
        }
    }

    function handleReset() {
        setOrder(INIT_ORDER);
        setPricing(INIT_PRICING);
        setReview(null);
        setReviewError(null);
        setPricingError(false);
    }

    return (
        <div className="flex flex-col gap-4">
            <audio controls src="/records/trainers/full_order_create/1-1.mp3" className="w-full" />

            <h3 className="text-base font-semibold text-gray-800">Новая заявка</h3>

            <div>
                <label className="block text-gray-500 text-sm mb-2">Компания</label>
                <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 select-none">
                    Гриффиндор
                </div>
            </div>

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
                    Клиент
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

            {pricingError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    ❌ Неверно указаны данные ценообразования. Проверьте цену и количество человек.
                </div>
            )}

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

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
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
                                pricingError && parseInt(pricing.priceForClient, 10) !== CORRECT_FORM.correctPriceForClient
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
                                pricingError && parseInt(pricing.workersNumber, 10) !== CORRECT_FORM.correctWorkersNumber
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

            <div className="flex justify-end pt-2">
                <Button onClick={handleSubmit} disabled={!isValid || reviewing}>
                    {reviewing ? 'Проверяю...' : 'Оформить заявку'}
                </Button>
            </div>

            {reviewError && (
                <p className="text-red-500 text-sm">{reviewError}</p>
            )}

            {review && (
                <div className="space-y-3 text-sm">
                    {review.strong_points.length > 0 && (
                        <div>
                            <p className="font-semibold text-green-700 mb-1">✓ Сильные стороны</p>
                            <ul className="space-y-1">
                                {review.strong_points.map((p, i) => (
                                    <li key={i} className="bg-green-50 rounded-lg p-2 text-gray-700">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {review.weak_points.length > 0 && (
                        <div>
                            <p className="font-semibold text-red-700 mb-1">✗ Слабые стороны</p>
                            <ul className="space-y-1">
                                {review.weak_points.map((p, i) => (
                                    <li key={i} className="bg-red-50 rounded-lg p-2 text-gray-700">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {review.recommendations.length > 0 && (
                        <div>
                            <p className="font-semibold text-blue-700 mb-1">💡 Рекомендации</p>
                            <ul className="space-y-1">
                                {review.recommendations.map((p, i) => (
                                    <li key={i} className="bg-blue-50 rounded-lg p-2 text-gray-700">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        {review.passed ? (
                            <Button onClick={() => onComplete?.()}>Следующий вопрос →</Button>
                        ) : (
                            <Button onClick={handleReset}>Заполнить повторно</Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}