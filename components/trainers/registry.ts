import { ComponentType } from 'react';
import { CallCardTrainer, CaseQuizTrainer, PricingQuizTrainer, NewOrderTrainer, FullOrderCreate } from '@/components';

export const TrainerRegistry: Record<string, ComponentType<any>> = {
    CallCardTrainer,
    CaseQuizTrainer,
    PricingQuizTrainer,
    NewOrderTrainer,
    FullOrderCreate,
};