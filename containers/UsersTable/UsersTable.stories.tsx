import type { Meta, StoryObj } from '@storybook/react';
import UsersTable, { UserRow } from './UsersTable';

const meta: Meta<typeof UsersTable> = {
    title: 'Containers/UsersTable',
    component: UsersTable,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof UsersTable>;

const mockData: UserRow[] = [
    { id: 1,  name: 'Jane Cooper',    email: 'jane.cooper@example.com',    phone: '9658745874', role: 'Администратор', active: true,  photo: null, mentor_name: null,               crm_id: 101, adaptation_access: true,  courses_completed: 5, courses_total: 8, department_id: 1 },
    { id: 2,  name: 'John Doe',       email: 'john.doe@example.com',       phone: '9876543210', role: 'Сотрудник',     active: false, photo: null, mentor_name: 'Jane Cooper',      crm_id: 102, adaptation_access: false, courses_completed: 2, courses_total: 8, department_id: 1 },
    { id: 3,  name: 'Sarah Connor',   email: 'sarah.connor@example.com',   phone: '8541234567', role: 'Гость',         active: false, photo: null, mentor_name: null,               crm_id: null, adaptation_access: false, courses_completed: 0, courses_total: 8, department_id: null },
    { id: 4,  name: 'Michael Scott',  email: 'michael.scott@example.com',  phone: '9456781230', role: 'Администратор', active: true,  photo: null, mentor_name: null,               crm_id: 104, adaptation_access: true,  courses_completed: 8, courses_total: 8, department_id: 2 },
    { id: 5,  name: 'Angela Martin',  email: 'angela.martin@example.com',  phone: '9654789652', role: 'Сотрудник',     active: false, photo: null, mentor_name: 'Michael Scott',    crm_id: 105, adaptation_access: false, courses_completed: 3, courses_total: 8, department_id: 2 },
];

export const Default: Story = {
    args: { data: mockData },
};

export const Empty: Story = {
    args: { data: [] },
};

export const WithCallbacks: Story = {
    args: {
        data: mockData,
        onEdit:   (row) => alert(`Edit: ${row.name}`),
        onDelete: (row) => alert(`Delete: ${row.name}`),
    },
};