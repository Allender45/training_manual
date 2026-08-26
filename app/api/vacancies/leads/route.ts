import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const auth = await requireFeature(req, 'sidebarVacanciesMenu');
    if (auth instanceof NextResponse) return auth;

    const vacancyId = req.nextUrl.searchParams.get('vacancyId');

    try {
        const conditions: string[] = [];
        const values: any[] = [];
        if (vacancyId) {
            values.push(Number(vacancyId));
            conditions.push(`l.vacancy_id = $${values.length}`);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT l.*, v.title AS vacancy_title
             FROM vacancy_leads l
             JOIN vacancies v ON v.id = l.vacancy_id
             ${where}
             ORDER BY l.created_at DESC`,
            values
        );
        return NextResponse.json({ leads: result.rows });
    } catch (error: any) {
        console.error('[vacancies/leads GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}