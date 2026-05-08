import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query('SELECT id, name, active, comment FROM departments ORDER BY id');
        return NextResponse.json({ departments: result.rows });
    } catch (error: any) {
        console.error('[departments GET]', error);
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
            'INSERT INTO departments (name, active, comment) VALUES ($1, true, $2) RETURNING id, name, active, comment',
            [name.trim(), comment?.trim() || null]
        );
        return NextResponse.json({ departments: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[departments POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}