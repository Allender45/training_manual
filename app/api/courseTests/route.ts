import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT t.id, t.title, t.time_limit, t.shuffle_questions, t.shuffle_answers,
                    t.course_id, c.title AS course_title, t.is_active, t.created_at
             FROM tests t
                      LEFT JOIN courses c ON c.id = t.course_id
             ORDER BY t.created_at DESC`
        );
        return NextResponse.json({ tests: result.rows });
    } catch (error: any) {
        console.error('[GET /api/tests]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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

            const testResult = await client.query(
                `INSERT INTO tests (title, time_limit, shuffle_questions, shuffle_answers, is_active, course_id, created_by, updated_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
                 RETURNING id, title`,
                [title.trim(), time_limit ?? null, shuffle_questions ?? true, shuffle_answers ?? true, is_active ?? true, course_id || null, userId]
            );
            const testId = testResult.rows[0].id;

            if (Array.isArray(questions) && questions.length > 0) {
                for (const q of questions) {
                    await client.query(
                        `INSERT INTO test_questions (test_id, question, correct_answer, wrong_answers, order_position)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [testId, q.question, q.correct_answer, q.wrong_answers, q.order_position ?? 0]
                    );
                }
            }

            await client.query('COMMIT');
            return NextResponse.json({ test: testResult.rows[0] }, { status: 201 });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('[POST /api/courseTests]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}