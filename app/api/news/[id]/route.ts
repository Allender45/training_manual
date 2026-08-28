import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'newsTableManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const { published } = await req.json();
        const result = await pool.query(
            `UPDATE news SET published = $1 WHERE id = $2
             RETURNING id, title, body, image_url, created_by, created_at, published`,
            [!!published, params.id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Новость не найдена' }, { status: 404 });
        }
        return NextResponse.json({ news: result.rows[0] });
    } catch (error: any) {
        console.error('[news PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}