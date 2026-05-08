import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { name, comment, active } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        const result = await pool.query(
            'UPDATE roles SET name=$1, comment=$2, active=$3 WHERE id=$4 RETURNING id, name, active, comment',
            [name.trim(), comment?.trim() || null, active, params.id]
        );
        if (result.rows.length === 0) return NextResponse.json({ error: 'Роль не найдена' }, { status: 404 });
        return NextResponse.json({ role: result.rows[0] });
    } catch (error: any) {
        console.error('[roles PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query('DELETE FROM roles WHERE id=$1 RETURNING id', [params.id]);
        if (result.rows.length === 0) return NextResponse.json({ error: 'Роль не найдена' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[roles DELETE]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}