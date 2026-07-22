import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth, canAccessUserData } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const requestedId = req.nextUrl.searchParams.get('userId');
    if (requestedId && !canAccessUserData(auth, auth.userId === Number(requestedId))) {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }
    const userId = requestedId ?? String(auth.userId);

    const [totalRes, completedRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS total FROM manuals WHERE is_active = true`),
        pool.query(
            `SELECT COUNT(*)::int AS completed FROM user_progress WHERE user_id = $1 AND content_type = 'course'`,
            [userId]
        ),
    ]);

    return NextResponse.json({
        total:     totalRes.rows[0].total,
        completed: completedRes.rows[0].completed,
    });
}
