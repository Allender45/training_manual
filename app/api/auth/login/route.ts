import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signSession } from '@/lib/session';

function normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 11 && (cleaned.startsWith('7') || cleaned.startsWith('8'))) {
        return cleaned.slice(1);
    }
    return cleaned.length === 10 ? cleaned : cleaned;
}

export async function POST(req: NextRequest) {
    try {
        const { phone: phoneRaw, password } = await req.json();

        if (!phoneRaw || !password) {
            return NextResponse.json({ error: 'Введите телефон и пароль' }, { status: 400 });
        }

        const phone = normalizePhone(phoneRaw);
        if (!/^\d{10}$/.test(phone)) {
            return NextResponse.json({ error: 'Неверный формат телефона' }, { status: 400 });
        }

        const result = await pool.query(
            'SELECT id, last_name, first_name, middle_name, phone, password_hash FROM users WHERE phone = $1',
            [phone]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Неверный телефон или пароль' }, { status: 401 });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return NextResponse.json({ error: 'Неверный телефон или пароль' }, { status: 401 });
        }

        const { password_hash: _, ...safeUser } = user;
        const response = NextResponse.json({ message: 'Вход выполнен', user: safeUser }, { status: 200 });
        response.cookies.set('session', signSession(String(user.id)), {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });
        return response;
    } catch (error: any) {
        console.error('[login]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера', detail: String(error?.message ?? error) }, { status: 500 });
    }
}