import { Markup } from 'telegraf';
import { VacancyRow, LeadRow, LeadWithVacancy } from './service';
import { BOT_USERNAME } from '../../config';

export const STATUS_LABELS: Record<string, string> = {
    new: '🆕 Новый',
    in_progress: '⏳ В работе',
    hired: '✅ Принят',
    rejected: '❌ Отказ',
};

export function buildReferralLink(vacancyId: number, referrerUserId: number) {
    return `https://t.me/${BOT_USERNAME}?start=vac${vacancyId}_${referrerUserId}`;
}

export function vacanciesListKeyboard(vacancies: VacancyRow[]) {
    return Markup.inlineKeyboard(
        vacancies.map((v) => [Markup.button.callback(v.title, `vac:view:${v.id}`)])
    );
}

export function vacancyDetailsKeyboard(vacancyId: number, canManage: boolean, referrerUserId: number | null) {
    const rows = [];
    if (referrerUserId) {
        rows.push([
            Markup.button.callback('🔗 Ссылка', `vac:refer:${vacancyId}:${referrerUserId}`),
            Markup.button.callback('🖼 QR-код', `vac:qr:${vacancyId}:${referrerUserId}`),
        ]);
    }
    if (canManage) {
        rows.push([Markup.button.callback('👥 Отклики', `vac:leads:${vacancyId}`)]);
        rows.push([
            Markup.button.callback('🔒 Закрыть', `vac:close:${vacancyId}`),
            Markup.button.callback('🗑 Удалить', `vac:delete:${vacancyId}`),
        ]);
    }
    rows.push([Markup.button.callback('⬅️ К списку', 'vac:list')]);
    return Markup.inlineKeyboard(rows);
}

export function leadsListKeyboard(vacancyId: number, leads: LeadRow[]) {
    const rows = leads.map((l) => [
        Markup.button.callback(`${l.full_name} — ${STATUS_LABELS[l.status] ?? l.status}`, `lead:view:${l.id}`),
    ]);
    rows.push([Markup.button.callback('⬅️ К вакансии', `vac:view:${vacancyId}`)]);
    return Markup.inlineKeyboard(rows);
}

export function leadDetailsKeyboard(lead: LeadRow) {
    const statusButtons = Object.entries(STATUS_LABELS)
        .filter(([key]) => key !== lead.status)
        .map(([key, label]) => Markup.button.callback(label, `lead:status:${lead.id}:${key}`));
    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < statusButtons.length; i += 2) {
        rows.push(statusButtons.slice(i, i + 2));
    }
    rows.push([Markup.button.callback('💬 Изменить комментарий', `lead:comment:${lead.id}`)]);
    rows.push([Markup.button.callback('⬅️ К откликам', `vac:leads:${lead.vacancy_id}`)]);
    return Markup.inlineKeyboard(rows);
}

export function allLeadsListKeyboard(leads: LeadWithVacancy[]) {
    const rows = leads.map((l) => [
        Markup.button.callback(`${l.full_name} — ${l.vacancy_title} — ${STATUS_LABELS[l.status] ?? l.status}`, `lead:view:${l.id}`),
    ]);
    rows.push([Markup.button.callback('⬅️ К вакансиям', 'vac:list')]);
    return Markup.inlineKeyboard(rows);
}