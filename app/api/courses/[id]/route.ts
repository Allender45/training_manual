import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';
import { IMAGE_EXT, extFromMime, validateUpload } from '@/lib/upload';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const result = await pool.query(
        `SELECT c.id, c.title, c.icon, c.description, c.comment,
                c.prerequisite_course_id, c.study_time_minutes,
                c.achievement_id, c.trainer_id, c.is_active, c.test_id,
                c.notify_trainee, c.notify_mentor,
                t.name AS trainer_name, t.component AS trainer_component
         FROM courses c
                  LEFT JOIN trainers t ON t.id = c.trainer_id
         WHERE c.id = $1`,
        [params.id]
    );

    if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ course: result.rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'coursesTableButtons');
    if (auth instanceof NextResponse) return auth;
    const userId = String(auth.userId);

    try {
        const formData = await req.formData();
        const title                  = (formData.get('title')                  as string)?.trim();
        const description            = (formData.get('description')            as string)?.trim();
        const comment                = (formData.get('comment')                as string)?.trim() || null;
        const prerequisite_course_id = (formData.get('prerequisite_course_id') as string) || null;
        const study_time_minutes     = (formData.get('study_time_minutes')     as string) || null;
        const achievement_id         = (formData.get('achievement_id')         as string) || null;
        const is_active              = (formData.get('is_active')              as string) === 'true';
        const iconFile               = formData.get('icon') as File | null;
        const trainer_id = (formData.get('trainer_id') as string) || null;
        const test_id = (formData.get('test_id') as string) || null;
        const notify_trainee = (formData.get('notify_trainee') as string)?.trim() || null;
        const notify_mentor  = (formData.get('notify_mentor')  as string)?.trim() || null;

        if (!title || !description) {
            return NextResponse.json({ error: 'Заполните обязательные поля: название, описание' }, { status: 400 });
        }

        let iconPath: string | null = null;
        if (iconFile && iconFile.size > 0) {
            const uploadError = validateUpload(iconFile, { allowedExt: IMAGE_EXT, maxSizeMb: 5 });
            if (uploadError) {
                return NextResponse.json({ error: uploadError }, { status: 400 });
            }
            const ext = extFromMime(iconFile.type) ?? 'png';
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
                                prerequisite_course_id = $4,
                                study_time_minutes     = $5,
                                achievement_id         = $6,
                                is_active              = $7,
                                trainer_id             = $8,
                                test_id                = $9,
                                notify_trainee         = $10,
                                notify_mentor          = $11,
                                icon                   = COALESCE($12, icon),
                                updated_by             = $13
             WHERE id = $14
             RETURNING id`,
            [
                title, description, comment,
                prerequisite_course_id || null,
                study_time_minutes ? Number(study_time_minutes) : null,
                achievement_id || null,
                is_active,
                trainer_id || null,
                test_id || null,
                notify_trainee,
                notify_mentor,
                iconPath,
                userId,
                params.id,
            ]
        );

        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[PATCH /api/courses/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'coursesTableButtons');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            'DELETE FROM courses WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/courses/test]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}