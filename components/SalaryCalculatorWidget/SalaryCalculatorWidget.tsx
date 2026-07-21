'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/Button/Button';

const OKLAD = 25000;
const BASE_PERCENT = 0.14;
const EXTRA_PERCENT = 0.04;
const DEAL_BONUS = 100;
const NEW_CASH_THRESHOLD = 100000;
const CONVERSION_THRESHOLD = 22;

function formatCurrency(value: number) {
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
}

type CalcInputs = {
    calls: number;
    conversion: number;
    avgCheck: number;
    repeatRevenue: number;
    deals: number;
};

function calculateSalary({ calls, conversion, avgCheck, repeatRevenue, deals }: CalcInputs) {
    const newCash = calls * (conversion / 100) * avgCheck;
    const totalCash = newCash + repeatRevenue;

    const isNewCashReached = newCash >= NEW_CASH_THRESHOLD;
    const isConvReached = conversion >= CONVERSION_THRESHOLD;

    const basePercent = totalCash * BASE_PERCENT;
    const bonusNew = isNewCashReached ? totalCash * EXTRA_PERCENT : 0;
    const bonusConv = isConvReached ? totalCash * EXTRA_PERCENT : 0;
    const dealsBonus = deals * DEAL_BONUS;
    const total = OKLAD + basePercent + bonusNew + bonusConv + dealsBonus;

    return { newCash, totalCash, basePercent, bonusNew, bonusConv, dealsBonus, total, isNewCashReached, isConvReached };
}

export default function SalaryCalculatorWidget() {
    const [calls, setCalls] = useState(450);
    const [conversion, setConversion] = useState(24);
    const [avgCheck, setAvgCheck] = useState(1000);
    const [repeatRevenue, setRepeatRevenue] = useState(30000);
    const [deals, setDeals] = useState(12);
    const [showModal, setShowModal] = useState(false);

    const quick = calculateSalary({ calls, conversion, avgCheck, repeatRevenue: 0, deals: 0 });
    const full = calculateSalary({ calls, conversion, avgCheck, repeatRevenue, deals });

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Калькулятор зарплаты</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Принятых звонков</label>
                    <input
                        type="number"
                        min={0}
                        value={calls}
                        onChange={e => setCalls(Number(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Средний чек, ₽</label>
                    <input
                        type="number"
                        min={0}
                        value={avgCheck}
                        onChange={e => setAvgCheck(Number(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Конверсия, %</label>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={conversion}
                        onChange={e => setConversion(Number(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-600">Ожидаемая зарплата</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(quick.total)}</span>
            </div>

            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
                    Подробнее
                </Button>
            </div>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Мотивация менеджера (до 3 месяцев)</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Принятых звонков</label>
                                <input type="number" min={0} value={calls} onChange={e => setCalls(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Конверсия, % <span className="text-gray-400 font-normal">от принятых звонков</span>
                                </label>
                                <input type="number" min={0} max={100} value={conversion} onChange={e => setConversion(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Средний чек, ₽</label>
                                <input type="number" min={0} value={avgCheck} onChange={e => setAvgCheck(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Повторники, ₽ <span className="text-gray-400 font-normal">доп. выручка от повторных продаж</span>
                                </label>
                                <input type="number" min={0} value={repeatRevenue} onChange={e => setRepeatRevenue(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Переданные сделки <span className="text-gray-400 font-normal">бонус 100 ₽ за каждую</span>
                                </label>
                                <input type="number" min={0} value={deals} onChange={e => setDeals(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 flex flex-wrap gap-x-4 gap-y-1 mb-4">
                            <span>Оклад: <strong>25 000 ₽</strong></span>
                            <span>Базовый %: <strong>14%</strong></span>
                            <span>+4% за кассу новых ≥ 100 000</span>
                            <span>+4% за конверсию ≥ 22%</span>
                            <span>Бонус за сделку: <strong>100 ₽</strong></span>
                        </div>

                        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                            <div className="flex justify-between px-4 py-2 bg-gray-50 text-sm">
                                <span className="text-gray-600">📊 Касса от новых</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.newCash)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 bg-gray-50 text-sm">
                                <span className="text-gray-600">📊 Общая касса</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.totalCash)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 text-sm">
                                <span className="text-gray-600">Оклад</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(OKLAD)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 text-sm">
                                <span className="text-gray-600">% от кассы (базовый 14%)</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.basePercent)}</span>
                            </div>
                            <div className={`flex justify-between px-4 py-2 text-sm ${full.isNewCashReached ? '' : 'opacity-40'}`}>
                                <span className="text-gray-600">
                                    ➕ 4% за кассу от новых (≥ 100 000)
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${full.isNewCashReached ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {full.isNewCashReached ? '✅ достигнут' : '❌ не достигнут'}
                                    </span>
                                </span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.bonusNew)}</span>
                            </div>
                            <div className={`flex justify-between px-4 py-2 text-sm ${full.isConvReached ? '' : 'opacity-40'}`}>
                                <span className="text-gray-600">
                                    ➕ 4% за конверсию (≥ 22%)
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${full.isConvReached ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {full.isConvReached ? '✅ достигнут' : '❌ не достигнут'}
                                    </span>
                                </span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.bonusConv)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 text-sm">
                                <span className="text-gray-600">Бонус за сделки (100 ₽/шт)</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(full.dealsBonus)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-blue-50 rounded-b-xl">
                                <span className="font-bold text-gray-800">ИТОГО ЗАРПЛАТА</span>
                                <span className="text-lg font-bold text-blue-700">{formatCurrency(full.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}