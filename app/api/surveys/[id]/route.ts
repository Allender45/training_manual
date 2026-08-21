import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';
import { hasFeature } from '@/lib/permissions';

async function canConduct(auth: { userId: number; roleId: number | null }, surveyId: string) {
    if (hasFeature(auth.roleId, 'checklistsManage')) return true;
    const res = await pool.query('SELECT mentor_id FROM surveys WHERE id = $1', [surveyId]);
    return res.rows[0]?.mentor_id === auth.userId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const survey = await pool.query(
            `SELECT s.id, s.status, s.checklist_id, s.summary, s.scheduled_at, s.conducted_at,
                    c.title AS checklist_title, c.description AS checklist_description,
                    TRIM(ui.last_name || ' ' || ui.first_name) AS intern_name,
                    TRIM(um.last_name || ' ' || um.first_name) AS mentor_name
             FROM surveys s
             JOIN checklists c ON c.id = s.checklist_id
             JOIN users ui ON ui.id = s.intern_id
             LEFT JOIN users um ON um.id = s.mentor_id
             WHERE s.id = $1`,
            [params.id]
        );
        if (!survey.rows[0]) return NextResponse.json({ error: 'Беседа не найдена' }, { status: 404 });
        if (!(await canConduct(auth, params.id)))
            return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

        const items = await pool.query(
            `SELECT i.id, i.position, i.question, i.answer_type, i.is_required, i.speech_module,
                    a.value AS answer_value, a.audio_url AS answer_audio_url
             FROM checklist_items i
             LEFT JOIN survey_answers a ON a.item_id = i.id AND a.survey_id = $1
             WHERE i.checklist_id = $2
             ORDER BY i.position`,
            [params.id, survey.rows[0].checklist_id]
        );

        return NextResponse.json({ survey: survey.rows[0], items: items.rows });
    } catch (error) {
        console.error('[GET /api/surveys/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (!(await canConduct(auth, params.id)))
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

    const client = await pool.connect();
    try {
        const { answers, summary, finish } = await req.json();

        const survey = await client.query('SELECT status FROM surveys WHERE id = $1', [params.id]);
        if (!survey.rows[0]) return NextResponse.json({ error: 'Беседа не найдена' }, { status: 404 });
        if (['done', 'cancelled'].includes(survey.rows[0].status))
            return NextResponse.json({ error: 'Беседа уже завершена' }, { status: 409 });

        if (finish) {
            // Все обязательные вопросы должны иметь ответ
            const missing = await client.query(
                `SELECT i.id FROM checklist_items i
                 JOIN surveys s ON s.checklist_id = i.checklist_id
                 LEFT JOIN survey_answers a ON a.item_id = i.id AND a.survey_id = s.id
                 WHERE s.id = $1 AND i.is_required = true AND a.id IS NULL
                   AND NOT ($2::jsonb @> jsonb_build_object('item_id', i.id))`,
                [params.id, JSON.stringify(answers ?? [])]
            );
            // проверку по переданным answers делаем ниже, после upsert
            if (missing.rows.length > 0 && !Array.isArray(answers))
                return NextResponse.json({ error: 'Ответьте на все обязательные вопросы' }, { status: 400 });
        }

        await client.query('BEGIN');

        if (Array.isArray(answers)) {
            for (const answer of answers) {
                if (!answer.item_id || answer.value === undefined) continue;
                await client.query(
                    `INSERT INTO survey_answers (survey_id, item_id, value, audio_url)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (survey_id, item_id)
                     DO UPDATE SET value = EXCLUDED.value, audio_url = EXCLUDED.audio_url`,
                    [params.id, answer.item_id, JSON.stringify(answer.value), answer.audio_url ?? null]
                );
            }
        }

        if (finish) {
            const missing = await client.query(
                `SELECT i.id FROM checklist_items i
                 JOIN surveys s ON s.checklist_id = i.checklist_id
                 LEFT JOIN survey_answers a ON a.item_id = i.id AND a.survey_id = s.id
                 WHERE s.id = $1 AND i.is_required = true AND a.id IS NULL`,
                [params.id]
            );
            if (missing.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Ответьте на все обязательные вопросы' }, { status: 400 });
            }
        }

        await client.query(
            `UPDATE surveys
             SET status = $2::varchar,
                 summary = COALESCE($3, summary),
                 conducted_at = CASE WHEN $2::varchar = 'done' THEN now() ELSE conducted_at END,
                 updated_at = now()
             WHERE id = $1`,
            [params.id, finish ? 'done' : 'in_progress', summary?.trim() || null]
        );

        await client.query('COMMIT');
        return NextResponse.json({ ok: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[PATCH /api/surveys/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}