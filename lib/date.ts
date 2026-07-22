export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function toPeriod(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Сетка календаря месяца: null — пустые ячейки, числа — дни месяца (month 0-based)
export function buildMonthCells(year: number, month: number): (number | null)[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}
