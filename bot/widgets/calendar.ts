import { Markup } from 'telegraf';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function buildCalendarKeyboard(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    const rows: any[] = [];
    rows.push([Markup.button.callback(`${MONTHS[month]} ${year}`, 'cal:noop')]);
    rows.push(WEEKDAYS.map((w) => Markup.button.callback(w, 'cal:noop')));

    let week: any[] = new Array(startWeekday).fill(Markup.button.callback(' ', 'cal:noop'));
    for (let day = 1; day <= daysInMonth; day++) {
        week.push(Markup.button.callback(String(day), `cal:day:${year}:${month}:${day}`));
        if (week.length === 7) {
            rows.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(Markup.button.callback(' ', 'cal:noop'));
        rows.push(week);
    }

    const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
    const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
    rows.push([
        Markup.button.callback('◀️', `cal:nav:${prev.y}:${prev.m}`),
        Markup.button.callback('▶️', `cal:nav:${next.y}:${next.m}`),
    ]);

    return Markup.inlineKeyboard(rows);
}

export function buildHourKeyboard() {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08..22
    const rows = [];
    for (let i = 0; i < hours.length; i += 5) {
        rows.push(hours.slice(i, i + 5).map((h) => Markup.button.callback(String(h).padStart(2, '0'), `cal:hour:${h}`)));
    }
    return Markup.inlineKeyboard(rows);
}

export function buildMinuteKeyboard() {
    const minutes = [0, 15, 30, 45];
    return Markup.inlineKeyboard([
        minutes.map((m) => Markup.button.callback(String(m).padStart(2, '0'), `cal:minute:${m}`)),
    ]);
}