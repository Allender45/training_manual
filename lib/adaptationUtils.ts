// lib/adaptationUtils.ts
import { PhoneCall, Percent, UserPlus, Wallet } from 'lucide-react';

export type ApiDayItem = {
    date: string;
    calls: { total: number };
    conversions: { newClientConversionPercent: number };
    cash: { newClients: number; total: number };
};

export type AdaptationPlan = {
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

export function computeScore(data: ApiDayItem[], plan: AdaptationPlan) {
    const last5 = [...data]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(d => d.calls.total >= 5)
        .slice(0, 5);
    return {
        calls:    plan.plan_calls     != null ? last5.filter(d => d.calls.total >= plan.plan_calls!).length : 0,
        conv:     plan.plan_conversion != null ? last5.filter(d => d.conversions.newClientConversionPercent >= plan.plan_conversion!).length : 0,
        revNew:   plan.plan_revenue_new   != null ? last5.filter(d => d.cash.newClients >= plan.plan_revenue_new!).length : 0,
        revTotal: plan.plan_revenue_total != null ? last5.filter(d => d.cash.total >= plan.plan_revenue_total!).length : 0,
    };
}

export function scoreColor(s: number) {
    return s === 5 ? 'text-green-600' : s >= 3 ? 'text-amber-500' : 'text-red-500';
}

export const BADGES = [
    { key: 'calls'    as const, Icon: PhoneCall },
    { key: 'conv'     as const, Icon: Percent   },
    { key: 'revNew'   as const, Icon: UserPlus  },
    { key: 'revTotal' as const, Icon: Wallet    },
];