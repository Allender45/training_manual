import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'editUser');
    if (auth instanceof NextResponse) return auth;

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