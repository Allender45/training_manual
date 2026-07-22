import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT id, title, content, is_active, created_at FROM functional_instructions ORDER BY created_at ASC`
        );
        return NextResponse.json({ instructions: result.rows });
    } catch (error: any) {
        console.error('[GET /api/functional]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'functionalAddButton');
    if (auth instanceof NextResponse) return auth;
    const userId = String(auth.userId);

    try {
        const body = await req.json();
        const is_active = body.is_active !== false;
        const title   = (body.title   as string)?.trim();
        const content = (body.content as string)?.trim() || null;

        if (!title) {
            return NextResponse.json({ error: 'Заполните обязательное поле: название' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO functional_instructions (title, content, is_active, created_by, updated_by)
             VALUES ($1, $2, $3, $4, $4)
             RETURNING id, title`,
            [title, content, is_active, userId]
        );
        return NextResponse.json({ instruction: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[POST /api/functional]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}