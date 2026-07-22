import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'coursesTableButtons');
    if (auth instanceof NextResponse) return auth;

    const { manual_ids } = await req.json();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM course_manuals WHERE course_id = $1', [params.id]);
        for (const id of manual_ids as number[]) {
            await client.query(
                'INSERT INTO course_manuals (course_id, manual_id) VALUES ($1, $2)',
                [params.id, id]
            );
        }
        await client.query('COMMIT');
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}