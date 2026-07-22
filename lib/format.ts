export function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return '';
    let d = digits.startsWith('7') ? digits : '7' + digits;
    d = d.slice(0, 11);
    let formatted = '+' + d[0];
    if (d.length > 1) {
        formatted += ' (' + d.slice(1, Math.min(4, d.length));
        if (d.length >= 4) formatted += ')';
        if (d.length > 4) formatted += ' ' + d.slice(4, Math.min(7, d.length));
    }
    if (d.length > 7) formatted += '-' + d.slice(7, Math.min(9, d.length));
    if (d.length > 9) formatted += '-' + d.slice(9, 11);
    return formatted;
}

export function phoneDigits(raw: string): string {
    return raw.replace(/\D/g, '').replace(/^7/, '').slice(0, 10);
}

export function formatNumber(n: number): string {
    return n.toLocaleString('ru-RU');
}

export function formatMoney(n: number): string {
    return `${n.toLocaleString('ru-RU')} ₽`;
}

export function getInitials(...names: (string | null | undefined)[]): string {
    return names
        .filter((n): n is string => !!n)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}
