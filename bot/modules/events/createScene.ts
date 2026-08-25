import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { createEvent, getDepartments } from './service';
import { buildCalendarKeyboard, buildHourKeyboard, buildMinuteKeyboard } from '../../widgets/calendar';
import { mainMenuKeyboard } from '../../menu';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

const SLOTS_STEP = 4;
const VISIBILITY_STEP = 7;
const HIDE_STEP = 9;

export const createEventScene = new Scenes.WizardScene<BotContext>(
    'create-event',

    async (ctx) => {
        (ctx.wizard.state as any).data = {};
        await ctx.reply('Введите название мероприятия:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.title = ctx.message.text;
        await ctx.reply('Введите описание (место, суть, что взять с собой):');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.description = ctx.message.text;
        await askDate(ctx);
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (isText(ctx)) {
            await ctx.reply('Пожалуйста, выберите дату в календаре выше.');
        }
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const answer = ctx.message.text.trim().toLowerCase();
        const state = ctx.wizard.state as any;
        if (answer === 'да') {
            state.useSlots = true;
            await ctx.reply('Сколько дорожек?', Markup.removeKeyboard());
            return ctx.wizard.next();
        }
        state.useSlots = false;
        return askVisibility(ctx);
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const count = parseInt(ctx.message.text, 10);
        if (isNaN(count) || count <= 0) {
            await ctx.reply('Введите положительное число дорожек:');
            return;
        }
        (ctx.wizard.state as any).lanesCount = count;
        await ctx.reply('Сколько игроков на одной дорожке?');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const count = parseInt(ctx.message.text, 10);
        if (isNaN(count) || count <= 0) {
            await ctx.reply('Введите положительное число игроков на дорожке:');
            return;
        }
        (ctx.wizard.state as any).playersPerLane = count;
        return askVisibility(ctx);
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const answer = ctx.message.text.trim();
        const state = ctx.wizard.state as any;
        if (answer === 'Всем') {
            state.visibility = 'all';
            state.departmentId = null;
            return askHideParticipants(ctx);
        }
        if (answer === 'По отделу') {
            const departments = await getDepartments();
            state.departmentsMap = Object.fromEntries(departments.map((d) => [d.name, d.id]));
            await ctx.reply('Выберите отдел:', Markup.keyboard(departments.map((d) => [d.name])).oneTime().resize());
            return ctx.wizard.next();
        }
        await ctx.reply('Выберите вариант с клавиатуры.');
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const state = ctx.wizard.state as any;
        const departmentId = state.departmentsMap?.[ctx.message.text];
        if (!departmentId) {
            await ctx.reply('Не нашёл такой отдел. Выберите вариант с клавиатуры.');
            return;
        }
        state.visibility = 'department';
        state.departmentId = departmentId;
        return askHideParticipants(ctx);
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const answer = ctx.message.text.trim().toLowerCase();
        if (answer !== 'да' && answer !== 'нет') {
            await ctx.reply('Выберите вариант с клавиатуры.');
            return;
        }
        (ctx.wizard.state as any).hideParticipants = answer === 'да';
        return finishWizard(ctx);
    },
);

createEventScene.action('cal:noop', (ctx) => ctx.answerCbQuery());

createEventScene.action(/^cal:nav:(\d+):(\d+)$/, async (ctx) => {
    const year = Number(ctx.match[1]);
    const month = Number(ctx.match[2]);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(buildCalendarKeyboard(year, month).reply_markup);
});

async function askVisibility(ctx: BotContext) {
    await ctx.reply('Кому видно мероприятие?', Markup.keyboard(['Всем', 'По отделу']).oneTime().resize());
    ctx.wizard.selectStep(VISIBILITY_STEP);
}

async function askHideParticipants(ctx: BotContext) {
    await ctx.reply('Скрыть список записавшихся от участников?', Markup.keyboard(['Да', 'Нет']).oneTime().resize());
    ctx.wizard.selectStep(HIDE_STEP);
}

createEventScene.action(/^cal:day:(\d+):(\d+):(\d+)$/, async (ctx) => {
    (ctx.wizard.state as any).date = {
        year: Number(ctx.match[1]),
        month: Number(ctx.match[2]),
        day: Number(ctx.match[3]),
    };
    await ctx.answerCbQuery();
    await ctx.editMessageText('Выберите час:', buildHourKeyboard());
});

createEventScene.action(/^cal:hour:(\d+)$/, async (ctx) => {
    (ctx.wizard.state as any).date.hour = Number(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageText('Выберите минуты:', buildMinuteKeyboard());
});

createEventScene.action(/^cal:minute:(\d+)$/, async (ctx) => {
    const state = ctx.wizard.state as any;
    const { year, month, day, hour } = state.date;
    const minute = Number(ctx.match[1]);
    const dt = new Date(year, month, day, hour, minute);
    state.data.startsAt = dt.toISOString();

    await ctx.answerCbQuery();
    await ctx.editMessageText(`📅 Дата: ${dt.toLocaleString('ru-RU')}`);
    await ctx.reply('Нужны ли дорожки/слоты с ограничением мест?', Markup.keyboard(['Да', 'Нет']).oneTime().resize());
    ctx.wizard.selectStep(SLOTS_STEP);
});

async function askDate(ctx: BotContext) {
    const now = new Date();
    await ctx.reply('Выберите дату мероприятия:', buildCalendarKeyboard(now.getFullYear(), now.getMonth()));
}

async function finishWizard(ctx: BotContext) {
    const state = ctx.wizard.state as any;
    const slots = state.useSlots
        ? Array.from({ length: state.lanesCount }, (_, i) => ({
            label: `Дорожка ${i + 1}`,
            capacity: state.playersPerLane,
        }))
        : [];

    const eventId = await createEvent({
        title: state.data.title,
        description: state.data.description,
        category: '',
        startsAt: state.data.startsAt,
        visibility: state.visibility,
        departmentId: state.departmentId,
        createdBy: ctx.user!.id,
        hideParticipants: state.hideParticipants,
        slots,
    });

    await ctx.reply(`✅ Мероприятие «${state.data.title}» создано (id ${eventId}).`);
    await ctx.reply('Главное меню:', mainMenuKeyboard(ctx));
    return ctx.scene.leave();
}