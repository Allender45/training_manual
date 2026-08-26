import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const auth = await requireFeature(req, 'sidebarVacanciesMenu');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            `SELECT v.*, COUNT(l.id)::int AS leads_count
             FROM vacancies v
             LEFT JOIN vacancy_leads l ON l.vacancy_id = v.id
             GROUP BY v.id
             ORDER BY v.created_at DESC`
        );
        return NextResponse.json({ vacancies: result.rows });
    } catch (error: any) {
        console.error('[vacancies GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'vacanciesTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, description, imageUrl } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
        if (!description?.trim()) return NextResponse.json({ error: 'Описание обязательно' }, { status: 400 });

        const res = await pool.query(
            `INSERT INTO vacancies (title, description, image_url, created_by)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [title.trim(), description.trim(), imageUrl?.trim() || null, auth.userId]
        );

        const created = await pool.query(
            `SELECT v.*, 0 AS leads_count FROM vacancies v WHERE v.id = $1`,
            [res.rows[0].id]
        );
        return NextResponse.json({ vacancy: created.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[vacancies POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}