import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import CaseQuizTrainer from './CaseQuizTrainer';

const meta: Meta<typeof CaseQuizTrainer> = {
    title: 'Trainers/CaseQuizTrainer',
    component: CaseQuizTrainer,
    tags: ['autodocs'],
    args: {
        onComplete: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof CaseQuizTrainer>;

export const Default: Story = {};