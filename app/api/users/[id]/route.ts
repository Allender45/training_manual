import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const result = await pool.query(
        `SELECT u.id, u.last_name, u.first_name, u.middle_name,
                u.phone, u.email, u.photo,
                u.passport_series, u.passport_number,
                TO_CHAR(u.birthday, 'YYYY-MM-DD') AS birthday,
                u.comment, u.is_active,
                COALESCE(r.name, '') AS role
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1`,
        [params.id]
    );

    if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ user: result.rows[0] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const last_name   = (formData.get('last_name')   as string)?.trim();
        const first_name  = (formData.get('first_name')  as string)?.trim();
        const middle_name = (formData.get('middle_name') as string)?.trim();
        const phoneRaw    = (formData.get('phone')       as string)?.trim();
        const email       = (formData.get('email')       as string)?.trim() || null;
        const role        = (formData.get('role')        as string)?.trim() || null;
        const passport_series = (formData.get('passport_series') as string)?.trim() || null;
        const passport_number = (formData.get('passport_number') as string)?.trim() || null;
        const birthday    = (formData.get('birthday')    as string) || null;
        const comment     = (formData.get('comment')     as string)?.trim() || null;
        const photoFile   = formData.get('photo') as File | null;
        const is_active = formData.get('is_active') as string;

        const phone = phoneRaw?.replace(/\D/g, '').replace(/^7/, '').slice(0, 10) || null;

        let role_id: number | null = null;
        if (role) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            role_id = roleRes.rows[0]?.id ?? null;
        }

        let photoPath: string | null = null;
        if (photoFile && photoFile.size > 0) {
            const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? '';
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadsDir, { recursive: true });
            const filename = `${Date.now()}_${params.id}.${ext}`;
            const bytes = await photoFile.arrayBuffer();
            await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(bytes));
            photoPath = `/uploads/${filename}`;
        }

        const result = await pool.query(
            `UPDATE users SET
                last_name = COALESCE($1, last_name),
                first_name = COALESCE($2, first_name),
                middle_name = COALESCE($3, middle_name),
                phone = COALESCE($4, phone),
                email = $5,
                passport_series = $6,
                passport_number = $7,
                birthday = COALESCE(NULLIF($8, ''), birthday::text)::date,
                comment = $9,
                role_id = COALESCE($10, role_id),
                photo = COALESCE($11, photo),
                is_active = COALESCE(NULLIF($12, '')::boolean, is_active)
             WHERE id = $13
             RETURNING id`,
            [last_name, first_name, middle_name, phone, email,
                passport_series, passport_number, birthday, comment,
                role_id, photoPath, is_active, params.id]
        );

        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[PATCH /api/users/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [params.id]
        );
        if (!result.rows[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[DELETE /api/users/[id]]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}