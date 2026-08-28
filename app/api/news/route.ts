import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

async function sendPush(chatId: number, title: string, body: string, imageUrl: string | null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const text = `📰 *${title}*\n\n${body}`;
    const base = `https://api.telegram.org/bot${token}`;
    if (imageUrl) {
        await fetch(`${base}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: text, parse_mode: 'Markdown' }),
        });
    } else {
        await fetch(`${base}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        });
    }
}

export async function GET(req: NextRequest) {
    const auth = await requireFeature(req, 'sidebarNewsMenu');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            `SELECT n.*, TRIM(u.last_name || ' ' || u.first_name) AS author_name
             FROM news n
             LEFT JOIN users u ON u.id = n.created_by
             ORDER BY n.created_at DESC`
        );
        return NextResponse.json({ news: result.rows });
    } catch (error: any) {
        console.error('[news GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'newsTableManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, body, imageUrl, published, sendNotification } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });
        if (!body?.trim()) return NextResponse.json({ error: 'Текст новости обязателен' }, { status: 400 });

        const res = await pool.query(
            `INSERT INTO news (title, body, image_url, created_by, published)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [title.trim(), body.trim(), imageUrl?.trim() || null, auth.userId, published !== false]
        );
        const newsId = res.rows[0].id;

        if (sendNotification !== false) {
            const chatsRes = await pool.query(
                'SELECT telegram_chat_id FROM users WHERE is_active = true AND telegram_chat_id IS NOT NULL'
            );
            for (const row of chatsRes.rows) {
                try {
                    await sendPush(row.telegram_chat_id, title.trim(), body.trim(), imageUrl?.trim() || null);
                } catch (e) {
                    console.error(`[news] Не удалось отправить push пользователю ${row.telegram_chat_id}:`, e);
                }
            }
        }

        const created = await pool.query(
            `SELECT n.*, TRIM(u.last_name || ' ' || u.first_name) AS author_name
             FROM news n LEFT JOIN users u ON u.id = n.created_by WHERE n.id = $1`,
            [newsId]
        );
        return NextResponse.json({ news: created.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[news POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}