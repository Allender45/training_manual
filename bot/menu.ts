import { Markup } from 'telegraf';
import { BotContext } from './middlewares/resolveUser';
import { modules } from './registry';

export function mainMenuKeyboard(ctx: BotContext) {
    const buttons = modules
        .filter((m) => m.isVisible(ctx.user))
        .map((m) => [m.title]);
    return Markup.keyboard(buttons).resize();
}