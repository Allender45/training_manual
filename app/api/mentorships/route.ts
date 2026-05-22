import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const intern_id = searchParams.get('intern_id');
    if (!intern_id) return NextResponse.json({ error: 'intern_id обязателен' }, { status: 400 });

    try {
        const result = await pool.query(
            `SELECT m.id, m.mentor_id, m.intern_id,
                    TO_CHAR(m.start_date, 'YYYY-MM-DD') AS start_date,
                    TO_CHAR(m.end_date,   'YYYY-MM-DD') AS end_date,
                    u.last_name || ' ' || u.first_name || ' ' || u.middle_name AS mentor_name
             FROM mentorships m
             JOIN users u ON u.id = m.mentor_id
             WHERE m.intern_id = $1`,
            [intern_id]
        );
        return NextResponse.json({ mentorship: result.rows[0] ?? null });
    } catch (error: any) {
        console.error('[GET /api/mentorships]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { intern_id, mentor_id, start_date, end_date } = await req.json();
        if (!intern_id || !mentor_id || !start_date)
            return NextResponse.json({ error: 'Обязательные поля: intern_id, mentor_id, start_date' }, { status: 400 });

        const result = await pool.query(
            `INSERT INTO mentorships (intern_id, mentor_id, start_date, end_date)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [intern_id, mentor_id, start_date, end_date || null]
        );
        return NextResponse.json({ mentorship: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505')
            return NextResponse.json({ error: 'У этого стажёра уже есть наставник' }, { status: 409 });
        console.error('[POST /api/mentorships]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}