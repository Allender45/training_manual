import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AdaptationCalendar from './AdaptationCalendar';

const meta: Meta<typeof AdaptationCalendar> = {
    title: 'Components/AdaptationCalendar',
    component: AdaptationCalendar,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AdaptationCalendar>;

const plan = {
    plan_calls: 25,
    plan_conversion: 25.0,
    plan_revenue_new: 5000,
    plan_revenue_total: 8000,
};

const data = [
    { date: '01.05.2026', calls: 18, conversion: 22.1, revenue_new: 4380,  revenue_total: 7050  },
    { date: '05.05.2026', calls: 29, conversion: 29.3, revenue_new: 5780,  revenue_total: 9410  },
    { date: '06.05.2026', calls: 27, conversion: 27.5, revenue_new: 5540,  revenue_total: 8970  },
    { date: '07.05.2026', calls: 16, conversion: 19.0, revenue_new: 3760,  revenue_total: 6100  },
    { date: '12.05.2026', calls: 23, conversion: 25.6, revenue_new: 5120,  revenue_total: 8230  },
    { date: '13.05.2026', calls: 29, conversion: 29.8, revenue_new: 5950,  revenue_total: 9600  },
    { date: '14.05.2026', calls: 19, conversion: 21.0, revenue_new: 4200,  revenue_total: 6750  },
    { date: '19.05.2026', calls: 20, conversion: 22.7, revenue_new: 4540,  revenue_total: 7270  },
    { date: '20.05.2026', calls: 26, conversion: 26.3, revenue_new: 5260,  revenue_total: 8490  },
    { date: '21.05.2026', calls: 18, conversion: 20.8, revenue_new: 4160,  revenue_total: 6660  },
    { date: '26.05.2026', calls: 18, conversion: 28.4, revenue_new: 5680,  revenue_total: 9090  },
    { date: '27.05.2026', calls: 21, conversion: 23.1, revenue_new: 4620,  revenue_total: 7400  },
];

export const Default: Story = {
    args: { data, plan },
};

export const AllGreen: Story = {
    args: {
        data: data.map(d => ({ ...d, calls: 30, conversion: 30.0, revenue_new: 6000, revenue_total: 9000 })),
        plan,
    },
};

export const AllRed: Story = {
    args: {
        data: data.map(d => ({ ...d, calls: 10, conversion: 10.0, revenue_new: 2000, revenue_total: 3000 })),
        plan,
    },
};

export const NoPlan: Story = {
    args: {
        data,
        plan: { plan_calls: null, plan_conversion: null, plan_revenue_new: null, plan_revenue_total: null },
    },
};

export const NoData: Story = {
    args: { data: [], plan },
};