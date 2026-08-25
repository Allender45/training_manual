import { Scenes } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { createNews, getActiveTelegramChatIds } from './service';
import { mainMenuKeyboard } from '../../menu';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

function isPhoto(ctx: BotContext): ctx is BotContext & { message: { photo: { file_id: string }[] } } {
    return !!ctx.message && 'photo' in ctx.message;
}

export const createNewsScene = new Scenes.WizardScene<BotContext>(
    'create-news',

    async (ctx) => {
        (ctx.wizard.state as any).data = {};
        await ctx.reply('Введите заголовок новости:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.title = ctx.message.text;
        await ctx.reply('Введите текст новости:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.body = ctx.message.text;
        await ctx.reply('Отправьте фото для новости или напишите "-", чтобы пропустить:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        const state = ctx.wizard.state as any;
        let imageUrl: string | null = null;
        if (isPhoto(ctx)) {
            const photos = ctx.message.photo;
            imageUrl = photos[photos.length - 1].file_id;
        } else if (isText(ctx) && ctx.message.text.trim() === '-') {
            imageUrl = null;
        } else {
            await ctx.reply('Отправьте фото или "-", чтобы пропустить.');
            return;
        }

        const newsId = await createNews({
            title: state.data.title,
            body: state.data.body,
            imageUrl,
            createdBy: ctx.user!.id,
        });

        const chatIds = await getActiveTelegramChatIds();
        const text = `📰 *${state.data.title}*\n\n${state.data.body}`;
        let sent = 0;
        for (const chatId of chatIds) {
            try {
                if (imageUrl) {
                    await ctx.telegram.sendPhoto(chatId, imageUrl, { caption: text, parse_mode: 'Markdown' });
                } else {
                    await ctx.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
                }
                sent++;
            } catch (e) {
                console.error(`[news] Не удалось отправить новость пользователю ${chatId}:`, e);
            }
        }

        await ctx.reply(`✅ Новость «${state.data.title}» создана (id ${newsId}) и разослана ${sent} пользователям.`);
        await ctx.reply('Новости', mainMenuKeyboard(ctx));
        return ctx.scene.leave();
    },
);