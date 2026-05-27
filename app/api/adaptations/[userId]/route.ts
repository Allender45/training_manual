import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT a.plan_id, a.started_at, ap.name AS plan_name,
                    ap.calls AS plan_calls, ap.conversion AS plan_conversion,
                    ap.revenue_new AS plan_revenue_new, ap.revenue_total AS plan_revenue_total
             FROM adaptations a
                      LEFT JOIN adaptation_plans ap ON ap.id = a.plan_id
             WHERE a.user_id = $1
             LIMIT 1`,
            [params.userId]
        );
        return NextResponse.json({ adaptation: result.rows[0] ?? null });
    } catch (error) {
        console.error('[GET /api/adaptations/:userId]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}