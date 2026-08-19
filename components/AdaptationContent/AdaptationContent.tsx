'use client';

import {useState, useEffect} from 'react';
import {StatCard, AdaptationCalendar} from '@/components';
import {PhoneCall, Percent, UserPlus, Wallet} from 'lucide-react';
import {useAdaptationStore} from '@/store';
import {computeScore} from '@/lib/adaptationUtils';
import {toPeriod} from '@/lib/date';
import {formatMoney} from '@/lib/format';
import {factVsPlanColor} from '@/lib/adaptationUtils';

type Props = {
    userId: number;
    crmUserId: number | null;
};

export default function AdaptationContent({userId, crmUserId}: Props) {
    const [calendarPeriod, setCalendarPeriod] = useState(() => toPeriod(new Date()));

    const adaptation    = useAdaptationStore(s => s.adaptation);
    const loading       = useAdaptationStore(s => s.loading);
    const dayData       = useAdaptationStore(s => s.dayData);
    const fetchAdaptation = useAdaptationStore(s => s.fetchAdaptation);
    const fetchDayData  = useAdaptationStore(s => s.fetchDayData);
    const reset         = useAdaptationStore(s => s.reset);
    const salaryForecast = useAdaptationStore(s => s.salaryForecast);

    useEffect(() => {
        fetchAdaptation(userId);
        return () => reset();
    }, [userId]);

    useEffect(() => {
        if (!crmUserId) return;
        fetchDayData(crmUserId, calendarPeriod);
    }, [crmUserId, calendarPeriod]);

    const score = adaptation
        ? computeScore(dayData.map(d => ({
            date: d.date.split('.').reverse().join('-'),
            calls: { total: d.calls },
            conversions: { newClientConversionPercent: d.conversion },
            cash: { newClients: d.revenue_new, total: d.revenue_total },
        })), adaptation)
        : { calls: 0, conv: 0, revNew: 0, revTotal: 0 };
    const { calls, conv, revNew, revTotal } = score;

    const now = new Date();
    const todayStr = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear(),
    ].join('.');
    const today = dayData.find(d => d.date === todayStr) ?? null;

    if (loading) return <p className="text-sm text-gray-400">Загрузка...</p>;

    if (!adaptation) return (
        <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-gray-400">
            Адаптация не назначена.
        </div>
    );

    return (
        <>
            <div className="flex flex-wrap gap-4">
                <StatCard label="Факт/план по звонкам" value={adaptation.plan_calls ? `${today ? `${today.calls} / ${String(adaptation.plan_calls)}` : '—'}` : '—'}
                          icon={PhoneCall} color="bg-purple-100 text-purple-600"/>
                <StatCard label="Факт/план по конверсиям"
                          value={adaptation.plan_conversion ? `${today ? `${today.conversion} / ${String(adaptation.plan_conversion)}` : '—'}` : '—'} icon={Percent}
                          color="bg-yellow-100 text-yellow-600" valueClass={factVsPlanColor(today?.conversion ?? null, adaptation.plan_conversion)}/>
                <StatCard label="Факт/план по кассе от новых клиентов"
                          value={adaptation.plan_revenue_new ? `${today ? `${today.revenue_new} / ${String(adaptation.plan_revenue_new)}` : '—'}` : '—'}
                          icon={UserPlus} color="bg-blue-100 text-blue-600" valueClass={factVsPlanColor(today?.revenue_new ?? null, adaptation.plan_revenue_new)}/>
                <StatCard label="Факт/план по кассе общей"
                          value={adaptation.plan_revenue_total ? `${today ? `${today.revenue_total} / ${String(adaptation.plan_revenue_total)}` : '—'}` : '—'}
                          icon={Wallet} color="bg-green-100 text-green-600" valueClass={factVsPlanColor(today?.revenue_total ?? null, adaptation.plan_revenue_total)}/>
                <StatCard label="Прогноз зарплаты"
                          value={salaryForecast != null ? formatMoney(Math.round(salaryForecast)) : '—'}
                          icon={Wallet} color="bg-green-100 text-green-600"/>
                <AdaptationCalendar data={dayData} plan={adaptation} onMonthChange={setCalendarPeriod}/>
                <div></div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h4 className="text-base font-semibold text-gray-800 mb-1">Рекомендации</h4>
                <p className="text-xs text-gray-400 mb-5">Анализ основан на данных за последние 5 рабочих дней выбранного месяца.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div key='Звонки' className={`rounded-lg p-3 text-center bg-purple-50 text-purple-700`}>
                        <p className="text-2xl font-bold">{calls} <span className="text-sm font-normal">/ 5</span></p>
                        <p className="text-xs mt-1">{calls < 5 ? 'Звонки: не выполнено' : 'Звонки: выполнено'}</p>
                    </div>
                    <div key='Конверсия' className={`rounded-lg p-3 text-center bg-yellow-50 text-yellow-700`}>
                        <p className="text-2xl font-bold">{conv} <span className="text-sm font-normal">/ 5</span></p>
                        <p className="text-xs mt-1">{conv < 5 ? 'Конверсия: не выполнено' : 'Конверсия: выполнено'}</p>
                    </div>
                    <div key='Касса (новые)' className={`rounded-lg p-3 text-center bg-blue-50 text-blue-700`}>
                        <p className="text-2xl font-bold">{revNew} <span className="text-sm font-normal">/ 5</span></p>
                        <p className="text-xs mt-1">{revNew < 5 ? 'Касса (новые): не выполнено' : 'Касса (новые): выполнено'}</p>
                    </div>
                    <div key='Касса общая' className={`rounded-lg p-3 text-center bg-green-50 text-green-700`}>
                        <p className="text-2xl font-bold">{revTotal} <span className="text-sm font-normal">/ 5</span></p>
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