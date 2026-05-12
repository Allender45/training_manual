import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const result = await pool.query(
        `SELECT c.id, c.title, c.icon, c.description, c.comment,
                c.prerequisite_manual_id, c.study_time_minutes,
                c.achievement_id, c.is_active
         FROM courses c
         WHERE c.id = $1`,
        [params.id]
    );

    if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ course: result.rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

        let iconPath: string | null = null;
        if (iconFile && iconFile.size > 0) {
            const ext = iconFile.name.split('.').pop()?.toLowerCase() ?? 'png';
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
            await fs.mkdir(uploadsDir, { recursive: true });
            const filename = `${Date.now()}_${params.id}.${ext}`;
            await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(await iconFile.arrayBuffer()));
            iconPath = `/uploads/courses/${filename}`;
        }

        const result = await pool.query(
            `UPDATE courses SET
                title                  = $1,
                description            = $2,
                comment                = $3,
                prerequisite_manual_id = $4,
                study_time_minutes     = $5,
                achievement_id         = $6,
                is_active              = $7,
                icon                   = COALESCE($8, icon),
                updated_by             = $9
             WHERE id = $10
             RETURNING id`,
            [
                title, description, comment,
                prerequisite_manual_id || null,
                study_time_minutes ? Number(study_time_minutes) : null,
                achievement_id || null,
                is_active,
                iconPath,
                userId,
                params.id,
            ]
        );

        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[PATCH /api/courses/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            'DELETE FROM courses WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/courses/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}