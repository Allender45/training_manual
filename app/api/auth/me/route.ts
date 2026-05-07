import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const result = await pool.query(
            'SELECT id, last_name, first_name, middle_name, phone, email, photo, passport_series, passport_number, birthday, comment, registered_at FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
        }
        return NextResponse.json({ user: result.rows[0] });
    } catch (error: any) {
        console.error('[me]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}