import { Markup, session, Scenes } from 'telegraf';
import { bot } from './bot';
import { resolveUser, BotContext } from './middlewares/resolveUser';
import { modules } from './registry';
import { createEventScene } from './modules/events/createScene';
import pool from './db';
import { mainMenuKeyboard } from './menu';

const stage = new Scenes.Stage<BotContext>([createEventScene]);

bot.use(resolveUser);
bot.use(session());
bot.use(stage.middleware());

modules.forEach((m) => m.register(bot));

bot.start(async (ctx) => {
    const userId = parseInt(ctx.startPayload, 10);
    if (!isNaN(userId)) {
        await pool.query(
            'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
            [ctx.chat.id, userId]
        );
        await ctx.reply('Telegram успешно привязан к вашему аккаунту.');
    }
    await ctx.reply('', mainMenuKeyboard(ctx));
});

bot.command('menu', async (ctx) => {
    await ctx.reply('', mainMenuKeyboard(ctx));
});

bot.catch((err, ctx) => {
    console.error(`[bot] Ошибка при обработке обновления ${ctx.updateType}:`, err);
});

bot.launch();
console.log('🤖 Bot started (polling)...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));