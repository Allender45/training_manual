import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
    const { name, phone, city } = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });

    const { rows } = await pool.query(
        'SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL'
    );

    if (rows.length === 0) return NextResponse.json({ ok: true, sent: 0 });

    const text = `📋 *Новая заявка на вакансию с сайта УП*\n\n👤 *Имя:* ${name}\n📞 *Телефон:* ${phone}\n🏙️ *Город:* ${city}`;

    await Promise.allSettled(
        rows.map(({ telegram_chat_id }) =>
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: 230881144, text, parse_mode: 'Markdown' }),
            })
        )
    );

    return NextResponse.json({ ok: true });
}