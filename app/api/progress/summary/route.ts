import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const [totalRes, completedRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS total FROM manuals WHERE is_active = true`),
        pool.query(
            `SELECT COUNT(*)::int AS completed FROM user_progress WHERE user_id = $1 AND content_type = 'manual'`,
            [userId]
        ),
    ]);

    return NextResponse.json({
        total:     totalRes.rows[0].total,
        completed: completedRes.rows[0].completed,
    });
}