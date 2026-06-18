import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {InternProgressWidget} from '@/components';
import type { ApiDayItem } from '@/store';

const meta: Meta<typeof InternProgressWidget> = {
    title: 'Виджеты/InternProgressWidget',
    component: InternProgressWidget,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof InternProgressWidget>;

const INTERNS = [
    { id: 22, name: 'Невара Валентин', crm_id: 2326 },
    { id: 23, name: 'Смирнов Артём',   crm_id: 2327 },
    { id: 24, name: 'Козлова Мария',   crm_id: 2328 },
];

const PLAN = {
    plan_calls: 10,
    plan_conversion: 20,
    plan_revenue_new: 30000,
    plan_revenue_total: 80000,
};

function makeDay(date: string, calls: number, conv: number, revNew: number, revTotal: number): ApiDayItem {
    return {
        date,
        calls:       { total: calls },
        conversions: { newClientConversionPercent: conv },
        cash:        { newClients: revNew, total: revTotal },
    };
}

const GOOD_DATA: ApiDayItem[] = Array.from({ length: 10 }, (_, i) =>
    makeDay(`2026-06-${String(i + 10).padStart(2, '0')}`, 15, 25, 50000, 100000)
);

const MIX_DATA: ApiDayItem[] = [
    makeDay('2026-06-15', 15, 25, 50000, 100000),
    makeDay('2026-06-14', 8,  12, 20000,  60000),
    makeDay('2026-06-13', 15, 22, 45000,  90000),
    makeDay('2026-06-12', 3,  10, 10000,  40000),
    makeDay('2026-06-11', 12, 18, 35000,  85000),
];

export const ВсёВыполнено: Story = {
    args: {
        testData: {
            users: INTERNS,
            raw: INTERNS.map(intern => ({ intern, data: GOOD_DATA })),
            plans: Object.fromEntries(INTERNS.map(i => [i.id, PLAN])),
        },
    },
};

export const СмешанныеРезультаты: Story = {
    args: {
        testData: {
            users: INTERNS,
            raw: [
                { intern: INTERNS[0], data: GOOD_DATA },
                { intern: INTERNS[1], data: MIX_DATA  },
                { intern: INTERNS[2], data: MIX_DATA  },
            ],
            plans: Object.fromEntries(INTERNS.map(i => [i.id, PLAN])),
        },
    },
};

export const БезАдаптации: Story = {
    args: {
        testData: {
            users: INTERNS,
            raw: INTERNS.map(intern => ({ intern, data: [] })),
            plans: Object.fromEntries(INTERNS.map(i => [i.id, null])),
        },
    },
};