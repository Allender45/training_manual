import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';
import {useState} from "react";
import React from 'react';

const meta: Meta<typeof Input> = {
    title: 'Components/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
        type: { control: 'select', options: ['text', 'email', 'tel', 'password'] },
        icon: { control: 'select', options: ['user', 'email', 'phone', 'lock'] },
    },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        label: 'Имя пользователя',
        name: 'username',
        value: '',
        placeholder: 'Введите имя',
    },
};

export const WithIcon: Story = {
    args: {
        label: 'Email',
        name: 'email',
        type: 'email',
        value: '',
        placeholder: 'example@mail.ru',
        icon: 'email',
    },
};

export const Password: Story = {
    args: {
        label: 'Пароль',
        name: 'password',
        type: 'password',
        value: '',
        placeholder: '••••••••',
        icon: 'lock',
    },
};

export const WithError: Story = {
    args: {
        label: 'Email',
        name: 'email',
        type: 'email',
        value: 'неверный',
        error: 'Введите корректный email',
        icon: 'email',
    },
};

export const Phone: Story = {

    render: (args) => {
        const [value, setValue] = useState('');
        const [phoneError, setPhoneError] = useState<string | null>(null);

        function handlePhoneBlur() {
            const digits = value.replace(/\D/g, '');
            if (digits.length > 0 && digits.length < 11) {
                setPhoneError('Номер должен содержать 12 символов включая +');
            } else {
                setPhoneError(null);
            }
        }

        return (
            <Input
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handlePhoneBlur}
                error={phoneError ?? undefined}
            />
        );
    },
    args: {
        label: 'Телефон',
        name: 'phone',
        type: 'tel',
        placeholder: '+7 (999) 000-00-00',
        icon: 'phone',
    },
};
