import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { content_type, content_id, score } = await req.json();
        if (!['course', 'manual', 'test'].includes(content_type)) {
            return NextResponse.json({ error: 'Некорректный content_type' }, { status: 400 });
        }
        if (score !== undefined && score !== null
            && (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)) {
            return NextResponse.json({ error: 'Некорректный score' }, { status: 400 });
        }
        await pool.query(
            `INSERT INTO user_progress (user_id, content_type, content_id, score)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, content_type, content_id) DO UPDATE SET completed_at = NOW(), score = $4`,
            [userId, content_type, content_id, score ?? null]
        );
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[POST /api/user-progress]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}