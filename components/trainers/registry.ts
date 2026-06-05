import { ComponentType } from 'react';
import CallCardTrainer from './CallCardTrainer/CallCardTrainer';
import CaseQuizTrainer from './CaseQuizTrainer/CaseQuizTrainer';

export const TrainerRegistry: Record<string, ComponentType<any>> = {
    CallCardTrainer,
    CaseQuizTrainer,
};