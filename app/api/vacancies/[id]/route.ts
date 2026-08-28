import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'sidebarVacanciesMenu');
    if (auth instanceof NextResponse) return auth;

    const vacancyId = Number(params.id);
    if (!Number.isInteger(vacancyId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    try {
        const vacancyRes = await pool.query('SELECT * FROM vacancies WHERE id = $1', [vacancyId]);
        if (!vacancyRes.rows[0]) return NextResponse.json({ error: 'Вакансия не найдена' }, { status: 404 });

        const leadsRes = await pool.query(
            'SELECT * FROM vacancy_leads WHERE vacancy_id = $1 ORDER BY created_at DESC',
            [vacancyId]
        );

        return NextResponse.json({ vacancy: vacancyRes.rows[0], leads: leadsRes.rows });
    } catch (error: any) {
        console.error('[vacancies/[id] GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'vacanciesTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const vacancyId = Number(params.id);
    if (!Number.isInteger(vacancyId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    try {
        const { title, description, imageUrl, status } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
        if (!description?.trim()) return NextResponse.json({ error: 'Описание обязательно' }, { status: 400 });

        const updated = await pool.query(
            `UPDATE vacancies
             SET title = $1, description = $2, image_url = $3, status = $4
             WHERE id = $5
             RETURNING id`,
            [title.trim(), description.trim(), imageUrl?.trim() || null, status ?? 'open', vacancyId]
        );
        if (!updated.rows[0]) return NextResponse.json({ error: 'Вакансия не найдена' }, { status: 404 });

        const result = await pool.query(
            `SELECT v.*, COUNT(l.id)::int AS leads_count
             FROM vacancies v LEFT JOIN vacancy_leads l ON l.vacancy_id = v.id
             WHERE v.id = $1 GROUP BY v.id`,
            [vacancyId]
        );
        return NextResponse.json({ vacancy: result.rows[0] });
    } catch (error: any) {
        console.error('[vacancies/[id] PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'vacanciesTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const vacancyId = Number(params.id);
    if (!Number.isInteger(vacancyId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM vacancy_leads WHERE vacancy_id = $1', [vacancyId]);
        const result = await client.query('DELETE FROM vacancies WHERE id = $1 RETURNING id', [vacancyId]);
        await client.query('COMMIT');
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Вакансия не найдена' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[vacancies/[id] DELETE]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}