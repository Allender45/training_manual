import { session, Scenes } from 'telegraf';
import { bot } from './bot';
import { resolveUser, BotContext } from './middlewares/resolveUser';
import { modules } from './registry';
import { createEventScene } from './modules/events/createScene';
import pool from './db';
import { mainMenuKeyboard } from './menu';
import { createVacancyScene } from './modules/hr/createVacancyScene';
import { leadScene } from './modules/hr/leadScene';
import { leadCommentScene } from './modules/hr/commentScene';
import { createNewsScene } from './modules/news/createNewsScene';

const stage = new Scenes.Stage<BotContext>([createEventScene, createVacancyScene, leadScene, leadCommentScene, createNewsScene]);

bot.use(resolveUser);
bot.use(session());
bot.use(stage.middleware());

modules.forEach((m) => m.register(bot));

bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    const vacMatch = /^vac(\d+)_(\d+)$/.exec(payload);
    if (vacMatch) {
        await ctx.scene.enter('hr-lead', {
            vacancyId: Number(vacMatch[1]),
            referrerUserId: Number(vacMatch[2]),
        });
        return;
    }
    const userId = parseInt(payload, 10);
    if (!isNaN(userId)) {
        await pool.query(
            'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
            [ctx.chat.id, userId]
        );
        await ctx.reply('Telegram успешно привязан к вашему аккаунту.');
    }
    await ctx.reply('Меню:', mainMenuKeyboard(ctx));
});

bot.command('menu', async (ctx) => {
    await ctx.reply('Меню:', mainMenuKeyboard(ctx));
});

bot.hears('🏠 Домой', async (ctx) => {
    await ctx.reply('Меню:', mainMenuKeyboard(ctx));
});

bot.catch((err, ctx) => {
    console.error(`[bot] Ошибка при обработке обновления ${ctx.updateType}:`, err);
});

bot.launch();
console.log('🤖 Bot started (polling)...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));