import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const formData = await req.formData();
        const file = formData.get('photo') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filename = `id_${userId}_profilePhoto.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');

        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

        const photoUrl = `/uploads/photos/${filename}`;
        await pool.query('UPDATE users SET photo = $1 WHERE id = $2', [photoUrl, userId]);

        const result = await pool.query(
            'SELECT id, last_name, first_name, middle_name, phone, email, photo, passport_series, passport_number, birthday, comment, registered_at FROM users WHERE id = $1',
            [userId]
        );
        return NextResponse.json({ user: result.rows[0] });
    } catch (error: any) {
        console.error('[photo]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}