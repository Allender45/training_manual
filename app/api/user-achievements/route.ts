import pool from "@/lib/db";
import {NextResponse, NextRequest} from "next/server";
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT a.id, a.icon, a.title, a.description, up.completed_at
             FROM user_progress up
             JOIN achievements a ON a.id = up.content_id::integer
             WHERE up.user_id = $1 AND up.content_type = 'achievement'
             ORDER BY up.completed_at DESC`,
            [userId]
        );
        return NextResponse.json({ achievements: result.rows });
    } catch (error: any) {
        console.error('[GET /api/user-achievements]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    try {
        const { achievement_id } = await req.json();
        const result = await pool.query(
            `INSERT INTO user_progress (user_id, content_type, content_id)
             VALUES ($1, 'achievement', $2)
             ON CONFLICT (user_id, content_type, content_id) DO NOTHING`,
            [userId, achievement_id]
        );

        return NextResponse.json({ awarded: (result.rowCount ?? 0) > 0 });
    } catch (error: any) {
        console.error('[POST /api/user-achievements]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}