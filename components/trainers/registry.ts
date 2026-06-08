import { ComponentType } from 'react';
import { CallCardTrainer, CaseQuizTrainer, PricingQuizTrainer } from '@/components';

export const TrainerRegistry: Record<string, ComponentType<any>> = {
    CallCardTrainer,
    CaseQuizTrainer,
    PricingQuizTrainer,
};