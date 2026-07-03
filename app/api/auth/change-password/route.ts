import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Новый пароль должен содержать не менее 8 символов' }, { status: 400 });
        }

        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!match) {
            return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        return NextResponse.json({ message: 'Пароль успешно изменён' });
    } catch (error: any) {
        console.error('[change-password]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}