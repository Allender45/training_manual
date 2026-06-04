import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT id, name, description, component, is_active, created_at
             FROM trainers
             WHERE is_active = true
             ORDER BY created_at ASC`
        );
        return NextResponse.json({ trainers: result.rows });
    } catch (error: any) {
        console.error('[GET /api/trainers]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}