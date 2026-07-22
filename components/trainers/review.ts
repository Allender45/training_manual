export type PaymentType = 'cash' | 'card' | 'invoice';

export type Review = {
    passed: boolean;
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
    answers: string[];
};

export const PAYMENT_OPTIONS: { value: PaymentType; label: string }[] = [
    { value: 'cash',    label: 'Наличные' },
    { value: 'card',    label: 'На карту' },
    { value: 'invoice', label: 'Безнал'   },
];
