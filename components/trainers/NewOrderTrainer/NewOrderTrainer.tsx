'use client';

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';

export interface NewOrderTrainerProps {
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

const TRANSCRIPT = `Спикер 1:
00:00:00 - Алло. Здравствуйте, пропущенный, ранее был от вас. Чем могу помочь?
Спикер 2:
00:00:06 - Здравствуйте, работяги нужны, город Альметьевск.
Спикер 1:
00:00:10 - Что делать надо?
Спикер 2:
00:00:11 - В дробилку деревья засовывать.
Спикер 1:
00:00:29 -А на какой адрес надо подъехать?
Спикер 2:
00:00:35 - Улица Полевая, дом два.
Спикер 1:
00:00:37 - Полевая 2. Хорошо, по окончании работы сможете рассчитаться на карту?  
Спикер 2:
00:00:37 - Да, конечно.
Спикер 1:
00:00:42 - Всё замечательно. Тогда в конце работы я вам эсэмэской пришлю, куда перевести на месте рассчитываться не нужно будет с рабочими. Они подъедут? Они подъедут ориентировочно в течение часа-полтора, как подъедут, позвонят вам.
Спикер 2:
00:01:00 - Добро.
Спикер 1:
00:01:03 - Всё, договорились, ожидайте тогда.`;

export default function NewOrderTrainer({ onComplete }: NewOrderTrainerProps) {
    const [form, setForm] = useState<OrderForm>({
        city: '',
        street: '',
        apartment: '',
        dateTime: '',
        nearestTime: false,
        payment: 'cash',
        workDescription: '',
    });

    const [reviewing, setReviewing] = useState(false);
    const [review, setReview] = useState<Review | null>(null);
    const [reviewError, setReviewError] = useState<string | null>(null);

    function handleChange(field: keyof OrderForm, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit() {
        setReviewing(true);
        setReview(null);
        setReviewError(null);
        try {
            const formData = {
                company: 'Победители',
                city: form.city,
                client: 'Клиент',
                address: form.street,
                apartment: form.apartment || '',
                dateTime: form.dateTime,
                payment: PAYMENT_OPTIONS.find(o => o.value === form.payment)?.label ?? form.payment,
                workDescription: form.workDescription,
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
        } catch {
            setReviewError('Ошибка соединения с сервером');
        } finally {
            setReviewing(false);
        }
    }

    function handleReset() {
        setForm({ city: '', street: '', apartment: '', dateTime: '', nearestTime: false, payment: 'cash', workDescription: '' });
        setReview(null);
        setReviewError(null);
    }

    const isValid = !!(form.city.trim() && form.street.trim() && form.workDescription.trim() && (form.nearestTime || form.dateTime));

    return (
        <div className="flex flex-col gap-4">
            <audio
                controls
                src="/records/trainers/ansvering_calls/1.mp3"
                className="w-full"
            />

            <h3 className="text-base font-semibold text-gray-800">Новая заявка</h3>

            <Input
                label="Город"
                name="city"
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
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
                value={form.workDescription}
                onChange={e => handleChange('workDescription', e.target.value)}
                placeholder="Например: грузить коробки 8 часов"
                required
                type="textarea"
            />

            <Input
                label="Адрес"
                name="street"
                value={form.street}
                onChange={e => handleChange('street', e.target.value)}
                placeholder="Улица, дом"
                required
            />

            <Input
                label="Точный адрес"
                name="apartment"
                value={form.apartment}
                onChange={e => handleChange('apartment', e.target.value)}
                placeholder="Квартира / офис"
            />

            <Input
                label="Дата и время"
                name="dateTime"
                type="datetime"
                value={form.dateTime}
                onChange={e => handleChange('dateTime', e.target.value)}
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
                                checked={form.payment === opt.value}
                                onChange={() => setForm(prev => ({ ...prev, payment: opt.value }))}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {!review &&
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSubmit} disabled={!isValid || reviewing}>
                        {reviewing ? 'Проверяю...' : 'Оформить заявку'}
                    </Button>
                </div>
            }

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
                            <Button onClick={() => onComplete?.()}>
                                Следующий вопрос →
                            </Button>
                        ) : (
                            <Button onClick={handleReset}>
                                Заполнить повторно
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}