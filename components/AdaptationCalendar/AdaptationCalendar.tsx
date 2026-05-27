'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, PhoneCall, Percent, UserPlus, Wallet } from 'lucide-react';
import StatCard from '@/components/StatCard/StatCard';

type DayData = {
    date: string;
    calls: number;
    conversion: number;
    revenue_new: number;
    revenue_total: number;
};

type Plan = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

type Props = {
    data: DayData[];
    plan: Plan;
};

function toDataDate(d: Date): string {
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
}

function getDayColor(day: DayData | undefined, plan: Plan): string {
    if (!day) return 'bg-gray-100 text-gray-400';
    let missed = 0;
    if (plan.plan_calls        != null && day.calls         < plan.plan_calls)        missed++;
    if (plan.plan_conversion   != null && day.conversion    < plan.plan_conversion)   missed++;
    if (plan.plan_revenue_new  != null && day.revenue_new   < plan.plan_revenue_new)  missed++;
    if (plan.plan_revenue_total!= null && day.revenue_total < plan.plan_revenue_total)missed++;

    if (missed === 0) return 'bg-green-100 text-green-800';
    if (missed === 1) return 'bg-yellow-100 text-yellow-800';
    if (missed === 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
}

export default function AdaptationCalendar({ data, plan }: Props) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selected, setSelected] = useState<string | null>(null);

    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    // стартовый день недели (пн=0)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedDay = selected ? data.find(d => d.date === selected) : null;

    function fmtDiff(curr: number | undefined, plan: number | null): string {
        if (curr == null || plan == null || plan === 0) return '—';
        const d = (curr - plan) / plan * 100;
        return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
    }
    function diffClass(curr: number | undefined, plan: number | null): string {
        if (curr == null || plan == null) return '';
        return curr >= plan ? 'text-green-600' : 'text-red-600';
    }

    function diffColor(curr: number | undefined, plan: number | null): string {
        if (curr == null || plan == null) return '';
        return curr >= plan ? 'bg-green-100' : 'bg-red-100';
    }

    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь',
        'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 w-full">
            {/* Шапка */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                        className="p-1 rounded hover:bg-gray-100">
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                    {monthNames[month]} {year}
                </span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                        className="p-1 rounded hover:bg-gray-100">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 mb-1">
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
            </div>

            {/* Ячейки */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((date, i) => {
                    if (!date) return <div key={i} />;
                    const key = toDataDate(date);
                    const day = data.find(d => d.date === key);
                    const color = getDayColor(day, plan);
                    const isSelected = selected === key;
                    return (
                        <button key={key}
                                onClick={() => setSelected(isSelected ? null : key)}
                                className={`rounded-lg py-1.5 text-sm font-medium transition-all
                                ${color}
                                ${isSelected ? 'ring-2 ring-blue-400' : ''}
                                ${day ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Детальный блок */}
            {selected && selectedDay && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-3">{selected}</p>
                    <div className="flex flex-wrap gap-3">
                        <StatCard label="Звонки" icon={PhoneCall} color="bg-purple-100 text-purple-600"
                                  value={String(selectedDay.calls)}
                                  sub={fmtDiff(selectedDay.calls, plan.plan_calls) + ' от плана'}
                                  subClass={diffClass(selectedDay.calls, plan.plan_calls)}
                                  bgColor={diffColor(selectedDay.calls, plan.plan_calls)}
                        />
                        <StatCard label="Конверсия" icon={Percent} color="bg-yellow-100 text-yellow-600"
                                  value={`${selectedDay.conversion}%`}
                                  sub={fmtDiff(selectedDay.conversion, plan.plan_conversion) + ' от плана'}
                                  subClass={diffClass(selectedDay.conversion, plan.plan_conversion)}
                                  bgColor={diffColor(selectedDay.conversion, plan.plan_conversion)}
                        />
                        <StatCard label="Касса (новые)" icon={UserPlus} color="bg-blue-100 text-blue-600"
                                  value={`${selectedDay.revenue_new.toLocaleString('ru-RU')} ₽`}
                                  sub={fmtDiff(selectedDay.revenue_new, plan.plan_revenue_new) + ' от плана'}
                                  subClass={diffClass(selectedDay.revenue_new, plan.plan_revenue_new)}
                                  bgColor={diffColor(selectedDay.revenue_new, plan.plan_revenue_new)}
                        />
                        <StatCard label="Касса общая" icon={Wallet} color="bg-green-100 text-green-600"
                                  value={`${selectedDay.revenue_total.toLocaleString('ru-RU')} ₽`}
                                  sub={fmtDiff(selectedDay.revenue_total, plan.plan_revenue_total) + ' от плана'}
                                  subClass={diffClass(selectedDay.revenue_total, plan.plan_revenue_total)}
                                  bgColor={diffColor(selectedDay.revenue_total, plan.plan_revenue_total)}
                        />
                    </div>
                </div>
            )}
            {selected && !selectedDay && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400">
                    Нет данных за {selected}
                </div>
            )}
        </div>
    );
}