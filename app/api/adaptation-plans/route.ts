import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(`
            SELECT ap.id,
                   ap.name,
                   ap.calls,
                   ap.conversion,
                   ap.revenue_new,
                   ap.revenue_total,
                   ap.comment,
                   ap.is_active,
                   ap.created_at,
                   ap.updated_at,
                   ap.author_id,
                   TRIM(u.last_name || ' ' || u.first_name) AS author_name
            FROM adaptation_plans ap
            LEFT JOIN users u ON u.id = ap.author_id
            ORDER BY ap.created_at DESC
        `);
        return NextResponse.json({ plans: result.rows });
    } catch (error) {
        console.error('[GET /api/adaptation-plans]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'adaptationTableAddButtons');
    if (auth instanceof NextResponse) return auth;
    const userId = String(auth.userId);

    try {
        const body = await req.json();
        const { name, calls, conversion, revenue_new, revenue_total, comment, is_active } = body;

        if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        const result = await pool.query(
            `INSERT INTO adaptation_plans (name, calls, conversion, revenue_new, revenue_total, comment, is_active, author_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                name.trim(),
                calls || null,
                conversion || null,
                revenue_new || null,
                revenue_total || null,
                comment || null,
                is_active ?? true,
                Number(userId),
            ]
        );
        return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/adaptation-plans]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}