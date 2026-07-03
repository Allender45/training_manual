import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const { newPassword } = await req.json();

        if (!newPassword) {
            return NextResponse.json({ error: 'Введите новый пароль' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
            [newHash, params.id]
        );

        if (!result.rows[0]) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Пароль установлен' });
    } catch (error: any) {
        console.error('[set-password]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}