'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Header, Sidebar } from '@/containers';
import { StatCard, AdaptationCalendar  } from '@/components';
import { CalendarDays, PhoneCall, Percent, UserPlus, Wallet } from 'lucide-react';

type AdaptationInfo = {
    id: number;
    started_at: string;
    plan_name: string | null;
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

function addMonths(dateStr: string, months: number): Date {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d;
}

function fmtDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toDataDate(d: Date): string {
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// const data: DayData[] = [
//     { date: '01.05.2026', calls: 18, conversion: 22.1, revenue_new: 4380,  revenue_total: 7050  },
//     { date: '02.05.2026', calls: 26, conversion: 26.8, revenue_new: 5210,  revenue_total: 8640  },
//     { date: '03.05.2026', calls: 15, conversion: 19.5, revenue_new: 3890,  revenue_total: 6300  },
//     { date: '04.05.2026', calls: 29, conversion: 29.3, revenue_new: 5780,  revenue_total: 9410  },
//     { date: '05.05.2026', calls: 22, conversion: 24.0, revenue_new: 4920,  revenue_total: 7880  },
//     { date: '06.05.2026', calls: 27, conversion: 27.5, revenue_new: 5540,  revenue_total: 8970  },
//     { date: '07.05.2026', calls: 16, conversion: 19.0, revenue_new: 3760,  revenue_total: 6100  },
//     { date: '08.05.2026', calls: 30, conversion: 30.1, revenue_new: 6010,  revenue_total: 9750  },
//     { date: '09.05.2026', calls: 21, conversion: 23.4, revenue_new: 4660,  revenue_total: 7520  },
//     { date: '10.05.2026', calls: 28, conversion: 28.7, revenue_new: 5870,  revenue_total: 9180  },
//     { date: '11.05.2026', calls: 17, conversion: 20.2, revenue_new: 4050,  revenue_total: 6480  },
//     { date: '12.05.2026', calls: 23, conversion: 25.6, revenue_new: 5120,  revenue_total: 8230  },
//     { date: '13.05.2026', calls: 29, conversion: 29.8, revenue_new: 5950,  revenue_total: 9600  },
//     { date: '14.05.2026', calls: 19, conversion: 21.0, revenue_new: 4200,  revenue_total: 6750  },
//     { date: '15.05.2026', calls: 24, conversion: 24.9, revenue_new: 4990,  revenue_total: 8010  },
//     { date: '16.05.2026', calls: 27, conversion: 27.2, revenue_new: 5440,  revenue_total: 8780  },
//     { date: '17.05.2026', calls: 15, conversion: 18.8, revenue_new: 3760,  revenue_total: 6010  },
//     { date: '18.05.2026', calls: 30, conversion: 31.2, revenue_new: 6240,  revenue_total: 9980  },
//     { date: '19.05.2026', calls: 20, conversion: 22.7, revenue_new: 4540,  revenue_total: 7270  },
//     { date: '20.05.2026', calls: 26, conversion: 26.3, revenue_new: 5260,  revenue_total: 8490  },
//     { date: '21.05.2026', calls: 18, conversion: 20.8, revenue_new: 4160,  revenue_total: 6660  },
//     { date: '22.05.2026', calls: 29, conversion: 30.5, revenue_new: 6100,  revenue_total: 9830  },
//     { date: '23.05.2026', calls: 22, conversion: 23.9, revenue_new: 4780,  revenue_total: 7660  },
//     { date: '24.05.2026', calls: 25, conversion: 25.1, revenue_new: 5020,  revenue_total: 8050  },
//     { date: '25.05.2026', calls: 16, conversion: 39.7, revenue_new: 3940,  revenue_total: 6310  },
//     { date: '26.05.2026', calls: 18, conversion: 28.4, revenue_new: 5680,  revenue_total: 9090  },
//     { date: '27.05.2026', calls: 21, conversion: 23.1, revenue_new: 4620,  revenue_total: 7400  },
//     { date: '28.05.2026', calls: 27, conversion: 27.8, revenue_new: 5560,  revenue_total: 8920  },
//     { date: '29.05.2026', calls: 17, conversion: 20.5, revenue_new: 4100,  revenue_total: 6570  },
//     { date: '30.05.2026', calls: 24, conversion: 25.3, revenue_new: 5060,  revenue_total: 8110  },
// ];

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

export default function AdaptationPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const [adaptation, setAdaptation] = useState<AdaptationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, fetchUser } = useUserStore();
    const [dayData, setDayData] = useState<DayData[]>([]);
    const [dayDataLoading, setDayDataLoading] = useState(false);
    const [calendarPeriod, setCalendarPeriod] = useState(() => toPeriod(new Date()));

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/adaptations/${user.id}`)
            .then(r => r.json())
            .then(d => setAdaptation(d.adaptation))
            .finally(() => setLoading(false));
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        setDayDataLoading(true);
        fetch(`/api/adaptations/statistics?userId=${user.crm_id}&period=${calendarPeriod}`)
            .then(r => r.json())
            .then(json => setDayData((json.data as ApiDayItem[]).map(mapApiDay)))
            .catch(() => setDayData([]))
            .finally(() => setDayDataLoading(false));
    }, [user?.id, calendarPeriod]);

    const endDate = adaptation ? addMonths(adaptation.started_at, 3) : null;

    const daysLeft = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86_400_000))
        : 0;

    const today = new Date();
    const yd = new Date(today); yd.setDate(today.getDate() - 1);
    const bd = new Date(today); bd.setDate(today.getDate() - 2);

    const yesterday = dayData.find(d => d.date === toDataDate(yd)) ?? null;

    function calcDiff(curr: number | undefined, prev: number | undefined): number | null {
        if (curr == null || prev == null || prev === 0) return null;
        return (curr - prev) / prev * 100;
    }

    function fmtDiff(diff: number | null): string {
        if (diff === null) return '—';
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    }

    function parseDataDate(s: string): Date {
        const [d, m, y] = s.split('.').map(Number);
        return new Date(y, m - 1, d);
    }

    const last5 = [...dayData]
        .sort((a, b) => parseDataDate(b.date).getTime() - parseDataDate(a.date).getTime())
        .filter(d => { const day = parseDataDate(d.date).getDay(); return day >= 1 && day <= 5; })
        .slice(0, 5);

    const callsMissed    = adaptation ? last5.filter(d => adaptation.plan_calls        != null && d.calls         < adaptation.plan_calls).length        : 0;
    const convMissed     = adaptation ? last5.filter(d => adaptation.plan_conversion   != null && d.conversion    < adaptation.plan_conversion).length    : 0;
    const revNewMissed   = adaptation ? last5.filter(d => adaptation.plan_revenue_new  != null && d.revenue_new   < adaptation.plan_revenue_new).length   : 0;
    const revTotalMissed = adaptation ? last5.filter(d => adaptation.plan_revenue_total!= null && d.revenue_total < adaptation.plan_revenue_total).length : 0;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                <main className="flex-1 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Адаптация</h3>

                    {loading && (
                        <p className="text-sm text-gray-400">Загрузка...</p>
                    )}

                    {!loading && !adaptation && (
                        <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-gray-400">
                            Адаптация не назначена.
                        </div>
                    )}

                    {!loading && adaptation && (
                        <div className="flex flex-wrap gap-4">
                            <StatCard
                                label="План по звонкам"
                                value={adaptation.plan_calls ? String(adaptation.plan_calls) : '—'}
                                icon={PhoneCall}
                                color="bg-purple-100 text-purple-600"
                            />
                            <StatCard
                                label="План по конверсиям"
                                value={adaptation.plan_conversion ? String(adaptation.plan_conversion) : '—'}
                                icon={Percent}
                                color="bg-yellow-100 text-yellow-600"
                            />
                            <StatCard
                                label="План по кассе от новых клиентов"
                                value={adaptation.plan_revenue_new != null ? `${adaptation.plan_revenue_new.toLocaleString('ru-RU')} ₽` : '—'}
                                icon={UserPlus}
                                color="bg-blue-100 text-blue-600"
                            />
                            <StatCard
                                label="План по кассе общей"
                                value={adaptation.plan_revenue_total != null ? `${adaptation.plan_revenue_total.toLocaleString('ru-RU')} ₽` : '—'}
                                icon={Wallet}
                                color="bg-green-100 text-green-600"
                            />

                            <AdaptationCalendar data={dayData} plan={adaptation} onMonthChange={setCalendarPeriod} />
                            <div></div>
                        </div>
                    )}

                    {!loading && adaptation && (
                        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                            <h4 className="text-base font-semibold text-gray-800 mb-1">Рекомендации</h4>
                            <p className="text-xs text-gray-400 mb-5">
                                Анализ основан на данных за последние 5 рабочих дней.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: 'Звонки', count: callsMissed,    color: 'bg-purple-50 text-purple-700' },
                                    { label: 'Конверсия', count: convMissed,  color: 'bg-yellow-50 text-yellow-700' },
                                    { label: 'Касса (новые)', count: revNewMissed,   color: 'bg-blue-50 text-blue-700' },
                                    { label: 'Касса общая', count: revTotalMissed,   color: 'bg-green-50 text-green-700' },
                                ].map(({ label, count, color }) => (
                                    <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                                        <p className="text-2xl font-bold">{count} <span className="text-sm font-normal">/ 5</span></p>
                                        <p className="text-xs mt-1">{label}: не выполнен</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {callsMissed > 0 && (
                                    <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                                        <PhoneCall className="shrink-0 text-purple-500 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-sm font-semibold text-purple-800">Увеличьте количество звонков</p>
                                            <p className="text-xs text-purple-600 mt-0.5">
                                                [Рыба] Попробуйте ставить себе почасовые мини-планы. Например, 5–6 звонков каждые 2 часа.
                                                Используйте утреннее время — клиенты охотнее берут трубку до 11:00.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {convMissed > 0 && (
                                    <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                                        <Percent className="shrink-0 text-yellow-500 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-sm font-semibold text-yellow-800">Работайте над конверсией</p>
                                            <p className="text-xs text-yellow-600 mt-0.5">
                                                [Рыба] Проанализируйте возражения, с которыми сталкиваетесь чаще всего.
                                                Разберите 1–2 записи звонков вместе с наставником и скорректируйте скрипт.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {(revNewMissed > 0 || revTotalMissed > 0) && (
                                    <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                                        <Wallet className="shrink-0 text-blue-500 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-800">Повышайте средний чек</p>
                                            <p className="text-xs text-blue-600 mt-0.5">
                                                [Рыба] Предлагайте сопутствующие услуги при каждом визите клиента.
                                                Уточняйте потребности — часто клиент готов купить больше, если предложить вовремя.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {callsMissed === 0 && convMissed === 0 && revNewMissed === 0 && revTotalMissed === 0 && (
                                    <p className="text-sm text-green-600 font-medium">✓ Все показатели выполнены за последние 5 рабочих дней. Отличная работа!</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}