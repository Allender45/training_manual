import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

const OPERATORS = ['>', '>=', '<', '<=', '='];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'checklistTriggersManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, metric_key, operator, threshold, is_active, checklist_id } = await req.json();

        if (!title?.trim() || !metric_key?.trim() || !OPERATORS.includes(operator) || isNaN(Number(threshold))) {
            return NextResponse.json(
                { error: 'Заполните поля: название, метрика, оператор, порог' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `UPDATE checklist_triggers
             SET title = $1, metric_key = $2, operator = $3, threshold = $4,
                 is_active = $5, checklist_id = $6, updated_by = $7, updated_at = now()
             WHERE id = $8
             RETURNING id`,
            [title.trim(), metric_key.trim(), operator, Number(threshold), is_active !== false,
                checklist_id ? Number(checklist_id) : null, auth.userId, params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Триггер не найден' }, { status: 404 });
        return NextResponse.json({ trigger: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/checklistTriggers/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'checklistTriggersManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            'DELETE FROM checklist_triggers WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Триггер не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[DELETE /api/checklistTriggers/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}