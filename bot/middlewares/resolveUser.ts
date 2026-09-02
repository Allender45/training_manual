import { Context, MiddlewareFn, Scenes } from 'telegraf';
import pool from '../db';

export interface AppUser {
    id: number;
    role_id: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    phone: string;
    department_id: number | null;
}

export interface BotContext extends Context {
    user: AppUser | null;
    scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
    wizard: Scenes.WizardContextWizard<BotContext>;
}

export const resolveUser: MiddlewareFn<BotContext> = async (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
        ctx.user = null;
        return next();
    }

    const { rows } = await pool.query(
        'SELECT id, role_id, first_name, last_name, middle_name, phone, department_id FROM users WHERE telegram_chat_id = $1 AND is_active = true',
        [chatId]
    );
    ctx.user = rows[0] ?? null;
    return next();
};