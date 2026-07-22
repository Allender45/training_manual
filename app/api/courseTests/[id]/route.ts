import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth, requireFeature } from '@/lib/apiAuth';
import { hasFeature } from '@/lib/permissions';

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const testResult = await pool.query(
            `SELECT t.id, t.title, t.time_limit, t.shuffle_questions, t.shuffle_answers,
                    t.is_active, t.created_at, t.achievement_id, t.notify_trainee, t.notify_mentor
             FROM tests t
             WHERE t.id = $1`,
            [params.id]
        );
        if (!testResult.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });

        // correct_answer отдаём только редакторам тестов — иначе ответы видны до сдачи.
        // Варианты ответов собираем на сервере, чтобы не раскрывать верный.
        const canSeeAnswers = hasFeature(auth.roleId, 'sidebarAdminMenu');
        const shuffleAnswers = testResult.rows[0].shuffle_answers !== false;

        const questionsResult = await pool.query(
            `SELECT id, question, correct_answer, wrong_answers, order_position
             FROM test_questions WHERE test_id = $1 ORDER BY order_position ASC`,
            [params.id]
        );
        const questions = questionsResult.rows.map(row => {
            const base = [row.correct_answer, ...(row.wrong_answers ?? [])];
            const options = shuffleAnswers ? shuffle(base) : base;
            if (canSeeAnswers) return { ...row, options };
            const { correct_answer, wrong_answers, ...q } = row;
            return { ...q, options };
        });

        return NextResponse.json({ test: testResult.rows[0], questions });
    } catch (error: any) {
        console.error('[GET /api/courseTests/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'sidebarAdminMenu');
    if (auth instanceof NextResponse) return auth;
    const userId = String(auth.userId);

    try {
        const { title, time_limit, shuffle_questions, shuffle_answers, is_active, questions,
            achievement_id, notify_trainee, notify_mentor } = await req.json();

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
                                  updated_by        = $6,
                                  achievement_id    = $7,
                                  notify_trainee    = $8,
                                  notify_mentor     = $9
                 WHERE id = $10 RETURNING id`,
                [title.trim(), time_limit ?? null, shuffle_questions ?? true, shuffle_answers ?? true,
                    is_active ?? true, userId,
                    achievement_id || null, notify_trainee || null, notify_mentor || null,
                    params.id]
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
        console.error('[PATCH /api/courseTests/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'sidebarAdminMenu');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            'DELETE FROM tests WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/tests/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
