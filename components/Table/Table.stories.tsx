import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Table, { Column } from './Table';

type ControlArgs = {
    buttonEdit: boolean;
    buttonDel: boolean;
    emptyText: string;
    showEmpty: boolean;
};

const meta: Meta<ControlArgs> = {
    title: 'Components/Table',
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    argTypes: {
        buttonEdit: { control: 'boolean', name: 'Кнопка редактирования' },
        buttonDel:  { control: 'boolean', name: 'Кнопка удаления'       },
        emptyText:  { control: 'text',    name: 'Текст пустой таблицы'  },
        showEmpty:  { control: 'boolean', name: 'Показать пустую таблицу' },
    },
    args: {
        buttonEdit: false,
        buttonDel:  false,
        emptyText:  'Нет данных',
        showEmpty:  false,
    },
};
export default meta;

type Story = StoryObj<ControlArgs>;

type RoleRow = { id: number; name: string; active: boolean; comment: string };

const data: RoleRow[] = [
    { id: 1, name: 'Администратор', active: true,  comment: 'Полный доступ' },
    { id: 2, name: 'Сотрудник',     active: true,  comment: ''              },
    { id: 3, name: 'Гость',         active: false, comment: 'Только чтение' },
];

const columns: Column<RoleRow>[] = [
    { key: 'name', header: 'Название' },
    {
        key: 'active', header: 'Активна',
        render: (row) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                row.active ? 'bg-[#41A141] text-white' : 'bg-gray-100 text-gray-500'
            }`}>
                {row.active ? 'Активна' : 'Неактивна'}
            </span>
        ),
    },
    { key: 'comment', header: 'Комментарий' },
];

export const Interactive: Story = {
    render: ({ buttonEdit, buttonDel, emptyText, showEmpty }) => (
        <Table<RoleRow>
            columns={columns}
            data={showEmpty ? [] : data}
            keyField="id"
            emptyText={emptyText}
            buttonEdit={buttonEdit}
            buttonDel={buttonDel}
            onEdit={(row) => alert(`Edit: ${row.name}`)}
            onDelete={(row) => alert(`Delete: ${row.name}`)}
        />
    ),
};

export const WithActions: Story = {
    args: { buttonEdit: true, buttonDel: true },
    render: ({ buttonEdit, buttonDel, emptyText }) => (
        <Table<RoleRow>
            columns={columns}
            data={data}
            keyField="id"
            emptyText={emptyText}
            buttonEdit={buttonEdit}
            buttonDel={buttonDel}
            onEdit={(row) => alert(`Edit: ${row.name}`)}
            onDelete={(row) => alert(`Delete: ${row.name}`)}
        />
    ),
};

export const Empty: Story = {
    args: { showEmpty: true },
    render: ({ buttonEdit, buttonDel, emptyText }) => (
        <Table<RoleRow> columns={columns} data={[]} keyField="id" emptyText={emptyText} buttonEdit={buttonEdit} buttonDel={buttonDel} />
    ),
};