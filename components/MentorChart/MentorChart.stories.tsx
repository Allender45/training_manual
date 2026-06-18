import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import MentorChart from './MentorChart';
import type { ApiDayItem } from '@/store';

const meta: Meta<typeof MentorChart> = {
    title: 'Виджеты/MentorChart',
    component: MentorChart,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MentorChart>;

const MOCK_INTERNS = [
    { id: 22, name: 'Невара Валентин', crm_id: 2326 },
    { id: 23, name: 'Смирнов Артём',   crm_id: 2327 },
];

function makeStats(seed: number): ApiDayItem[] {
    return Array.from({ length: 18 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        calls:       { total: 5 + ((seed + i * 3) % 20) },
        conversions: { newClientConversionPercent: 5 + ((seed + i * 7) % 30) },
        cash:        { newClients: 10000 + ((seed + i * 1234) % 50000), total: 60000 + ((seed + i * 4321) % 80000) },
    }));
}

const MOCK_RAW = [
    { intern: MOCK_INTERNS[0], data: makeStats(17) },
    { intern: MOCK_INTERNS[1], data: makeStats(42) },
];

export const СДанными: Story = {
    args: {
        testData: { interns: MOCK_INTERNS, raw: MOCK_RAW },
    },
};

export const БезДанных: Story = {
    args: {
        testData: {
            interns: MOCK_INTERNS,
            raw: MOCK_INTERNS.map(intern => ({ intern, data: [] as ApiDayItem[] })),
        },
    },
};

export const НетСтажёров: Story = {
    args: {
        testData: { interns: [], raw: [] },
    },
};