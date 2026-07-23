import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const text: string = message.text ?? '';
    const chatId: number = message.chat.id;

    if (text.startsWith('/start ')) {
        const userId = parseInt(text.slice(7).trim(), 10);
        if (!isNaN(userId)) {
            await pool.query(
                'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
                [chatId, userId]
            );
        }
    }

    return NextResponse.json({ ok: true });
}