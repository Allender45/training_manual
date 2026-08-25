import { BotModule } from '../types';
import { BotContext } from '../../middlewares/resolveUser';
import {
    getVisibleEvents,
    getEvent,
    getEventSlots,
    getUserRegistration,
    registerForEvent,
    cancelRegistration,
    getEventParticipants,
    closeEvent,
    deleteEvent,
    SlotRow,
    ParticipantRow,
} from './service';
import { eventsListKeyboard, eventDetailsKeyboard, slotsKeyboard } from './keyboards';
import { Markup } from 'telegraf';
import { isAdmin } from '../../permissions';

function formatEventCard(
    event: { title: string; description: string; starts_at: string; hide_participants: boolean },
    slots: SlotRow[],
    participants: ParticipantRow[],
    canManage: boolean
) {
    const date = new Date(event.starts_at).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    let text = `🎯 *${event.title}*\n📅 ${date}\n\n${event.description}`;

    if (event.hide_participants && !canManage) {
        return text;
    }

    if (slots.length > 0) {
        text += '\n\n👥 *Записавшиеся:*';
        for (const slot of slots) {
            const slotParticipants = participants.filter((p) => p.slot_label === slot.label);
            text += `\n\n*${slot.label}* (${slot.taken}/${slot.capacity}):`;
            text += slotParticipants.length === 0
                ? '\nпока никто не записался'
                : slotParticipants.map((p, i) => `\n${i + 1}. ${p.last_name} ${p.first_name}`).join('');
        }
    } else if (participants.length > 0) {
        text += '\n\n👥 *Записавшиеся:*';
        text += participants.map((p, i) => `\n${i + 1}. ${p.last_name} ${p.first_name}`).join('');
    } else {
        text += '\n\n👥 Записавшихся пока нет.';
    }

    return text;
}

async function showEventsList(ctx: BotContext, edit: boolean) {
    const events = await getVisibleEvents(ctx.user);
    if (events.length === 0) {
        if (edit) await ctx.editMessageText('Пока нет доступных мероприятий.');
        else await ctx.reply('Пока нет доступных мероприятий.');
        return;
    }
    const text = 'Доступные мероприятия:';
    const kb = eventsListKeyboard(events);
    if (edit) await ctx.editMessageText(text, kb);
    else await ctx.reply(text, kb);
}

async function showEventCard(ctx: BotContext, eventId: number) {
    const event = await getEvent(eventId);
    if (!event) {
        await ctx.answerCbQuery('Мероприятие не найдено');
        return;
    }
    const slots = await getEventSlots(eventId);
    const participants = await getEventParticipants(eventId);
    const registration = ctx.user ? await getUserRegistration(eventId, ctx.user.id) : null;
    const canManage = isAdmin(ctx.user);
    await ctx.editMessageText(
        formatEventCard(event, slots, participants, canManage),
        { parse_mode: 'Markdown', ...eventDetailsKeyboard(eventId, slots.length > 0, !!registration, canManage) }
    );
}

export const eventsModule: BotModule = {
    key: 'events',
    title: '📅 Мероприятия',
    isVisible: () => true,
    register: (bot) => {
        bot.hears('📅 Мероприятия', async (ctx) => {
            await showEventsList(ctx, false);
            if (isAdmin(ctx.user)) {
                await ctx.reply('Мероприятия:', Markup.keyboard([
                    ['➕ Создать мероприятие'],
                    ['🏠 Домой'],
                ]).resize());
            }
        });

        bot.hears('➕ Создать мероприятие', async (ctx) => {
            if (!isAdmin(ctx.user)) return;
            await ctx.scene.enter('create-event');
        });

        bot.action('ev:list', async (ctx) => {
            await ctx.answerCbQuery();
            await showEventsList(ctx, true);
        });

        bot.action(/^ev:view:(\d+)$/, async (ctx) => {
            await ctx.answerCbQuery();
            await showEventCard(ctx, Number(ctx.match[1]));
        });

        bot.action(/^ev:slots:(\d+)$/, async (ctx) => {
            const eventId = Number(ctx.match[1]);
            const slots = await getEventSlots(eventId);
            await ctx.answerCbQuery();
            await ctx.editMessageText('Выберите дорожку:', slotsKeyboard(eventId, slots));
        });

        bot.action('ev:full', async (ctx) => {
            await ctx.answerCbQuery('На этой дорожке нет мест', { show_alert: true });
        });

        bot.action(/^ev:reg:(\d+):(\d+)$/, async (ctx) => {
            if (!ctx.user) {
                await ctx.answerCbQuery('Сначала привяжите аккаунт: /start', { show_alert: true });
                return;
            }
            const eventId = Number(ctx.match[1]);
            const slotId = Number(ctx.match[2]) || null;
            const ok = await registerForEvent(eventId, ctx.user.id, slotId);
            await ctx.answerCbQuery(ok ? 'Вы записаны!' : 'Не удалось записаться (места закончились или вы уже записаны)');
            await showEventCard(ctx, eventId);
        });

        bot.action(/^ev:cancel:(\d+)$/, async (ctx) => {
            if (!ctx.user) return ctx.answerCbQuery();
            const eventId = Number(ctx.match[1]);
            await cancelRegistration(eventId, ctx.user.id);
            await ctx.answerCbQuery('Запись отменена');
            await showEventCard(ctx, eventId);
        });

        bot.action(/^ev:close:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const eventId = Number(ctx.match[1]);
            await closeEvent(eventId);
            await ctx.answerCbQuery('Мероприятие закрыто');
            await showEventsList(ctx, true);
        });

        bot.action(/^ev:delete:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const eventId = Number(ctx.match[1]);
            await ctx.answerCbQuery();
            await ctx.editMessageText('Удалить мероприятие безвозвратно?', Markup.inlineKeyboard([
                [Markup.button.callback('✅ Да, удалить', `ev:delete_confirm:${eventId}`)],
                [Markup.button.callback('Отмена', `ev:view:${eventId}`)],
            ]));
        });

        bot.action(/^ev:delete_confirm:(\d+)$/, async (ctx) => {
            if (!isAdmin(ctx.user)) return ctx.answerCbQuery();
            const eventId = Number(ctx.match[1]);
            await deleteEvent(eventId);
            await ctx.answerCbQuery('Удалено');
            await showEventsList(ctx, true);
        });
    },
};