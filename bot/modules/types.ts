import { Telegraf } from 'telegraf';
import { BotContext, AppUser } from '../middlewares/resolveUser';

export interface BotModule {
    key: string;                              // 'events' | 'hr' | 'notifications' | ...
    title: string;                            // "📅 Мероприятия" — текст кнопки в главном меню
    isVisible: (user: AppUser | null) => boolean;
    register: (bot: Telegraf<BotContext>) => void;
}