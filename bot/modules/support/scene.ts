import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../../middlewares/resolveUser';
import { mainMenuKeyboard } from '../../menu';
import { sendSupportRequest } from './service';
import { createGuestUser, getAppUserById } from '../events/service';

function isText(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
    return !!ctx.message && 'text' in ctx.message;
}

const OWN_LASTNAME_STEP = 4;

export const supportRequestScene = new Scenes.WizardScene<BotContext>(
    'support-request',

    async (ctx) => {
        (ctx.wizard.state as any).data = {};
        await ctx.reply('Опишите проблему:', Markup.keyboard([['🏠 Домой']]).resize());
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.description = ctx.message.text.trim();
        await ctx.reply('Укажите контактный телефон для связи по этому вопросу:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.contactPhone = ctx.message.text.trim();
        await ctx.reply('Укажите номер рабочего места:');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        (ctx.wizard.state as any).data.workplaceNumber = ctx.message.text.trim();
        return askOwnInfoOrFinish(ctx);
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
        await ctx.reply('Укажите свой номер телефона.\nФормат без +7, сразу 10 цифр, например: 9631234567');
        return ctx.wizard.next();
    },

    async (ctx) => {
        if (!isText(ctx)) return;
        const phone = ctx.message.text.trim();
        if (!/^\d{10}$/.test(phone)) {
            await ctx.reply('Неверный формат. Введите номер без +7, ровно 10 цифр, например: 9631234567');
            return;
        }
        return registerGuestAndFinish(ctx, phone);
    },
);

supportRequestScene.hears('🏠 Домой', async (ctx) => {
    await ctx.reply('Обращение отменено.', mainMenuKeyboard(ctx));
    return ctx.scene.leave();
});

async function askOwnInfoOrFinish(ctx: BotContext) {
    const state = ctx.wizard.state as any;
    if (ctx.user) {
        state.lastName = ctx.user.last_name;
        state.firstName = ctx.user.first_name;
        state.middleName = ctx.user.middle_name;
        state.userId = ctx.user.id;
        state.phone = ctx.user.phone;
        return finish(ctx);
    }
    await ctx.reply('Вы ещё не зарегистрированы на портале. Введите вашу фамилию:');
    ctx.wizard.selectStep(OWN_LASTNAME_STEP);
}

async function registerGuestAndFinish(ctx: BotContext, phone: string) {
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
            await ctx.reply('Пользователь с таким номером телефона уже зарегистрирован. Обратитесь к администратору, чтобы привязать аккаунт.', mainMenuKeyboard(ctx));
        } else {
            console.error('[support] Ошибка создания пользователя:', e);
            await ctx.reply('Не удалось зарегистрироваться. Попробуйте позже.', mainMenuKeyboard(ctx));
        }
        return ctx.scene.leave();
    }

    ctx.user = await getAppUserById(userId);
    state.userId = userId;
    state.phone = phone;
    await ctx.reply(`Аккаунт создан. Пароль для входа на портал — ваш номер телефона без +7 (${phone}). Его можно изменить в личном кабинете.`);
    return finish(ctx);
}

async function finish(ctx: BotContext) {
    const state = ctx.wizard.state as any;
    try {
        await sendSupportRequest({
            description: state.data.description,
            contactPhone: state.data.contactPhone,
            workplaceNumber: state.data.workplaceNumber,
            lastName: state.lastName,
            firstName: state.firstName,
            middleName: state.middleName,
            phone: state.phone,
            telegramChatId: ctx.chat!.id,
            userId: state.userId ?? null,
        });
        await ctx.reply('✅ Заявка передана в техподдержку.', mainMenuKeyboard(ctx));
    } catch (e) {
        console.error('[support] Не удалось отправить заявку:', e);
        await ctx.reply('Не удалось отправить заявку. Попробуйте позже.', mainMenuKeyboard(ctx));
    }
    return ctx.scene.leave();
}