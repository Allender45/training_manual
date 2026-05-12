import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import CKEditorField from './CKEditorField';

const meta: Meta<typeof CKEditorField> = {
    title: 'Components/CKEditorField',
    component: CKEditorField,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof CKEditorField>;

export const Default: Story = {
    render: (args) => {
        const [value, setValue] = useState(args.value ?? '');
        return <CKEditorField {...args} value={value} onChange={setValue} />;
    },
    args: {
        label: 'Содержание',
        placeholder: 'Введите текст материала...',
        minHeight: 160,
        value: '',
    },
};

export const WithContent: Story = {
    render: (args) => {
        const [value, setValue] = useState(args.value ?? '');
        return <CKEditorField {...args} value={value} onChange={setValue} />;
    },
    args: {
        label: 'Описание материала',
        value: '<p>Это <strong>пример</strong> содержания с <em>форматированием</em>.</p><ul><li>Пункт первый</li><li>Пункт второй</li></ul>',
        minHeight: 200,
    },
};

export const NoLabel: Story = {
    render: (args) => {
        const [value, setValue] = useState('');
        return <CKEditorField {...args} value={value} onChange={setValue} />;
    },
    args: {
        placeholder: 'Начните вводить текст...',
        minHeight: 120,
        value: '',
    },
};

export const TallEditor: Story = {
    render: (args) => {
        const [value, setValue] = useState('');
        return <CKEditorField {...args} value={value} onChange={setValue} />;
    },
    args: {
        label: 'Большой редактор',
        placeholder: 'Много текста...',
        minHeight: 320,
        value: '',
    },
};