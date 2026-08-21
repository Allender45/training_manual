import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

const OPERATORS = ['>', '>=', '<', '<=', '='];

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT t.id, t.title, t.metric_key, t.operator, t.threshold::float AS threshold,
                    t.is_active, t.checklist_id, t.created_at, t.updated_at,
                    c.title AS checklist_title
             FROM checklist_triggers t
                      LEFT JOIN checklists c ON c.id = t.checklist_id
             ORDER BY t.created_at DESC`
        );
        return NextResponse.json({ triggers: result.rows });
    } catch (error) {
        console.error('[GET /api/checklistTriggers]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'checklistTriggersManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, metric_key, operator, threshold, is_active, checklist_id } = await req.json();

        if (!title?.trim() || !metric_key?.trim() || !OPERATORS.includes(operator) || threshold === undefined || isNaN(Number(threshold))) {
            return NextResponse.json(
                { error: 'Заполните поля: название, метрика, оператор, порог' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `INSERT INTO checklist_triggers (title, metric_key, operator, threshold, is_active, checklist_id, created_by, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
             RETURNING id, title`,
            [title.trim(), metric_key.trim(), operator, Number(threshold), is_active !== false,
                checklist_id ? Number(checklist_id) : null, auth.userId]
        );
        return NextResponse.json({ trigger: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/checklistTriggers]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}