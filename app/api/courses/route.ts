import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            `SELECT c.id, c.title, c.icon, c.description, c.study_time_minutes,
                    c.is_active, c.created_at, a.title AS achievement
             FROM courses c
                      LEFT JOIN achievements a ON a.id = c.achievement_id
             ORDER BY c.created_at DESC`
        );
        return NextResponse.json({ courses: result.rows });
    } catch (error: any) {
        console.error('[GET /api/courses]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const title                  = (formData.get('title')                  as string)?.trim();
        const description            = (formData.get('description')            as string)?.trim();
        const comment                = (formData.get('comment')                as string)?.trim() || null;
        const prerequisite_manual_id = (formData.get('prerequisite_manual_id') as string) || null;
        const study_time_minutes     = (formData.get('study_time_minutes')     as string) || null;
        const achievement_id         = (formData.get('achievement_id')         as string) || null;
        const is_active              = (formData.get('is_active')              as string) === 'true';
        const iconFile               = formData.get('icon') as File | null;

        if (!title || !description) {
            return NextResponse.json({ error: 'Заполните обязательные поля: название, описание' }, { status: 400 });
        }
        if (!iconFile || iconFile.size === 0) {
            return NextResponse.json({ error: 'Выберите иконку курса' }, { status: 400 });
        }

        const path = await import('path');
        const fs   = await import('fs/promises');
        const ext  = iconFile.name.split('.').pop()?.toLowerCase() ?? 'png';
        const uploadsDir = path.default.join(process.cwd(), 'public', 'uploads', 'courses');
        await fs.default.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}_${title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_').slice(0, 40)}.${ext}`;
        await fs.default.writeFile(
            path.default.join(uploadsDir, filename),
            Buffer.from(await iconFile.arrayBuffer())
        );
        const iconPath = `/uploads/courses/${filename}`;

        const result = await pool.query(
            `INSERT INTO courses
             (title, icon, description, comment, prerequisite_manual_id,
              study_time_minutes, achievement_id, is_active, created_by, updated_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
             RETURNING id, title`,
            [
                title, iconPath, description, comment,
                prerequisite_manual_id || null,
                study_time_minutes ? Number(study_time_minutes) : null,
                achievement_id || null,
                is_active,
                userId,
            ]
        );
        return NextResponse.json({ course: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[POST /api/courses]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}