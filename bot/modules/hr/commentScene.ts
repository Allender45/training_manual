import { Scenes } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { updateLeadComment, getLead } from './service';
import { leadDetailsKeyboard, STATUS_LABELS } from './keyboards';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

export const leadCommentScene = new Scenes.WizardScene<BotContext>(
    'hr-lead-comment',

    async (ctx) => {
        await ctx.reply('Введите комментарий по отклику:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const leadId = (ctx.wizard.state as any).leadId;
        await updateLeadComment(leadId, ctx.message.text.trim());
        const lead = await getLead(leadId);
        if (!lead) {
            await ctx.reply('Отклик не найден.');
            return ctx.scene.leave();
        }
        const text = `👤 *${lead.full_name}*\n📞 [${lead.phone}](tg://user?id=${lead.telegram_id})\nСтатус: ${STATUS_LABELS[lead.status] ?? lead.status}${lead.comment ? `\n💬 ${lead.comment}` : ''}`;
        await ctx.reply(text, { parse_mode: 'Markdown', ...leadDetailsKeyboard(lead) });
        return ctx.scene.leave();
    },
);