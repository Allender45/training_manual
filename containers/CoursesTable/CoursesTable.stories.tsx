import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import CoursesTable from './CoursesTable';
import type { CourseRow } from './CoursesTable';

const meta: Meta<typeof CoursesTable> = {
    title: 'Containers/CoursesTable',
    component: CoursesTable,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'gray' },
        docs: {
            description: {
                component: 'Обёртка над [EntityTable](cci:9://file:///D:/Projects/training_manual/portal/containers/EntityTable:0:0-0:0) с `entityType="courses"`.',
            },
        },
    },
    args: {
        onEdit:   fn(),
        onDelete: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof CoursesTable>;

const SAMPLE_COURSES: CourseRow[] = [
    {
        id: 1, title: 'Основы продаж',
        icon: 'https://placehold.co/56x56/41A141/white?text=📚',
        description: 'Базовый курс для новых сотрудников отдела продаж.',
        study_time_minutes: 90, achievement: 'Продавец новичок',
        is_active: true, created_at: '2025-01-15T10:00:00Z',
    },
    {
        id: 2, title: 'Работа с возражениями',
        icon: 'https://placehold.co/56x56/3B82F6/white?text=💼',
        description: 'Продвинутые техники работы с возражениями клиентов.',
        study_time_minutes: 120, achievement: null,
        is_active: true, created_at: '2025-02-01T10:00:00Z',
    },
    {
        id: 3, title: 'Клиентский сервис',
        icon: 'https://placehold.co/56x56/F59E0B/white?text=⭐',
        description: 'Стандарты обслуживания клиентов компании.',
        study_time_minutes: 60, achievement: 'Мастер сервиса',
        is_active: false, created_at: '2025-03-10T10:00:00Z',
    },
    {
        id: 4, title: 'Безопасность данных',
        icon: 'https://placehold.co/56x56/EF4444/white?text=🔐',
        description: 'Правила информационной безопасности.',
        study_time_minutes: null, achievement: null,
        is_active: true, created_at: '2025-04-05T10:00:00Z',
    },
];

export const Default: Story = {
    args: { data: SAMPLE_COURSES },
};

export const Empty: Story = {
    args: { data: [] },
};

export const SingleRow: Story = {
    args: { data: [SAMPLE_COURSES[0]] },
};

const MANY_COURSES: CourseRow[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    title: `Курс №${i + 1}`,
    icon: `https://placehold.co/56x56/41A141/white?text=${i + 1}`,
    description: `Описание курса №${i + 1}`,
    study_time_minutes: 30 + i * 5,
    achievement: i % 3 === 0 ? `Достижение ${i + 1}` : null,
    is_active: i % 4 !== 0,
    created_at: new Date(2025, i % 12, (i % 28) + 1).toISOString(),
}));

export const WithPagination: Story = {
    args: { data: MANY_COURSES },
};