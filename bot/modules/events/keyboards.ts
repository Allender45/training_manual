import { Markup } from 'telegraf';
import { EventRow, SlotRow } from './service';

export function eventsListKeyboard(events: EventRow[]) {
    return Markup.inlineKeyboard(
        events.map((e) => [Markup.button.callback(e.title, `ev:view:${e.id}`)])
    );
}

export function eventDetailsKeyboard(eventId: number, hasSlots: boolean, isRegistered: boolean, canManage: boolean) {
    const rows = [];
    if (isRegistered) {
        rows.push([Markup.button.callback('❌ Отменить запись', `ev:cancel:${eventId}`)]);
    } else if (hasSlots) {
        rows.push([Markup.button.callback('✅ Выбрать дорожку', `ev:slots:${eventId}`)]);
    } else {
        rows.push([Markup.button.callback('✅ Записаться', `ev:reg:${eventId}:0`)]);
    }
    if (canManage) {
        rows.push([
            Markup.button.callback('🔒 Закрыть', `ev:close:${eventId}`),
            Markup.button.callback('🗑 Удалить', `ev:delete:${eventId}`),
        ]);
    }
    rows.push([Markup.button.callback('⬅️ К списку', 'ev:list')]);
    return Markup.inlineKeyboard(rows);
}

export function slotsKeyboard(eventId: number, slots: SlotRow[]) {
    const rows = slots.map((s) => {
        const full = s.taken >= s.capacity;
        const label = `${s.label} (${s.taken}/${s.capacity})${full ? ' — занято' : ''}`;
        return [Markup.button.callback(label, full ? 'ev:full' : `ev:reg:${eventId}:${s.id}`)];
    });
    rows.push([Markup.button.callback('⬅️ Назад', `ev:view:${eventId}`)]);
    return Markup.inlineKeyboard(rows);
}