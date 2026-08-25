import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { createLead, getVacancy } from './service';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

export const leadScene = new Scenes.WizardScene<BotContext>(
    'hr-lead',

    async (ctx) => {
        const vacancy = await getVacancy((ctx.wizard.state as any).vacancyId);
        if (!vacancy) {
            await ctx.reply('Вакансия не найдена.');
            return ctx.scene.leave();
        }
        const text = `💼 *${vacancy.title}*\n\n${vacancy.description}`;
        if (vacancy.image_url) {
            await ctx.replyWithPhoto(vacancy.image_url, { caption: text, parse_mode: 'Markdown' });
        } else {
            await ctx.reply(text, { parse_mode: 'Markdown' });
        }
        await ctx.reply('Если вакансия заинтересовала — оставьте заявку.\nКак вас зовут?', Markup.removeKeyboard());
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).fullName = ctx.message.text.trim();
        await ctx.reply('Укажите номер телефона для связи.\nФормат без +7, сразу 10 цифр, например: 9631234567');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const phone = ctx.message.text.trim();
        if (!/^\d{10}$/.test(phone)) {
            await ctx.reply('Неверный формат. Введите номер без +7, ровно 10 цифр, например: 9631234567');
            return;
        }
        const state = ctx.wizard.state as any;
        await createLead({
            vacancyId: state.vacancyId,
            referrerUserId: state.referrerUserId,
            telegramId: ctx.chat!.id,
            fullName: state.fullName,
            phone,
        });
        await ctx.reply('✅ Спасибо! Ваша заявка передана, с вами свяжутся.');
        return ctx.scene.leave();
    },
);