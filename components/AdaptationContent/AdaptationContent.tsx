'use client';

import {useState, useEffect} from 'react';
import {StatCard, AdaptationCalendar} from '@/components';
import {PhoneCall, Percent, UserPlus, Wallet} from 'lucide-react';

type AdaptationInfo = {
    id: number;
    started_at: string;
    plan_name: string | null;
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type DayData = {
    date: string;
    calls: number;
    conversion: number;
    revenue_new: number;
    revenue_total: number;
};

type ApiDayItem = {
    date: string;
    calls: { total: number };
    conversions: { newClientConversionPercent: number };
    cash: { newClients: number; total: number };
};

function toPeriod(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function mapApiDay(item: ApiDayItem): DayData {
    const [y, m, d] = item.date.split('-');
    return {
        date: `${d}.${m}.${y}`,
        calls: item.calls.total,
        conversion: item.conversions.newClientConversionPercent,
        revenue_new: item.cash.newClients,
        revenue_total: item.cash.total,
    };
}

function parseDataDate(s: string): Date {
    const [d, m, y] = s.split('.').map(Number);
    return new Date(y, m - 1, d);
}

type Props = {
    userId: number;
    crmUserId: number | null;
};

export default function AdaptationContent({userId, crmUserId}: Props) {
    const [adaptation, setAdaptation] = useState<AdaptationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [dayData, setDayData] = useState<DayData[]>([]);
    const [calendarPeriod, setCalendarPeriod] = useState(() => toPeriod(new Date()));

    useEffect(() => {
        setLoading(true);
        fetch(`/api/adaptations/${userId}`)
            .then(r => r.json())
            .then(d => setAdaptation(d.adaptation ?? null))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (!crmUserId) return;
        fetch(`/api/adaptations/statistics?userId=${crmUserId}&period=${calendarPeriod}`)
            .then(r => r.json())
            .then(json => setDayData((json.data as ApiDayItem[]).map(mapApiDay)))
            .catch(() => setDayData([]));
    }, [crmUserId, calendarPeriod]);

    const last5 = [...dayData]
        .sort((a, b) => parseDataDate(b.date).getTime() - parseDataDate(a.date).getTime())
        .filter(d => d.calls >= 5)
        .slice(0, 5);

    const calls = adaptation ? last5.filter(d => adaptation.plan_calls != null && d.calls >= adaptation.plan_calls).length : 0;
    const conv = adaptation ? last5.filter(d => adaptation.plan_conversion != null && d.conversion >= adaptation.plan_conversion).length : 0;
    const revNew = adaptation ? last5.filter(d => adaptation.plan_revenue_new != null && d.revenue_new >= adaptation.plan_revenue_new).length : 0;
    const revTotal = adaptation ? last5.filter(d => adaptation.plan_revenue_total != null && d.revenue_total >= adaptation.plan_revenue_total).length : 0;

    if (loading) return <p className="text-sm text-gray-400">Загрузка...</p>;

    if (!adaptation) return (
        <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-gray-400">
            Адаптация не назначена.
        </div>
    );

    return (
        <>
            <div className="flex flex-wrap gap-4">
                <StatCard label="План по звонкам" value={adaptation.plan_calls ? String(adaptation.plan_calls) : '—'}
                          icon={PhoneCall} color="bg-purple-100 text-purple-600"/>
                <StatCard label="План по конверсиям"
                          value={adaptation.plan_conversion ? String(adaptation.plan_conversion) : '—'} icon={Percent}
                          color="bg-yellow-100 text-yellow-600"/>
                <StatCard label="План по кассе от новых клиентов"
                          value={adaptation.plan_revenue_new != null ? `${adaptation.plan_revenue_new.toLocaleString('ru-RU')} ₽` : '—'}
                          icon={UserPlus} color="bg-blue-100 text-blue-600"/>
                <StatCard label="План по кассе общей"
                          value={adaptation.plan_revenue_total != null ? `${adaptation.plan_revenue_total.toLocaleString('ru-RU')} ₽` : '—'}
                          icon={Wallet} color="bg-green-100 text-green-600"/>
                <AdaptationCalendar data={dayData} plan={adaptation} onMonthChange={setCalendarPeriod}/>
                <div></div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h4 className="text-base font-semibold text-gray-800 mb-1">Рекомендации</h4>
                <p className="text-xs text-gray-400 mb-5">Анализ основан на данных за последние 5 рабочих дней выбранного месяца.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div key='Звонки' className={`rounded-lg p-3 text-center bg-purple-50 text-purple-700`}>
                        <p className="text-2xl font-bold">{calls} <span className="text-sm font-normal">/ 5</span>
                        </p>
                        <p className="text-xs mt-1">{calls < 5 ? 'Звонки: не выполнено' : 'Звонки: выполнено'}</p>
                    </div>
                    <div key='Конверсия' className={`rounded-lg p-3 text-center bg-yellow-50 text-yellow-700`}>
                        <p className="text-2xl font-bold">{conv} <span className="text-sm font-normal">/ 5</span>
                        </p>
                        <p className="text-xs mt-1">{conv < 5 ? 'Конверсия: не выполнено' : 'Конверсия: выполнено'}</p>
                    </div>
                    <div key='Касса (новые)' className={`rounded-lg p-3 text-center bg-blue-50 text-blue-700`}>
                        <p className="text-2xl font-bold">{revNew} <span className="text-sm font-normal">/ 5</span>
                        </p>
                        <p className="text-xs mt-1">{revNew < 5 ? 'Касса (новые): не выполнено' : 'Касса (новые): выполнено'}</p>
                    </div>
                    <div key='Касса общая' className={`rounded-lg p-3 text-center bg-green-50 text-green-700`}>
                        <p className="text-2xl font-bold">{revTotal} <span className="text-sm font-normal">/ 5</span>
                        </p>
                        <p className="text-xs mt-1">{revTotal < 5 ? 'Касса общая: не выполнено' : 'Касса общая: выполнено'}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {calls < 5 && (
                        <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                            <PhoneCall className="shrink-0 text-purple-500 mt-0.5" size={16}/>
                            <div>
                                <p className="text-sm font-semibold text-purple-800">Увеличьте количество звонков</p>
                                <p className="text-xs text-purple-600 mt-0.5">[Рыба] Попробуйте ставить себе почасовые
                                    мини-планы. Например, 5–6 звонков каждые 2 часа. Используйте утреннее время —
                                    клиенты охотнее берут трубку до 11:00.</p>
                            </div>
                        </div>
                    )}
                    {conv < 5 && (
                        <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                            <Percent className="shrink-0 text-yellow-500 mt-0.5" size={16}/>
                            <div>
                                <p className="text-sm font-semibold text-yellow-800">Работайте над конверсией</p>
                                <p className="text-xs text-yellow-600 mt-0.5">[Рыба] Проанализируйте возражения, с
                                    которыми сталкиваетесь чаще всего. Разберите 1–2 записи звонков вместе с наставником
                                    и скорректируйте скрипт.</p>
                            </div>
                        </div>
                    )}
                    {(revNew < 5 || revTotal < 5) && (
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                            <Wallet className="shrink-0 text-blue-500 mt-0.5" size={16}/>
                            <div>
                                <p className="text-sm font-semibold text-blue-800">Повышайте средний чек</p>
                                <p className="text-xs text-blue-600 mt-0.5">[Рыба] Предлагайте сопутствующие услуги при
                                    каждом визите клиента. Уточняйте потребности — часто клиент готов купить больше,
                                    если предложить вовремя.</p>
                            </div>
                        </div>
                    )}
                    {calls === 5 && conv === 5 && revNew === 5 && revTotal === 5 && (
                        <p className="text-sm text-green-600 font-medium">✓ Все показатели выполнены за последние 5
                            рабочих дней. Отличная работа!</p>
                    )}
                </div>
            </div>

        </>
    );
}