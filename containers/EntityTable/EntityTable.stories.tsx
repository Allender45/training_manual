import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import EntityTable from './EntityTable';
import type { CourseRow, ManualRow, TrainingRow, TestRow } from '@/containers';

const meta: Meta<typeof EntityTable> = {
    title: 'Containers/EntityTable',
    component: EntityTable,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'gray' },
    },
    args: {
        onEdit:   fn(),
        onDelete: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EntityTable>;

// --- Sample data ---

const COURSES: CourseRow[] = [
    { id: 1, title: 'Основы продаж', icon: 'https://placehold.co/56x56/41A141/white?text=📚', description: 'Базовый курс для новых сотрудников.', study_time_minutes: 90, achievement: 'Продавец новичок', is_active: true, created_at: '2025-01-15T10:00:00Z', prerequisite_course_id: null, is_locked: false },
    { id: 2, title: 'Работа с возражениями', icon: 'https://placehold.co/56x56/3B82F6/white?text=💼', description: 'Продвинутые техники.', study_time_minutes: 120, achievement: null, is_active: true, created_at: '2025-02-01T10:00:00Z', prerequisite_course_id: 1, is_locked: false },
    { id: 3, title: 'Клиентский сервис', icon: 'https://placehold.co/56x56/F59E0B/white?text=⭐', description: 'Стандарты обслуживания.', study_time_minutes: 60, achievement: 'Мастер сервиса', is_active: false, created_at: '2025-03-10T10:00:00Z', prerequisite_course_id: null, is_locked: false },
    { id: 4, title: 'Безопасность данных', icon: 'https://placehold.co/56x56/EF4444/white?text=🔐', description: 'Информационная безопасность.', study_time_minutes: null, achievement: null, is_active: true, created_at: '2025-04-05T10:00:00Z', prerequisite_course_id: null, is_locked: true },
];

const MANUALS: ManualRow[] = [
    { id: 1, title: 'Руководство по продажам', icon: 'https://placehold.co/56x56/41A141/white?text=📖', type: 'text', description: 'Полное руководство для менеджеров по продажам.', content: null, course_id: null, course_title: null, prerequisite_id: null, comment: null, is_active: true, created_at: '2025-01-10T10:00:00Z' },
    { id: 2, title: 'Стандарты сервиса', icon: 'https://placehold.co/56x56/3B82F6/white?text=📖', type: 'text', description: 'Корпоративные стандарты обслуживания клиентов.', content: null, course_id: null, course_title: null, prerequisite_id: null, comment: null, is_active: true, created_at: '2025-02-05T10:00:00Z' },
    { id: 3, title: 'Политика безопасности', icon: 'https://placehold.co/56x56/EF4444/white?text=📖', type: 'text', description: 'Корпоративные стандарты обслуживания клиентов.', content: null, course_id: null, course_title: null, prerequisite_id: null, comment: null, is_active: false, created_at: '2025-03-01T10:00:00Z' },
    { id: 4, title: 'Онбординг новых сотрудников', icon: 'https://placehold.co/56x56/F59E0B/white?text=📖', type: 'video', description: 'Материалы для ознакомления с компанией.', content: null, course_id: null, course_title: null, prerequisite_id: null, comment: null, is_active: true, created_at: '2025-04-12T10:00:00Z' },
];

const TRAININGS: TrainingRow[] = [
    { id: 1, title: 'Тренинг по переговорам', description: 'Практические техники ведения переговоров.', is_active: true, created_at: '2025-01-20T10:00:00Z' },
    { id: 2, title: 'Командообразование', description: 'Упражнения и методики для сплочения команды.', is_active: true, created_at: '2025-02-15T10:00:00Z' },
    { id: 3, title: 'Управление временем', description: null, is_active: false, created_at: '2025-03-08T10:00:00Z' },
];

const TESTS: TestRow[] = [
    { id: 1, title: 'Тест: Основы продаж', time_limit: 30, shuffle_questions: false, shuffle_answers: false, course_id: 1, course_title: 'Основы продаж', is_active: true, created_at: '2025-01-16T10:00:00Z' },
    { id: 2, title: 'Тест: Безопасность данных', time_limit: 45, shuffle_questions: true, shuffle_answers: true, course_id: 4, course_title: 'Безопасность данных', is_active: true, created_at: '2025-04-06T10:00:00Z' },
    { id: 3, title: 'Тест: Клиентский сервис', time_limit: null, shuffle_questions: false, shuffle_answers: false, course_id: null, course_title: null, is_active: false, created_at: '2025-03-11T10:00:00Z' },
];

// --- Courses ---

export const Courses: Story = {
    name: 'Courses / Default',
    args: { entityType: 'courses', data: COURSES },
};

export const CoursesEmpty: Story = {
    name: 'Courses / Empty',
    args: { entityType: 'courses', data: [] },
};

export const CoursesPagination: Story = {
    name: 'Courses / With Pagination',
    args: {
        entityType: 'courses',
        data: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: `Курс №${i + 1}`,
            icon: `https://placehold.co/56x56/41A141/white?text=${i + 1}`,
            description: `Описание курса №${i + 1}`,
            study_time_minutes: 30 + i * 5,
            achievement: i % 3 === 0 ? `Достижение ${i + 1}` : null,
            is_active: i % 4 !== 0,
            created_at: new Date(2025, i % 12, (i % 28) + 1).toISOString(),
            prerequisite_course_id: null,
            is_locked: false,
        })),
    },
};

// --- Manuals ---

export const Manuals: Story = {
    name: 'Manuals / Default',
    args: { entityType: 'manuals', data: MANUALS },
};

export const ManualsEmpty: Story = {
    name: 'Manuals / Empty',
    args: { entityType: 'manuals', data: [] },
};

// --- Trainings ---

export const Trainings: Story = {
    name: 'Trainings / Default',
    args: { entityType: 'trainings', data: TRAININGS },
};

// --- Tests ---

export const Tests: Story = {
    name: 'Tests / Default',
    args: { entityType: 'tests', data: TESTS },
};

export const TestsEmpty: Story = {
    name: 'Tests / Empty',
    args: { entityType: 'tests', data: [] },
};