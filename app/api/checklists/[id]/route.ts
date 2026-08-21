import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

const ANSWER_TYPES = ['yesno', 'checkbox', 'rating', 'text'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'checklistsManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const checklist = await pool.query(
            'SELECT id, title, description, is_active FROM checklists WHERE id = $1',
            [params.id]
        );
        if (!checklist.rows[0]) return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });

        const items = await pool.query(
            `SELECT id, position, question, answer_type, is_required, speech_module
             FROM checklist_items WHERE checklist_id = $1 ORDER BY position`,
            [params.id]
        );
        return NextResponse.json({ checklist: checklist.rows[0], items: items.rows });
    } catch (error) {
        console.error('[GET /api/checklists/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'checklistsManage');
    if (auth instanceof NextResponse) return auth;

    const client = await pool.connect();
    try {
        const { title, description, is_active, items } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Укажите название' }, { status: 400 });
        if (!Array.isArray(items) || items.length === 0)
            return NextResponse.json({ error: 'Добавьте хотя бы один вопрос' }, { status: 400 });
        for (const item of items) {
            if (!item.question?.replace(/<[^>]*>/g, '').trim())
                return NextResponse.json({ error: 'У всех вопросов должен быть текст' }, { status: 400 });
            if (!ANSWER_TYPES.includes(item.answer_type))
                return NextResponse.json({ error: `Недопустимый тип ответа: ${item.answer_type}` }, { status: 400 });
        }

        await client.query('BEGIN');

        const updated = await client.query(
            `UPDATE checklists
             SET title = $1, description = $2, is_active = $3, updated_by = $4, updated_at = now()
             WHERE id = $5 RETURNING id`,
            [title.trim(), description?.trim() || null, is_active !== false, auth.userId, params.id]
        );
        if (!updated.rows[0]) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
        }

        // Вопросы пересоздаём целиком — порядок и состав всегда актуальны
        await client.query('DELETE FROM checklist_items WHERE checklist_id = $1', [params.id]);
        for (let i = 0; i < items.length; i++) {
            await client.query(
                `INSERT INTO checklist_items (checklist_id, position, question, answer_type, is_required, speech_module)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [params.id, i, items[i].question, items[i].answer_type, items[i].is_required !== false,
                    items[i].speech_module || null]
            );
        }

        await client.query('COMMIT');
        return NextResponse.json({ checklist: { id: Number(params.id), title } });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[PATCH /api/checklists/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'checklistsManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query('DELETE FROM checklists WHERE id = $1 RETURNING id', [params.id]);
        if (!result.rows[0]) return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[DELETE /api/checklists/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}