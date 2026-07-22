import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (!/^\d+$/.test(params.id)) return NextResponse.json({ error: 'Неверный ID' }, { status: 400 });

    try {
        const { answers } = await req.json();
        if (!Array.isArray(answers)) {
            return NextResponse.json({ error: 'Некорректный формат ответов' }, { status: 400 });
        }

        const testResult = await pool.query('SELECT id FROM tests WHERE id = $1', [params.id]);
        if (!testResult.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });

        const questionsResult = await pool.query(
            `SELECT id, correct_answer
             FROM test_questions WHERE test_id = $1 ORDER BY order_position ASC`,
            [params.id]
        );

        const answerByQuestionId = new Map<number, string>();
        for (const a of answers) {
            if (a && typeof a.question_id === 'number' && typeof a.answer === 'string') {
                answerByQuestionId.set(a.question_id, a.answer);
            }
        }

        let correct = 0;
        const results = questionsResult.rows.map(q => {
            const answer = answerByQuestionId.get(q.id);
            const isCorrect = answer !== undefined && answer === q.correct_answer;
            if (isCorrect) correct++;
            // correct_answer возвращаем только по отвеченным вопросам
            return {
                question_id: q.id,
                correct: isCorrect,
                ...(answer !== undefined ? { correct_answer: q.correct_answer } : {}),
            };
        });

        const total = questionsResult.rows.length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        return NextResponse.json({ score, total, correct, results });
    } catch (error: any) {
        console.error('[POST /api/courseTests/:id/submit]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
