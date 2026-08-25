import { BotModule } from '../types';
import { BotContext } from '../../middlewares/resolveUser';
import { getLatestNews, getNews } from './service';
import { newsListKeyboard, newsDetailsKeyboard } from './keyboards';
import { isAdmin } from '../../permissions';
import { Markup } from 'telegraf';

async function renderNewsList(ctx: BotContext) {
    const newsList = await getLatestNews(5);
    if (newsList.length === 0) {
        await ctx.reply('Пока нет новостей.');
        return;
    }
    await ctx.reply('Последние новости:', newsListKeyboard(newsList));
}

async function renderNewsCard(ctx: BotContext, newsId: number) {
    const news = await getNews(newsId);
    if (!news) {
        await ctx.answerCbQuery('Новость не найдена');
        return;
    }
    const date = new Date(news.created_at).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const text = `📰 *${news.title}*\n📅 ${date}\n\n${news.body}`;
    if (news.image_url) {
        await ctx.replyWithPhoto(news.image_url, { caption: text, parse_mode: 'Markdown', ...newsDetailsKeyboard() });
    } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...newsDetailsKeyboard() });
    }
}

export const newsModule: BotModule = {
    key: 'news',
    title: '📰 Новости',
    isVisible: () => true,
    register: (bot) => {
        bot.hears('📰 Новости', async (ctx) => {
            await renderNewsList(ctx);
            if (isAdmin(ctx.user)) {
                await ctx.reply('Новости', Markup.keyboard([
                    ['➕ Добавить новость'],
                    ['🏠 Домой'],
                ]).resize());
            }
        });

        bot.hears('➕ Добавить новость', async (ctx) => {
            if (!isAdmin(ctx.user)) return;
            await ctx.scene.enter('create-news');
        });

        bot.action('news:list', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderNewsList(ctx);
        });

        bot.action(/^news:view:(\d+)$/, async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderNewsCard(ctx, Number(ctx.match[1]));
        });
    },
};