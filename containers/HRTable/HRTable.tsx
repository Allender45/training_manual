'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useUsersListStore } from '@/store';

// ── Types ──────────────────────────────────────────────────────────
type DayItem = {
    date: string;
    calls: { inbound: number; outbound: number; total: number };
    conversions: {
        ordersCount: number; completedOrdersCount: number;
        newClientOrdersCount: number; completedNewClientOrdersCount: number;
        appealsCount: number; newClientConversionPercent: number;
        completedNewClientConversionPercent: number; completedFromAppealsPercent: number;
    };
    cash: { newClients: number; total: number };
};

type ApiMeta = {
    hireDate: string;
    salaryForecast: { amount: number; periodName: string } | null;
    previousPeriod: string | null;
};

type InternApiData = { data: DayItem[]; meta: ApiMeta };

type Intern = {
    id: number; name: string; crm_id: number | null;
    adaptation_access: boolean; courses_completed: number; courses_total: number;
};

type InternStats = {
    hireDate: string; shifts: number;
    totalAppeals: number; medianAppeals: number;
    totalOrders: number; medianOrders: number;
    completedOrders: number; cashNew: number; cashTotal: number;
    salaryForecast: number | null;
};

// ── Helpers ────────────────────────────────────────────────────────
function median(arr: number[]): number {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// ── Modal config ───────────────────────────────────────────────────
type ModalType = 'orders' | 'appeals' | 'cashNew' | 'cashTotal';

const MODAL_CONFIG: Record<ModalType, {
    title: string;
    getValue: (d: DayItem) => number;
    fmtCell: (n: number) => string;
}> = {
    orders:    { title: 'Заявки по дням',       getValue: d => d.conversions.ordersCount,  fmtCell: n => String(n) },
    appeals:   { title: 'Обращения по дням',    getValue: d => d.conversions.appealsCount, fmtCell: n => String(n) },
    cashNew:   { title: 'Касса новых клиентов', getValue: d => d.cash.newClients, fmtCell: n => String(n + ' ₽') },
    cashTotal: { title: 'Касса общая',          getValue: d => d.cash.total,      fmtCell: n => String(n + ' ₽') },
};

function computeStats(d: InternApiData): InternStats {
    const working = d.data.filter(x => x.calls.total > 3);
    return {
        hireDate: d.meta.hireDate,
        shifts: working.length,
        totalAppeals: d.data.reduce((s, x) => s + x.conversions.appealsCount, 0),
        medianAppeals: median(working.map(x => x.conversions.appealsCount)),
        totalOrders: d.data.reduce((s, x) => s + x.conversions.ordersCount, 0),
        medianOrders: median(working.map(x => x.conversions.ordersCount)),
        completedOrders: d.data.reduce((s, x) => s + x.conversions.completedOrdersCount, 0),
        cashNew: d.data.reduce((s, x) => s + x.cash.newClients, 0),
        cashTotal: d.data.reduce((s, x) => s + x.cash.total, 0),
        salaryForecast: d.meta.salaryForecast?.amount ?? null,
    };
}

const fmt = (n: number) => n.toLocaleString('ru-RU');
const fmtDate = (s: string) => { const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
const fmtMoney = (n: number) => `${fmt(Math.round(n))} ₽`;
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// ── Mock data (July 2026) ──────────────────────────────────────────
const MOCK_DATA: InternApiData = {
    data: [
        { date:'2026-07-01', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:6,completedOrdersCount:4,newClientOrdersCount:4,completedNewClientOrdersCount:3,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:75,completedFromAppealsPercent:0}, cash:{newClients:16142,total:17502} },
        { date:'2026-07-02', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-03', calls:{inbound:22,outbound:0,total:22}, conversions:{ordersCount:10,completedOrdersCount:7,newClientOrdersCount:5,completedNewClientOrdersCount:2,appealsCount:29,newClientConversionPercent:17.24,completedNewClientConversionPercent:40,completedFromAppealsPercent:6.9}, cash:{newClients:2226,total:6652} },
        { date:'2026-07-04', calls:{inbound:23,outbound:3,total:26}, conversions:{ordersCount:14,completedOrdersCount:11,newClientOrdersCount:13,completedNewClientOrdersCount:10,appealsCount:29,newClientConversionPercent:44.83,completedNewClientConversionPercent:76.92,completedFromAppealsPercent:34.48}, cash:{newClients:11261,total:11896} },
        { date:'2026-07-05', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:4,completedOrdersCount:3,newClientOrdersCount:4,completedNewClientOrdersCount:3,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:75,completedFromAppealsPercent:0}, cash:{newClients:3202,total:3202} },
        { date:'2026-07-06', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:1,completedOrdersCount:1,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:2575} },
        { date:'2026-07-07', calls:{inbound:38,outbound:0,total:38}, conversions:{ordersCount:17,completedOrdersCount:14,newClientOrdersCount:14,completedNewClientOrdersCount:12,appealsCount:49,newClientConversionPercent:28.57,completedNewClientConversionPercent:85.71,completedFromAppealsPercent:24.49}, cash:{newClients:10022,total:14032} },
        { date:'2026-07-08', calls:{inbound:27,outbound:5,total:32}, conversions:{ordersCount:12,completedOrdersCount:5,newClientOrdersCount:10,completedNewClientOrdersCount:4,appealsCount:43,newClientConversionPercent:23.26,completedNewClientConversionPercent:40,completedFromAppealsPercent:9.3}, cash:{newClients:8703,total:8703} },
        { date:'2026-07-09', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:10,completedOrdersCount:4,newClientOrdersCount:5,completedNewClientOrdersCount:2,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:40,completedFromAppealsPercent:0}, cash:{newClients:1763,total:5346} },
        { date:'2026-07-10', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:4,completedOrdersCount:3,newClientOrdersCount:3,completedNewClientOrdersCount:2,appealsCount:1,newClientConversionPercent:300,completedNewClientConversionPercent:66.67,completedFromAppealsPercent:200}, cash:{newClients:7632,total:11923} },
        { date:'2026-07-11', calls:{inbound:30,outbound:1,total:31}, conversions:{ordersCount:11,completedOrdersCount:11,newClientOrdersCount:10,completedNewClientOrdersCount:10,appealsCount:37,newClientConversionPercent:27.03,completedNewClientConversionPercent:100,completedFromAppealsPercent:27.03}, cash:{newClients:9681,total:9681} },
        { date:'2026-07-12', calls:{inbound:32,outbound:3,total:35}, conversions:{ordersCount:12,completedOrdersCount:10,newClientOrdersCount:11,completedNewClientOrdersCount:10,appealsCount:36,newClientConversionPercent:30.56,completedNewClientConversionPercent:90.91,completedFromAppealsPercent:27.78}, cash:{newClients:7066,total:7066} },
        { date:'2026-07-13', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:9,completedOrdersCount:7,newClientOrdersCount:6,completedNewClientOrdersCount:4,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:66.67,completedFromAppealsPercent:0}, cash:{newClients:6683,total:10512} },
        { date:'2026-07-14', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-15', calls:{inbound:19,outbound:0,total:19}, conversions:{ordersCount:17,completedOrdersCount:13,newClientOrdersCount:14,completedNewClientOrdersCount:11,appealsCount:20,newClientConversionPercent:70,completedNewClientConversionPercent:78.57,completedFromAppealsPercent:55}, cash:{newClients:15578,total:20102} },
        { date:'2026-07-16', calls:{inbound:14,outbound:0,total:14}, conversions:{ordersCount:13,completedOrdersCount:11,newClientOrdersCount:7,completedNewClientOrdersCount:6,appealsCount:18,newClientConversionPercent:38.89,completedNewClientConversionPercent:85.71,completedFromAppealsPercent:33.33}, cash:{newClients:7207,total:17730} },
        { date:'2026-07-17', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:3,completedOrdersCount:3,newClientOrdersCount:2,completedNewClientOrdersCount:2,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:100,completedFromAppealsPercent:0}, cash:{newClients:3392,total:6172} },
        { date:'2026-07-18', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:2,completedOrdersCount:1,newClientOrdersCount:2,completedNewClientOrdersCount:1,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:50,completedFromAppealsPercent:0}, cash:{newClients:694,total:694} },
        { date:'2026-07-19', calls:{inbound:11,outbound:0,total:11}, conversions:{ordersCount:8,completedOrdersCount:4,newClientOrdersCount:6,completedNewClientOrdersCount:3,appealsCount:13,newClientConversionPercent:46.15,completedNewClientConversionPercent:50,completedFromAppealsPercent:23.08}, cash:{newClients:5467,total:6439} },
        { date:'2026-07-20', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:7,completedOrdersCount:0,newClientOrdersCount:4,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-21', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:1,completedOrdersCount:0,newClientOrdersCount:1,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-22', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:1,completedOrdersCount:0,newClientOrdersCount:1,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-23', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-24', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-25', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-26', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-27', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-28', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-29', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-30', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
        { date:'2026-07-31', calls:{inbound:0,outbound:0,total:0}, conversions:{ordersCount:0,completedOrdersCount:0,newClientOrdersCount:0,completedNewClientOrdersCount:0,appealsCount:0,newClientConversionPercent:0,completedNewClientConversionPercent:0,completedFromAppealsPercent:0}, cash:{newClients:0,total:0} },
    ],
    meta: {
        hireDate: '2026-03-06',
        salaryForecast: { amount: 50978.97, periodName: 'Разгрузчики 2' },
        previousPeriod: '202606',
    },
};

