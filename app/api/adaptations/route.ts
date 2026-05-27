import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { user_id, plan_id } = await req.json();
        await pool.query(
            `INSERT INTO adaptations (user_id, plan_id, started_at)
             VALUES ($1, $2, CURRENT_DATE)
             ON CONFLICT (user_id) DO UPDATE SET plan_id = $2`,
            [user_id, plan_id]
        );
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[POST /api/adaptations]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}