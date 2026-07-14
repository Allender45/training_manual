import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { rows } = await pool.query(`
            SELECT
                u.id,
                TRIM(u.last_name || ' ' || u.first_name || ' ' || COALESCE(u.middle_name, '')) AS name,
                u.crm_id,
                u.adaptation_access,
                COALESCE(up_count.completed, 0)                            AS courses_completed,
                (SELECT COUNT(*)::int FROM courses WHERE is_active = true) AS courses_total
            FROM users u
            JOIN mentorships ms ON ms.intern_id = u.id
                AND ms.mentor_id = $1
                AND ms.end_date IS NULL
            LEFT JOIN (
                SELECT user_id, COUNT(*)::int AS completed
                FROM user_progress
                WHERE content_type = 'course'
                GROUP BY user_id
            ) up_count ON up_count.user_id = u.id
            WHERE u.is_active = true
            ORDER BY u.last_name, u.first_name
        `, [params.id]);
        return NextResponse.json({ interns: rows });
    } catch (error: any) {
        console.error('[GET /api/teachers/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}