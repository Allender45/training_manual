import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'userProfileAddAchievementsButton');
    if (auth instanceof NextResponse) return auth;

    try {
        const { icon, title, description } = await req.json();
        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        const result = await pool.query(
            'UPDATE achievements SET icon=$1, title=$2, description=$3 WHERE id=$4 RETURNING id, icon, title, description',
            [icon?.trim() || '🏆', title.trim(), description?.trim() || null, params.id]
        );
        if (result.rows.length === 0) return NextResponse.json({ error: 'Достижение не найдено' }, { status: 404 });
        return NextResponse.json({ achievement: result.rows[0] });
    } catch (error: any) {
        console.error('[achievements PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'userProfileAddAchievementsButton');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query('DELETE FROM achievements WHERE id=$1 RETURNING id', [params.id]);
        if (result.rows.length === 0) return NextResponse.json({ error: 'Достижение не найдено' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[achievements DELETE]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}