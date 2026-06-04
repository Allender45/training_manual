import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const result = await pool.query(
        `SELECT id, title, icon, type, description, content,
                prerequisite_id, comment, is_active
         FROM manuals WHERE id = $1`,
        [params.id]
    );
    if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ manual: result.rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const title           = (formData.get('title')           as string)?.trim();
        const type            = (formData.get('type')            as string) || 'text';
        const description     = (formData.get('description')     as string)?.trim();
        const contentText     = (formData.get('content')         as string)?.trim() ?? '';
        const prerequisite_id = (formData.get('prerequisite_id') as string) || null;
        const comment         = (formData.get('comment')         as string)?.trim() || null;
        const is_active       = (formData.get('is_active')       as string) === 'true';
        const iconFile        = formData.get('icon')        as File | null;
        const contentFile     = formData.get('contentFile') as File | null;

        if (!title || !description) {
            return NextResponse.json({ error: 'Заполните обязательные поля: название, описание' }, { status: 400 });
        }

        let iconPath: string | null = null;
        if (iconFile && iconFile.size > 0) {
            const ext = iconFile.name.split('.').pop()?.toLowerCase() ?? 'png';
            const iconDir = path.join(process.cwd(), 'public', 'uploads', 'manuals', 'icons');
            await fs.mkdir(iconDir, { recursive: true });
            const iconFilename = `${Date.now()}_${params.id}.${ext}`;
            await fs.writeFile(path.join(iconDir, iconFilename), Buffer.from(await iconFile.arrayBuffer()));
            iconPath = `/uploads/manuals/icons/${iconFilename}`;
        }

        // Для text — всегда обновляем текст.
        // Для video/audio — обновляем только если загружен новый файл, иначе null → ELSE content.
        let contentUpdate: string | null = null;
        if (type === 'text') {
            contentUpdate = contentText;
        } else if (contentFile && contentFile.size > 0) {
            const cExt   = contentFile.name.split('.').pop()?.toLowerCase() ?? (type === 'video' ? 'mp4' : 'mp3');
            const subDir = type === 'video' ? 'video' : 'audio';
            const cDir   = path.join(process.cwd(), 'public', 'uploads', 'manuals', subDir);
            await fs.mkdir(cDir, { recursive: true });
            const cFilename = `${Date.now()}_${params.id}.${cExt}`;
            await fs.writeFile(path.join(cDir, cFilename), Buffer.from(await contentFile.arrayBuffer()));
            contentUpdate = `/uploads/manuals/${subDir}/${cFilename}`;
        }

        const result = await pool.query(
            `UPDATE manuals SET
                                title           = $1,
                                type            = $2,
                                description     = $3,
                                content         = COALESCE($4::text, content),
                                prerequisite_id = $5,
                                comment         = $6,
                                is_active       = $7,
                                icon            = COALESCE($8, icon),
                                updated_by      = $9
             WHERE id = $10
             RETURNING id`,
            [title, type, description, contentUpdate,
                prerequisite_id || null, comment, is_active, iconPath, userId, params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[PATCH /api/manuals/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            'DELETE FROM manuals WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/manuals/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}