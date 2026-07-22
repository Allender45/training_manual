import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'editUser');
    if (auth instanceof NextResponse) return auth;

    try {
        const { mentor_id, start_date, end_date } = await req.json();
        const result = await pool.query(
            `UPDATE mentorships SET mentor_id=$1, start_date=$2, end_date=$3 WHERE id=$4 RETURNING id`,
            [mentor_id, start_date, end_date || null, params.id]
        );
        if (result.rows.length === 0)
            return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[PATCH /api/mentorships/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'editUser');
    if (auth instanceof NextResponse) return auth;

    try {
        await pool.query('DELETE FROM mentorships WHERE id=$1', [params.id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DELETE /api/mentorships/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}