import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

function phoneDigits(raw: string): string {
    return raw.replace(/\D/g, '').replace(/^7/, '').slice(0, 10);
}

function generatePassword(length = 10): string {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(req: NextRequest) {
    const { phone: rawPhone } = await req.json();
    const phone = phoneDigits(rawPhone ?? '');

    if (phone.length !== 10) {
        return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
    }

    const { rows } = await pool.query(
        'SELECT id, first_name, telegram_chat_id FROM users WHERE phone = $1 AND is_active = true',
        [phone]
    );

    if (!rows[0]) {
        return NextResponse.json({ error: 'Пользователь с таким номером не найден' }, { status: 404 });
    }

    const user = rows[0];

    if (!user.telegram_chat_id) {
        return NextResponse.json(
            { error: 'Телеграм не подключён, для изменения пароля обратитесь к администратору' },
            { status: 400 }
        );
    }

    const newPassword = generatePassword();
    const hash = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text: `🔑 *Сброс пароля*\n\nВаш новый пароль: \`${newPassword}\`\n\nВойдите и смените его в профиле.`,
            parse_mode: 'Markdown',
        }),
    });

    return NextResponse.json({ ok: true });
}