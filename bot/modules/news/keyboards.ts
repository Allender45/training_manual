import { Markup } from 'telegraf';
import { NewsRow } from './service';

export function newsListKeyboard(newsList: NewsRow[]) {
    return Markup.inlineKeyboard(
        newsList.map((n) => {
            const date = new Date(n.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return [Markup.button.callback(`${date} — ${n.title}`, `news:view:${n.id}`)];
        })
    );
}

export function newsDetailsKeyboard() {
    return Markup.inlineKeyboard([[Markup.button.callback('⬅️ К списку', 'news:list')]]);
}