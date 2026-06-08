import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import PricingQuizTrainer from './PricingQuizTrainer';

const meta: Meta<typeof PricingQuizTrainer> = {
    title: 'Trainers/PricingQuizTrainer',
    component: PricingQuizTrainer,
    tags: ['autodocs'],
    args: {
        onComplete: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof PricingQuizTrainer>;

export const Default: Story = {};