import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['primary', 'secondary', 'outline'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        children: 'Войти',
        variant: 'primary',
        size: 'md',
    },
};

export const Secondary: Story = {
    args: {
        children: 'Отмена',
        variant: 'secondary',
        size: 'md',
    },
};

export const Outline: Story = {
    args: {
        children: 'Подробнее',
        variant: 'outline',
        size: 'md',
    },
};

export const Loading: Story = {
    args: {
        children: 'Загрузка...',
        variant: 'primary',
        loading: true,
    },
};

export const Disabled: Story = {
    args: {
        children: 'Недоступно',
        variant: 'primary',
        disabled: true,
    },
};

export const Small: Story = {
    args: {
        children: 'Маленькая',
        variant: 'primary',
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        children: 'Большая',
        variant: 'primary',
        size: 'lg',
    },
};
