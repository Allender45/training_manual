import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Неверный ID' }, { status: 400 });

    try {
        const result = await pool.query(
            `SELECT id, title, content, is_active FROM functional_instructions WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0)
            return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
        return NextResponse.json({ instruction: result.rows[0] });
    } catch (error) {
        console.error('[GET /api/functional/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireFeature(req, 'functionalEditButton');
    if (auth instanceof NextResponse) return auth;
    const userId = String(auth.userId);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Неверный ID' }, { status: 400 });

    try {
        const body = await req.json();
        const title   = (body.title   as string)?.trim();
        const content = (body.content as string)?.trim() || null;
        const is_active = body.is_active !== false;

        if (!title) return NextResponse.json({ error: 'Заполните обязательное поле: название' }, { status: 400 });

        const result = await pool.query(
            `UPDATE functional_instructions
             SET title = $1, content = $2, is_active = $3, updated_by = $4, updated_at = NOW()
             WHERE id = $5
             RETURNING id, title`,
            [title, content, is_active, userId, id]
        );
        if (result.rows.length === 0)
            return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

        return NextResponse.json({ instruction: result.rows[0] });
    } catch (error) {
        console.error('[PUT /api/functional/:id]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}