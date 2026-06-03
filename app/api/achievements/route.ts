import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query('SELECT id, icon, title, description FROM achievements ORDER BY id');
        return NextResponse.json({ achievements: result.rows });
    } catch (error: any) {
        console.error('[achievements GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { icon, title, description } = await req.json();
        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

        const result = await pool.query(
            'INSERT INTO achievements (icon, title, description) VALUES ($1, $2, $3) RETURNING id, icon, title, description',
            [icon?.trim() || '', title.trim(), description?.trim() || null]
        );
        return NextResponse.json({ achievement: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[achievements POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}