const MOCK_STATS = computeStats(MOCK_DATA);

// ── Intern sub-table ───────────────────────────────────────────────
function HRInternSubTable({ interns, period }: {
    interns: Intern[];
    period: string;
}) {
    const [modal, setModal] = useState<{ internName: string; days: DayItem[]; type: ModalType } | null>(null);
    const [statsData, setStatsData]     = useState<Record<string, InternApiData | null>>({});
    const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({});
    const fetchedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        interns.forEach(intern => {
            if (!intern.crm_id) return;
            const key = `${intern.id}-${period}`;
            if (fetchedRef.current.has(key)) return;
            fetchedRef.current.add(key);
            setStatsLoading(p => ({ ...p, [key]: true }));
            fetch(`/api/adaptations/statistics?userId=${intern.crm_id}&period=${period}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
                .then(data => {
                    setStatsData(p => ({ ...p, [key]: data }));
                    setStatsLoading(p => ({ ...p, [key]: false }));
                });
        });
    }, [interns, period]);

    if (!interns.length) return <p className="px-8 py-4 text-sm text-gray-400">Нет стажёров</p>;

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 1300 }}>
                    <thead>
                    <tr className="text-xs font-medium text-gray-400 border-b border-gray-200 bg-gray-50/80">
                        <th className="px-8 py-2 text-left w-10">#</th>
                        <th className="px-4 py-2 text-left min-w-[160px]">ФИО</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Дата<br/>приёма</th>
                        <th className="px-3 py-2 text-center">Смен</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Обращений<br/>всего</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap">Обращений<br/>за смену</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Заявок<br/>всего</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap">Заявок<br/>за смену</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Выполнено<br/>заявок</th>
                        <th className="px-3 py-2 text-center">Прирост</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Касса<br/>новых</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap">Касса<br/>общая</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-200">Прогноз<br/>ЗП</th>
                    </tr>
                    </thead>
                    <tbody>
                    {interns.map((intern, idx) => {
                        const key = `${intern.id}-${period}`;
                        const isLoading = statsLoading[key] ?? false;
                        const apiData = statsData[key];
                        const s = apiData ? computeStats(apiData) : null;
                        const days = apiData?.data ?? [];
                        return (
                            <tr
                                key={intern.id}
                                // onClick={() => window.location.href = `/users/edit?id=${intern.id}`}
                                className="border-b border-gray-100 last:border-0 hover:bg-white cursor-pointer transition-colors"
                            >
                                <td className="px-8 py-3 text-gray-400">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{intern.name}</td>
                                {isLoading ? (
                                    <td colSpan={11} className="px-4 py-3">
                                        <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                                    </td>
                                ) : !s ? (
                                    <td colSpan={11} className="px-4 py-3 text-center text-xs text-gray-300">
                                        {!intern.crm_id ? 'Нет CRM ID' : 'Нет данных'}
                                    </td>
                                ) : (<>
                                    <td className="px-3 py-3 text-center text-gray-600 whitespace-nowrap border-l border-gray-200">{fmtDate(s.hireDate)}</td>
                                    <td className="px-3 py-3 text-center font-semibold text-gray-800">{s.shifts}</td>
                                    <td
                                        className="px-3 py-3 text-center border-l border-gray-200 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'appeals' }); }}
                                        title="Детализация по дням"
                                    >
                                        {fmt(s.totalAppeals)}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-center hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'appeals' }); }}
                                        title="Детализация по дням"
                                    >
                                        {s.medianAppeals}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-center border-l border-gray-200 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'orders' }); }}
                                        title="Детализация по дням"
                                    >
                                        {fmt(s.totalOrders)}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-center hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'orders' }); }}
                                        title="Детализация по дням"
                                    >
                                        {s.medianOrders}
                                    </td>
                                    <td className="px-3 py-3 text-center border-l border-gray-200">{fmt(s.completedOrders)}</td>
                                    <td className="px-3 py-3 text-center text-gray-400 text-xs">—</td>
                                    <td
                                        className="px-3 py-3 text-center text-green-700 font-medium whitespace-nowrap border-l border-gray-200 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'cashNew' }); }}
                                        title="Детализация по дням"
                                    >
                                        {fmtMoney(s.cashNew)}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-center font-medium whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                        onClick={e => { e.stopPropagation(); setModal({ internName: intern.name, days, type: 'cashTotal' }); }}
                                        title="Детализация по дням"
                                    >
                                        {fmtMoney(s.cashTotal)}
                                    </td>
                                    <td className="px-3 py-3 text-center text-blue-700 font-medium whitespace-nowrap border-l border-gray-200">
                                        {s.salaryForecast != null ? fmtMoney(s.salaryForecast) : '—'}
                                    </td>
                                </>)}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setModal(null)}
                >
                    <div
                        className={`bg-white rounded-2xl shadow-xl w-full mx-4 ${modal.type.startsWith('cash') ? 'max-w-xl' : 'max-w-sm'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <p className="text-xs text-gray-400">Заявки по дням</p>
                                <p className="text-xs text-gray-400">{MODAL_CONFIG[modal.type].title}</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>
                        <div className="p-4">
                            {(() => {
                                const cfg = MODAL_CONFIG[modal.type];
                                const firstDay = new Date(modal.days[0]?.date + 'T00:00:00') ?? new Date();
                                const y = firstDay.getFullYear();
                                const mo = firstDay.getMonth();
                                const daysInMonth = new Date(y, mo + 1, 0).getDate();
                                let startDow = new Date(y, mo, 1).getDay();
                                startDow = (startDow + 6) % 7;

                                const dayMap: Record<number, number> = {};
                                modal.days.forEach(d => {
                                    const dn = parseInt(d.date.split('-')[2], 10);
                                    dayMap[dn] = cfg.getValue(d);
                                });

                                const cells: (number | null)[] = [];
                                for (let i = 0; i < startDow; i++) cells.push(null);
                                for (let i = 1; i <= daysInMonth; i++) cells.push(i);
                                while (cells.length % 7 !== 0) cells.push(null);

                                return (
                                    <>
                                        <div className="grid grid-cols-7 mb-1">
                                            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                                                <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">{d}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {cells.map((day, i) => {
                                                if (!day) return <div key={i} />;
                                                const count = dayMap[day] ?? 0;
                                                return (
                                                    <div key={i} className={`rounded-lg p-1.5 text-center ${count > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                                        <div className="text-xs text-gray-400 leading-none">{day}</div>
                                                        <div className={`text-sm font-bold mt-0.5 ${count > 0 ? 'text-blue-700' : 'text-gray-200'} whitespace-nowrap`}>
                                                            {count > 0 ? cfg.fmtCell(count) : '·'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Main component ─────────────────────────────────────────────────
export default function HRTable() {
    const mentors      = useUsersListStore(s => s.mentors);
    const loading      = useUsersListStore(s => s.mentorsLoading);
    const fetchMentors = useUsersListStore(s => s.fetchMentors);

    const today = new Date();
    const [year, setYear]   = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const period = `${year}${String(month).padStart(2, '0')}`;

    const [expanded, setExpanded]         = useState<Set<number>>(new Set());
    const [internCache, setInternCache]   = useState<Record<number, Intern[]>>({});
    const [internLoading, setInternLoading] = useState<Record<number, boolean>>({});

    useEffect(() => { fetchMentors(); }, []);

    function prevMonth() {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else setMonth(m => m - 1);
    }
    function nextMonth() {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else setMonth(m => m + 1);
    }

    async function toggleMentor(mentorId: number) {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(mentorId) ? next.delete(mentorId) : next.add(mentorId);
            return next;
        });
        if (internCache[mentorId]) return;
        setInternLoading(p => ({ ...p, [mentorId]: true }));
        try {
            const res = await fetch(`/api/teachers/${mentorId}`);
            const data = await res.json();
            setInternCache(p => ({ ...p, [mentorId]: data.interns ?? [] }));
        } finally {
            setInternLoading(p => ({ ...p, [mentorId]: false }));
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Сводная таблица</h3>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-36 text-center">
                        {MONTHS[month - 1]} {year}
                    </span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    {[1,2,3].map(i => (
                        <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
                            <div className="h-4 w-6 bg-gray-100 rounded animate-pulse"/>
                            <div className="h-4 flex-1 max-w-48 bg-gray-100 rounded animate-pulse"/>
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"/>
                        </div>
                    ))}
                </div>
            ) : mentors.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Наставники не найдены</p>
            ) : (
                <div className="rounded-xl border border-gray-100 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-3 text-left w-10">#</th>
                                <th className="px-4 py-3 text-left">ФИО</th>
                                <th className="px-4 py-3 text-left">Подразделение</th>
                                <th className="px-4 py-3 text-center">Стажёры</th>
                                <th className="w-10"/>
                            </tr>
                        </thead>
                        <tbody>
                            {mentors.map((mentor, idx) => (
                                <React.Fragment key={mentor.id}>
                                    <tr
                                        onClick={() => toggleMentor(mentor.id)}
                                        className={`border-b cursor-pointer transition-colors hover:bg-gray-50 ${expanded.has(mentor.id) ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{mentor.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">—</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                                                {mentor.intern_count}
                                            </span>
                                        </td>
                                        <td className="px-3 text-right">
                                            <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${expanded.has(mentor.id) ? 'rotate-90' : ''}`}/>
                                        </td>
                                    </tr>
                                    {expanded.has(mentor.id) && (
                                        <tr>
                                            <td colSpan={5} className="p-0 bg-gray-50 border-b">
                                                {internLoading[mentor.id] ? (
                                                    <p className="px-8 py-4 text-sm text-gray-400">Загрузка стажёров...</p>
                                                ) : (
                                                    <HRInternSubTable
                                                        interns={internCache[mentor.id] ?? []}
                                                        period={period}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}