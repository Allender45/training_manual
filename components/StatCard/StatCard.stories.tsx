import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import StatCard from './StatCard';
import { CalendarDays, CalendarCheck, Users, BookOpen, DollarSign } from 'lucide-react';

const meta: Meta<typeof StatCard> = {
    title: 'Components/StatCard',
    component: StatCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const DateStart: Story = {
    args: {
        label: 'Дата начала',
        value: '01.02.2025',
        sub: 'План: Базовая адаптация',
        icon: CalendarDays,
        color: 'bg-blue-100 text-blue-600',
    },
};

export const DateEnd: Story = {
    args: {
        label: 'Дата окончания',
        value: '01.05.2025',
        sub: '3 месяца с начала',
        icon: CalendarCheck,
        color: 'bg-green-100 text-green-600',
    },
};

export const WithoutSub: Story = {
    args: {
        label: 'Пользователи',
        value: '10 689',
        icon: Users,
        color: 'bg-purple-100 text-purple-600',
    },
};

export const Courses: Story = {
    args: {
        label: 'Курсы',
        value: '405',
        sub: 'Активных',
        icon: BookOpen,
        color: 'bg-red-100 text-red-500',
    },
};

export const Revenue: Story = {
    args: {
        label: 'Выручка',
        value: '₽ 64 364',
        sub: 'За текущий месяц',
        icon: DollarSign,
        color: 'bg-green-100 text-green-600',
    },
};