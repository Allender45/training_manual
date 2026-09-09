import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { content_type, content_id, score } = await req.json();
        if (!['course', 'manual', 'test'].includes(content_type)) {
            return NextResponse.json({ error: 'Некорректный content_type' }, { status: 400 });
        }
        if (score !== undefined && score !== null
            && (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)) {
            return NextResponse.json({ error: 'Некорректный score' }, { status: 400 });
        }
        await pool.query(
            `INSERT INTO user_progress (user_id, content_type, content_id, score)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, content_type, content_id) DO UPDATE SET completed_at = NOW(), score = $4`,
            [userId, content_type, content_id, score ?? null]
        );

        // При завершении курса выдаём привязанную к курсу награду, если она задана.
        // Отдельный try/catch: сбой выдачи награды не должен ломать запись прогресса.
        if (content_type === 'course') {
            try {
                const courseRes = await pool.query(
                    'SELECT achievement_id FROM courses WHERE id = $1',
                    [content_id]
                );
                const achievementId = courseRes.rows[0]?.achievement_id;
                if (achievementId) {
                    await pool.query(
                        `INSERT INTO user_progress (user_id, content_type, content_id)
                         VALUES ($1, 'achievement', $2)
                         ON CONFLICT (user_id, content_type, content_id) DO NOTHING`,
                        [userId, achievementId]
                    );
                }
            } catch (grantError) {
                console.error('[POST /api/user-progress] Не удалось выдать награду курса:', grantError);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[POST /api/user-progress]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}