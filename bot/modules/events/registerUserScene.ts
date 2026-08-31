import { Scenes } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { createGuestUser, getAppUserById, registerForEvent } from './service';
import { mainMenuKeyboard } from '../../menu';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

export const eventRegisterUserScene = new Scenes.WizardScene<BotContext>(
    'event-register-user',

    async (ctx) => {
        await ctx.reply(
            'Чтобы записаться на мероприятие, нужно зарегистрироваться в системе.\nВведите вашу фамилию:'
        );
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).lastName = ctx.message.text.trim();
        await ctx.reply('Введите имя:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).firstName = ctx.message.text.trim();
        await ctx.reply('Введите отчество (если нет — отправьте "-"):');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const text = ctx.message.text.trim();
        (ctx.wizard.state as any).middleName = text === '-' ? '' : text;
        await ctx.reply('Укажите номер телефона.\nФормат без +7, сразу 10 цифр, например: 9631234567');
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
        let userId: number;
        try {
            userId = await createGuestUser({
                lastName: state.lastName,
                firstName: state.firstName,
                middleName: state.middleName,
                phone,
                telegramChatId: ctx.chat!.id,
            });
        } catch (e: any) {
            if (e.code === '23505') {
                await ctx.reply('Пользователь с таким номером телефона уже зарегистрирован. Обратитесь к администратору, чтобы привязать аккаунт.');
            } else {
                console.error('[event-register-user] Ошибка создания пользователя:', e);
                await ctx.reply('Не удалось зарегистрироваться. Попробуйте позже.');
            }
            return ctx.scene.leave();
        }

        ctx.user = await getAppUserById(userId);

        const ok = await registerForEvent(state.eventId, userId, state.slotId ?? null);
        await ctx.reply(
            ok
                ? '✅ Аккаунт создан, вы записаны на мероприятие!'
                : '✅ Аккаунт создан, но записаться на мероприятие не удалось (места закончились).'
        );
        await ctx.reply(
            `Пароль для входа на портал — ваш номер телефона без +7 (${phone}). Его можно изменить в личном кабинете.`,
            mainMenuKeyboard(ctx)
        );
        return ctx.scene.leave();
    },
);