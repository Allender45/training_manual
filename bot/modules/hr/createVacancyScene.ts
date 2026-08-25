import { Scenes } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { createVacancy } from './service';
import { mainMenuKeyboard } from '../../menu';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

function isPhoto(ctx: BotContext): ctx is BotContext & { message: { photo: { file_id: string }[] } } {
    return !!ctx.message && 'photo' in ctx.message;
}

export const createVacancyScene = new Scenes.WizardScene<BotContext>(
    'create-vacancy',

    async (ctx) => {
        (ctx.wizard.state as any).data = {};
        await ctx.reply('Введите название вакансии:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.title = ctx.message.text;
        await ctx.reply('Введите описание вакансии:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.description = ctx.message.text;
        await ctx.reply('Отправьте фото для вакансии или напишите "-", чтобы пропустить:');
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

        const vacancyId = await createVacancy({
            title: state.data.title,
            description: state.data.description,
            imageUrl,
            createdBy: ctx.user!.id,
        });

        await ctx.reply(`✅ Вакансия «${state.data.title}» создана (id ${vacancyId}).`);
        await ctx.reply('Кадры', mainMenuKeyboard(ctx));
        return ctx.scene.leave();
    },
);