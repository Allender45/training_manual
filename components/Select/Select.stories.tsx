import type { Meta, StoryObj } from '@storybook/react';
import Select from './Select';
import { useState } from 'react';
import React from 'react';

const meta: Meta<typeof Select> = {
    title: 'Components/Select',
    component: Select,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

const OPTIONS = [
    { value: '1', label: 'One' },
    { value: '2', label: 'Two' },
    { value: '3', label: 'Three' },
];

export const Default: Story = {
    render: (args) => {
        const [value, setValue] = useState('');
        return <Select {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
    },
    args: {
        label: 'Select',
        name: 'select',
        options: OPTIONS,
        placeholder: 'Выберите значение',
    },
};

export const Large: Story = {
    render: (args) => {
        const [value, setValue] = useState('');
        return <Select {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
    },
    args: {
        label: 'Large Select',
        name: 'select_lg',
        options: OPTIONS,
        placeholder: 'Выберите значение',
        size: 'lg',
    },
};

export const WithError: Story = {
    render: (args) => {
        const [value, setValue] = useState('');
        return <Select {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
    },
    args: {
        label: 'С ошибкой',
        name: 'select_error',
        options: OPTIONS,
        placeholder: 'Выберите значение',
        error: 'Обязательное поле',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Отключено',
        name: 'select_disabled',
        options: OPTIONS,
        value: '1',
        onChange: () => {},
        disabled: true,
    },
};