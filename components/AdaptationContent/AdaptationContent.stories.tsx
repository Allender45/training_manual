import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AdaptationContent from './AdaptationContent';

const meta: Meta<typeof AdaptationContent> = {
    title: 'Components/AdaptationContent',
    component: AdaptationContent,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AdaptationContent>;

const mockAdaptation = {
    id: 1,
    started_at: '2026-01-01',
    plan_name: 'Базовый план',
    plan_calls: 25,
    plan_conversion: 25.0,
    plan_revenue_new: 5000,
    plan_revenue_total: 8000,
};

function makeFetch(adaptation: object | null, dayData: object[]) {
    return async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/adaptations/statistics')) {
            return new Response(JSON.stringify({ data: dayData }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/api/adaptations/')) {
            return new Response(JSON.stringify({ adaptation }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
}

export const WithRealData: Story = {
    loaders: [
        async () => {
            try {
                const res = await fetch('/api/users');
                if (!res.ok) return { userId: 1 };
                const { users } = await res.json();
                const u = users?.find((u: any) => u.crm_id === 2326);
                return { userId: u?.id ?? 1 };
            } catch {
                return { userId: 1 };
            }
        },
    ],
    render: (_args, { loaded }) => (
        <AdaptationContent userId={loaded.userId} crmUserId={2326} />
    ),
    args: { userId: 1, crmUserId: 2326 },
};

export const NoAdaptation: Story = {
    beforeEach() { global.fetch = makeFetch(null, []) as typeof fetch; },
    args: { userId: 1, crmUserId: null },
};

export const NoCrmId: Story = {
    beforeEach() { global.fetch = makeFetch(mockAdaptation, []) as typeof fetch; },
    args: { userId: 1, crmUserId: null },
};