'use client';

import { useState } from 'react';
import { Button, Checkbox, Input } from '@/components';
import { ChevronDown } from 'lucide-react';
import ReviewResult from '@/components/ReviewResult/ReviewResult';
import { PaymentType, Review, PAYMENT_OPTIONS } from '@/components/trainers/review';

export interface NewOrderTrainerProps {
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

const CORRECT_ANSWERS: Record<string, string> = {
    city: 'Альметьевск',
    street: 'Полевая, дом 2',
    dateTime: 'В ближайшее время',
    payment: 'На карту (перевод по ссылке СБП)',
    workDescription: 'В дробилку деревья засовывать, смены по 8 часов, 3–4 дня',
};

const TRANSCRIPT = `
Спикер 1: 
00:00:00 - Алло. Здравствуйте, компания Атлант пропущенный, ранее был от вас. Чем могу помочь?
Спикер 2: 
00:00:06 - Здравствуйте, работяги нужны, город Альметьевск.
Спикер 1: 
00:00:10 - Что делать надо?
Спикер 2: 
00:00:11 - В дробилку деревья засовывать.
Спикер 1: 
00:00:16 - Время смену рассматриваете.
Спикер 2: 
00:00:19 - Где-то на три-четыре дня.
Спикер 1: 
00:00:21 - А смены по сколько? По восемь часов?
Спикер 2: 
00:00:23 - Восемь.
Спикер 1: 
00:00:26 - Не расслышал.
Спикер 2: 
00:00:27 - А 8 часов.
Спикер 1: 
00:00:29 - Так, когда надо, чтобы приступили? А на какой адрес надо подъехать?
Спикер 2: 
00:00:35 - Улица Полевая, дом два.
Спикер 1: 
00:00:37 - Полевая 2. Хорошо, с вами ой, по окончании работы сможете рассчитаться переводом, по ссылке СБП оплатить? Да, конечно. Всё замечательно. Тогда в конце работы я вам эсэмэской пришлю, куда перевести на месте рассчитываться не нужно будет с рабочими. Они подъедут? Они подъедут ориентировочно в течение часа-полтора, как подъедут, позвонят вам. Добро.
00:01:03 - Всё, договорились, ожидайте тогда.
`;

function normalize(s: string) {
    return s.trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
}

function validateForm(f: OrderForm): Partial<Record<keyof OrderForm, string>> {
    const errors: Partial<Record<keyof OrderForm, string>> = {};

    if (!f.city.trim()) {
        errors.city = 'Введите город';
    } else if (!normalize(f.city).includes('альметьевск')) {
        errors.city = 'Неверно указан город';
    }

    if (!f.street.trim()) {
        errors.street = 'Введите адрес';
    } else {
        const n = normalize(f.street);
        if (!n.includes('полевая') || !n.includes('2')) {
            errors.street = 'Неверно указан адрес';
        }
    }

    if (!f.workDescription.trim()) {
        errors.workDescription = 'Укажите характер работ';
    }

    if (!f.nearestTime && !f.dateTime.trim()) {
        errors.dateTime = 'Укажите дату и время';
    }

    if (f.payment !== 'card') {
        errors.payment = 'Неверно указана форма оплаты';
    }

    return errors;
}

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
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
    const [showAnswers, setShowAnswers] = useState(false);

    function handleChange(field: keyof OrderForm, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => {
            if (!(field in prev)) return prev;
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    }

    async function handleSubmit() {
        const errors = validateForm(form);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

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
                nearestTime: form.nearestTime,
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
        setFieldErrors({});
        setShowAnswers(false);
    }

    const isValid = !!(form.city.trim() && form.street.trim() && form.workDescription.trim() && (form.nearestTime || form.dateTime));
    const hasErrors = Object.keys(fieldErrors).length > 0 || (!!review && !review.passed);

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
                error={fieldErrors.city}
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
                error={fieldErrors.workDescription}
            />

            <Input
                label="Адрес"
                name="street"
                value={form.street}
                onChange={e => handleChange('street', e.target.value)}
                placeholder="Улица, дом"
                required
                error={fieldErrors.street}
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
                disabled={form.nearestTime}
                nearestTimeCheckbox={false}
                error={fieldErrors.dateTime}
            />

            <Checkbox
                label="В ближайшее время"
                name="nearestTime"
                checked={form.nearestTime}
                onChange={e => setForm(prev => ({
                    ...prev,
                    nearestTime: e.target.checked,
                    dateTime: e.target.checked ? '' : prev.dateTime,
                }))}
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
                {fieldErrors.payment && <p className="text-red-500 text-xs mt-1">{fieldErrors.payment}</p>}
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

            {hasErrors && (
                <div className="border border-amber-200 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowAnswers(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                        <span>{showAnswers ? 'Скрыть правильные ответы' : 'Показать правильные ответы'}</span>
                        <ChevronDown size={16} className={`transition-transform ${showAnswers ? 'rotate-180' : ''}`} />
                    </button>
                    {showAnswers && (
                        <ul className="px-3 py-2 text-sm text-gray-700 space-y-1 bg-white">
                            <li><span className="font-medium">Город:</span> {CORRECT_ANSWERS.city}</li>
                            <li><span className="font-medium">Адрес:</span> {CORRECT_ANSWERS.street}</li>
                            <li><span className="font-medium">Время:</span> {CORRECT_ANSWERS.dateTime}</li>
                            <li><span className="font-medium">Оплата:</span> {CORRECT_ANSWERS.payment}</li>
                            <li><span className="font-medium">Вид работ:</span> {CORRECT_ANSWERS.workDescription}</li>
                        </ul>
                    )}
                </div>
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