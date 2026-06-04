import { ComponentType } from 'react';
import { CallCardTrainerProps } from './CallCardTrainer/CallCardTrainer';
import CallCardTrainer from './CallCardTrainer/CallCardTrainer';

export const TrainerRegistry: Record<string, ComponentType<CallCardTrainerProps>> = {
    CallCardTrainer,
};