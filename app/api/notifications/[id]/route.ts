import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        await pool.query("UPDATE notifications SET status='read' WHERE id=$1 AND user_id=$2", [params.id, userId]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[notifications PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
