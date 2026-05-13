import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('course_id');

        const result = await pool.query(
            `SELECT m.id, m.title, m.icon, m.type, m.description, m.content,
                    m.course_id, c.title AS course_title,
                    m.prerequisite_id, m.comment, m.is_active, m.created_at
             FROM manuals m
                      LEFT JOIN courses c ON c.id = m.course_id
             ${courseId ? 'WHERE m.course_id = $1' : ''}
             ORDER BY m.created_at ASC`,
            courseId ? [courseId] : []
        );
        return NextResponse.json({ manuals: result.rows });
    } catch (error: any) {
        console.error('[GET /api/manuals]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const title           = (formData.get('title')           as string)?.trim();
        const type            = (formData.get('type')            as string) || 'text';
        const description     = (formData.get('description')     as string)?.trim();
        const contentText     = (formData.get('content')         as string)?.trim() || null;
        const course_id       = (formData.get('course_id')       as string) || null;
        const prerequisite_id = (formData.get('prerequisite_id') as string) || null;
        const comment         = (formData.get('comment')         as string)?.trim() || null;
        const is_active       = (formData.get('is_active')       as string) === 'true';
        const iconFile        = formData.get('icon')        as File | null;
        const contentFile     = formData.get('contentFile') as File | null;

        if (!title || !description) {
            return NextResponse.json({ error: 'Заполните обязательные поля: название, описание' }, { status: 400 });
        }
        if (!iconFile || iconFile.size === 0) {
            return NextResponse.json({ error: 'Выберите иконку материала' }, { status: 400 });
        }
        if (!['text', 'video', 'audio'].includes(type)) {
            return NextResponse.json({ error: 'Некорректный тип материала' }, { status: 400 });
        }

        const path = await import('path');
        const fs   = await import('fs/promises');

        const ext = iconFile.name.split('.').pop()?.toLowerCase() ?? 'png';
        const iconDir = path.default.join(process.cwd(), 'public', 'uploads', 'manuals', 'icons');
        await fs.default.mkdir(iconDir, { recursive: true });
        const iconFilename = `${Date.now()}_${title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_').slice(0, 40)}.${ext}`;
        await fs.default.writeFile(path.default.join(iconDir, iconFilename), Buffer.from(await iconFile.arrayBuffer()));
        const iconPath = `/uploads/manuals/icons/${iconFilename}`;

        let contentValue: string | null = contentText;
        if (type !== 'text' && contentFile && contentFile.size > 0) {
            const cExt    = contentFile.name.split('.').pop()?.toLowerCase() ?? (type === 'video' ? 'mp4' : 'mp3');
            const subDir  = type === 'video' ? 'video' : 'audio';
            const cDir    = path.default.join(process.cwd(), 'public', 'uploads', 'manuals', subDir);
            await fs.default.mkdir(cDir, { recursive: true });
            const cFilename = `${Date.now()}_${title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_').slice(0, 40)}.${cExt}`;
            await fs.default.writeFile(path.default.join(cDir, cFilename), Buffer.from(await contentFile.arrayBuffer()));
            contentValue = `/uploads/manuals/${subDir}/${cFilename}`;
        }

        const result = await pool.query(
            `INSERT INTO manuals (title, icon, type, description, content, course_id, prerequisite_id, comment, is_active, created_by, updated_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
             RETURNING id, title`,
            [title, iconPath, type, description, contentValue, course_id || null, prerequisite_id || null, comment, is_active, userId]
        );
        return NextResponse.json({ manual: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('[POST /api/manuals]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}