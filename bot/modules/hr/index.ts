import { BotModule } from '../types';
import { BotContext } from '../../middlewares/resolveUser';
import { getOpenVacancies, getVacancy, closeVacancy, deleteVacancy, getVacancyLeads, getLead, updateLeadStatus, getAllLeads } from './service';
import { vacanciesListKeyboard, vacancyDetailsKeyboard, buildReferralLink, leadsListKeyboard, leadDetailsKeyboard, allLeadsListKeyboard, STATUS_LABELS } from './keyboards';
import { isAdmin } from '../../permissions';
import { Markup } from 'telegraf';
import QRCode from 'qrcode';

async function renderVacanciesList(ctx: BotContext) {
    const vacancies = await getOpenVacancies();
    if (vacancies.length === 0) {
        await ctx.reply('Пока нет открытых вакансий.');
        return;
    }
    await ctx.reply('Открытые вакансии:', vacanciesListKeyboard(vacancies));
}

async function renderVacancyCard(ctx: BotContext, vacancyId: number) {
    const vacancy = await getVacancy(vacancyId);
    if (!vacancy) {
        await ctx.answerCbQuery('Вакансия не найдена');
        return;
    }
    const canManage = isAdmin(ctx.user);
    const text = `💼 *${vacancy.title}*\n\n${vacancy.description}`;
    const kb = vacancyDetailsKeyboard(vacancyId, canManage, ctx.user?.id ?? null);
    if (vacancy.image_url) {
        await ctx.replyWithPhoto(vacancy.image_url, { caption: text, parse_mode: 'Markdown', ...kb });
    } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...kb });
    }
}

async function renderLeadsList(ctx: BotContext, vacancyId: number) {
    const leads = await getVacancyLeads(vacancyId);
    if (leads.length === 0) {
        await ctx.reply('Пока нет откликов.', Markup.inlineKeyboard([[Markup.button.callback('⬅️ К вакансии', `vac:view:${vacancyId}`)]]));
        return;
    }
    await ctx.reply('Отклики на вакансию:', leadsListKeyboard(vacancyId, leads));
}

async function renderLeadCard(ctx: BotContext, leadId: number) {
    const lead = await getLead(leadId);
    if (!lead) {
        await ctx.answerCbQuery('Отклик не найден');
        return;
    }
    const text = `👤 *${lead.full_name}*\n📞 [${lead.phone}](tg://user?id=${lead.telegram_id})\nСтатус: ${STATUS_LABELS[lead.status] ?? lead.status}${lead.comment ? `\n💬 ${lead.comment}` : ''}`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...leadDetailsKeyboard(lead) });
}

async function renderAllLeadsList(ctx: BotContext) {
    const leads = await getAllLeads();
    if (leads.length === 0) {
        await ctx.reply('Пока нет откликов.');
        return;
    }
    await ctx.reply('Все отклики:', allLeadsListKeyboard(leads));
}

export const hrModule: BotModule = {
    key: 'hr',
    title: '🧑‍💼 Кадры',
    isVisible: () => true,
    register: (bot) => {
        bot.hears('🧑‍💼 Кадры', async (ctx) => {
            await renderVacanciesList(ctx);
            if (isAdmin(ctx.user)) {
                await ctx.reply('Кадры', Markup.keyboard([
                    ['➕ Добавить вакансию'],
                    ['📋 Все отклики'],
                    ['🏠 Домой'],
                ]).resize());
            }
        });

        bot.hears('➕ Добавить вакансию', async (ctx) => {
            if (!isAdmin(ctx.user)) return;
            await ctx.scene.enter('create-vacancy');
        });

        bot.hears('📋 Все отклики', async (ctx) => {
            if (!isAdmin(ctx.user)) return;
            await renderAllLeadsList(ctx);
        });

        bot.action('vac:list', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderVacanciesList(ctx);
        });

        bot.action(/^vac:view:(\d+)$/, async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderVacancyCard(ctx, Number(ctx.match[1]));
        });

        bot.action(/^vac:close:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const vacancyId = Number(ctx.match[1]);
            await closeVacancy(vacancyId);
            await ctx.answerCbQuery('Вакансия закрыта');
            await ctx.deleteMessage().catch(() => {});
            await renderVacanciesList(ctx);
        });

        bot.action(/^vac:delete:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const vacancyId = Number(ctx.match[1]);
            await deleteVacancy(vacancyId);
            await ctx.answerCbQuery('Удалено');
            await ctx.deleteMessage().catch(() => {});
            await renderVacanciesList(ctx);
        });

        bot.action(/^vac:refer:(\d+):(\d+)$/, async (ctx) => {
            await ctx.answerCbQuery();
            const vacancyId = Number(ctx.match[1]);
            const referrerUserId = Number(ctx.match[2]);
            const link = buildReferralLink(vacancyId, referrerUserId);
            await ctx.reply(`Ссылка для кандидата (нажмите на неё, чтобы скопировать):\n\n\`${link}\``, { parse_mode: 'Markdown' });
        });

        bot.action(/^vac:qr:(\d+):(\d+)$/, async (ctx) => {
            await ctx.answerCbQuery();
            const vacancyId = Number(ctx.match[1]);
            const referrerUserId = Number(ctx.match[2]);
            const link = buildReferralLink(vacancyId, referrerUserId);
            const qrBuffer = await QRCode.toBuffer(link, { width: 400 });
            await ctx.replyWithPhoto({ source: qrBuffer }, { caption: 'QR-код для кандидата' });
        });

        bot.action(/^vac:leads:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderLeadsList(ctx, Number(ctx.match[1]));
        });

        bot.action(/^lead:view:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await renderLeadCard(ctx, Number(ctx.match[1]));
        });

        bot.action(/^lead:status:(\d+):(\w+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const leadId = Number(ctx.match[1]);
            const status = ctx.match[2];
            await updateLeadStatus(leadId, status);
            await ctx.answerCbQuery('Статус обновлён');
            await ctx.deleteMessage().catch(() => {});
            await renderLeadCard(ctx, leadId);
        });

        bot.action(/^lead:comment:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            await ctx.answerCbQuery();
            await ctx.deleteMessage().catch(() => {});
            await ctx.scene.enter('hr-lead-comment', { leadId: Number(ctx.match[1]) });
        });
    },
};