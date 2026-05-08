import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query('SELECT id, name, active, comment FROM roles ORDER BY id');
        return NextResponse.json({ roles: result.rows });
    } catch (error: any) {
        console.error('[roles GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { name, comment } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        const result = await pool.query(
            'INSERT INTO roles (name, active, comment) VALUES ($1, true, $2) RETURNING id, name, active, comment',
            [name.trim(), comment?.trim() || null]
        );
        return NextResponse.json({ role: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[roles POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}