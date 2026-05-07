import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
    title: 'Components/Avatar',
    component: Avatar,
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
    },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
    args: {
        src: 'https://i.pravatar.cc/150?img=3',
        alt: 'Пользователь',
        size: 'md',
    },
};

export const WithFallback: Story = {
    args: {
        fallback: 'Иван Иванов',
        size: 'md',
    },
};

export const NoImage: Story = {
    args: {
        size: 'md',
    },
};

export const Small: Story = {
    args: {
        fallback: 'АБ',
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        fallback: 'АБ',
        size: 'lg',
    },
};
