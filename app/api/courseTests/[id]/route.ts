import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const testResult = await pool.query(
            `SELECT t.id, t.title, t.time_limit, t.shuffle_questions, t.shuffle_answers,
                    t.course_id, c.title AS course_title, t.is_active, t.created_at
             FROM tests t
                      LEFT JOIN courses c ON c.id = t.course_id
             WHERE t.id = $1`,
            [params.id]
        );
        if (!testResult.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });

        const questionsResult = await pool.query(
            `SELECT id, question, correct_answer, wrong_answers, order_position
             FROM test_questions WHERE test_id = $1 ORDER BY order_position ASC`,
            [params.id]
        );

        return NextResponse.json({ test: testResult.rows[0], questions: questionsResult.rows });
    } catch (error: any) {
        console.error('[GET /api/courseTests/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { title, time_limit, shuffle_questions, shuffle_answers, is_active, course_id, questions } = await req.json();

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Заполните название теста' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE tests SET
                                  title             = $1,
                                  time_limit        = $2,
                                  shuffle_questions = $3,
                                  shuffle_answers   = $4,
                                  is_active         = $5,
                                  course_id         = $6,
                                  updated_by        = $7
                 WHERE id = $8 RETURNING id`,
                [title.trim(), time_limit ?? null, shuffle_questions ?? true, shuffle_answers ?? true, is_active ?? true, course_id || null, userId, params.id]
            );
            if (!result.rows[0]) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Не найден' }, { status: 404 });
            }

            await client.query('DELETE FROM test_questions WHERE test_id = $1', [params.id]);

            if (Array.isArray(questions) && questions.length > 0) {
                for (const q of questions) {
                    await client.query(
                        `INSERT INTO test_questions (test_id, question, correct_answer, wrong_answers, order_position)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [params.id, q.question, q.correct_answer, q.wrong_answers, q.order_position ?? 0]
                    );
                }
            }

            await client.query('COMMIT');
            return NextResponse.json({ ok: true });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('[PATCH /api/courseTests/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            'DELETE FROM tests WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/tests/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}