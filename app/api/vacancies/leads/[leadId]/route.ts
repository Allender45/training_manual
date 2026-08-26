import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { leadId: string } }) {
    const auth = await requireFeature(req, 'vacanciesTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const leadId = Number(params.leadId);
    if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    try {
        const { status, comment } = await req.json();

        const updated = await pool.query(
            `UPDATE vacancy_leads
             SET status = COALESCE($1, status), comment = $2
             WHERE id = $3
             RETURNING id`,
            [status ?? null, comment ?? null, leadId]
        );
        if (!updated.rows[0]) return NextResponse.json({ error: 'Отклик не найден' }, { status: 404 });

        const result = await pool.query(
            `SELECT l.*, v.title AS vacancy_title FROM vacancy_leads l JOIN vacancies v ON v.id = l.vacancy_id WHERE l.id = $1`,
            [leadId]
        );
        return NextResponse.json({ lead: result.rows[0] });
    } catch (error: any) {
        console.error('[vacancies/leads/[leadId] PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}