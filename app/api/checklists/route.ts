import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

const ANSWER_TYPES = ['yesno', 'checkbox', 'rating', 'text'];

type ItemInput = { question: string; answer_type: string; is_required?: boolean };

function validateItems(items: ItemInput[]): string | null {
    if (!Array.isArray(items) || items.length === 0) return 'Добавьте хотя бы один вопрос';
    for (const item of items) {
        if (!item.question?.replace(/<[^>]*>/g, '').trim()) return 'У всех вопросов должен быть текст';
        if (!ANSWER_TYPES.includes(item.answer_type)) return `Недопустимый тип ответа: ${item.answer_type}`;
    }
    return null;
}

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT c.id, c.title, c.description, c.is_active, c.created_at,
                    COUNT(i.id)::int AS items_count
             FROM checklists c
             LEFT JOIN checklist_items i ON i.checklist_id = c.id
             GROUP BY c.id
             ORDER BY c.created_at DESC`
        );
        return NextResponse.json({ checklists: result.rows });
    } catch (error) {
        console.error('[GET /api/checklists]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'checklistsManage');
    if (auth instanceof NextResponse) return auth;

    const client = await pool.connect();
    try {
        const { title, description, items } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Укажите название' }, { status: 400 });
        const itemsError = validateItems(items);
        if (itemsError) return NextResponse.json({ error: itemsError }, { status: 400 });

        await client.query('BEGIN');

        const created = await client.query(
            `INSERT INTO checklists (title, description, created_by, updated_by)
             VALUES ($1, $2, $3, $3) RETURNING id`,
            [title.trim(), description?.trim() || null, auth.userId]
        );
        const checklistId = created.rows[0].id;

        for (let i = 0; i < items.length; i++) {
            await client.query(
                `INSERT INTO checklist_items (checklist_id, position, question, answer_type, is_required, speech_module)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [checklistId, i, items[i].question, items[i].answer_type, items[i].is_required !== false,
                    items[i].speech_module || null]
            );
        }

        await client.query('COMMIT');
        return NextResponse.json({ checklist: { id: checklistId, title } }, { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[POST /api/checklists]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}