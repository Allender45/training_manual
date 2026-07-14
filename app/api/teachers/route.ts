import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { rows } = await pool.query(`
            SELECT
                u.id,
                TRIM(u.last_name || ' ' || u.first_name || ' ' || COALESCE(u.middle_name, '')) AS name,
                COUNT(ms.intern_id) FILTER (WHERE ms.end_date IS NULL)::int AS intern_count
            FROM users u
            LEFT JOIN mentorships ms ON ms.mentor_id = u.id
            WHERE u.role_id = 4 AND u.is_active = true
            GROUP BY u.id, u.last_name, u.first_name, u.middle_name
            ORDER BY u.last_name, u.first_name
        `);
        return NextResponse.json({ mentors: rows });
    } catch (error: any) {
        console.error('[GET /api/teachers]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}