import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            'SELECT id, text, icon, status, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        return NextResponse.json({ notifications: result.rows });
    } catch (error: any) {
        console.error('[notifications GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { text, icon = 'bell', user_id } = await req.json();
        if (!text?.trim()) return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 });

        const targetUserId = user_id ?? userId;
        const result = await pool.query(
            'INSERT INTO notifications (user_id, text, icon) VALUES ($1, $2, $3) RETURNING *',
            [targetUserId, text.trim(), icon]
        );
        return NextResponse.json({ notification: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[notifications POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}