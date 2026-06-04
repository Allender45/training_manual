import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import CallCardTrainer from './CallCardTrainer';
import { useUserStore } from '@/store';

const meta: Meta<typeof CallCardTrainer> = {
    title: 'Trainers/CallCardTrainer',
    component: CallCardTrainer,
    tags: ['autodocs'],
    args: {
        onComplete: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof CallCardTrainer>;

export const Default: Story = {};

export const WithUser: Story = {
    decorators: [
        (Story) => {
            useUserStore.setState({
                user: {
                    id: 1,
                    first_name: 'Иван',
                    last_name: 'Иванов',
                    middle_name: 'Петрович',
                    phone: '+79991234567',
                    email: null,
                    photo: null,
                    passport_series: null,
                    passport_number: null,
                    birthday: null,
                    comment: null,
                    registered_at: new Date().toISOString(),
                    role_id: 1,
                    role: 'manager',
                },
                loaded: true,
            });
            return <Story />;
        },
    ],
};