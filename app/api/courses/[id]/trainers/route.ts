import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT t.id, t.name, t.component
             FROM trainers t
                      INNER JOIN course_trainers ct ON ct.trainer_id = t.id
             WHERE ct.course_id = $1`,
            [params.id]
        );
        return NextResponse.json({ trainers: result.rows });
    } catch {
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'coursesTableButtons');
    if (auth instanceof NextResponse) return auth;

    const { trainer_ids } = await req.json();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM course_trainers WHERE course_id = $1', [params.id]);
        for (const id of trainer_ids as number[]) {
            await client.query(
                'INSERT INTO course_trainers (course_id, trainer_id) VALUES ($1, $2)',
                [params.id, id]
            );
        }
        await client.query('COMMIT');
        return NextResponse.json({ ok: true });
    } catch {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}