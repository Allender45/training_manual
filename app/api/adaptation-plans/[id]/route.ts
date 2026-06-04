import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, calls, conversion, revenue_new, revenue_total, comment, is_active } = body;

        if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        await pool.query(
            `UPDATE adaptation_plans
             SET name=$1, calls=$2, conversion=$3, revenue_new=$4, revenue_total=$5,
                 comment=$6, is_active=$7, updated_at=now()
             WHERE id=$8`,
            [
                name.trim(),
                calls || null,
                conversion || null,
                revenue_new || null,
                revenue_total || null,
                comment || null,
                is_active ?? true,
                params.id,
            ]
        );
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[PATCH /api/adaptation-plans/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        await pool.query('DELETE FROM adaptation_plans WHERE id=$1', [params.id]);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[DELETE /api/adaptation-plans/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}