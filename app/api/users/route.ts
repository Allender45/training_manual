import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const result = await pool.query(
            `SELECT u.id,
                    TRIM(u.last_name || ' ' || u.first_name) AS name,
                    COALESCE(u.email, '')                    AS email,
                    COALESCE(u.phone, '')                    AS phone,
                    COALESCE(r.name, '')                     AS role,
                    u.is_active                              AS active,
                    u.photo
             FROM users u
                      LEFT JOIN roles r ON r.id = u.role_id
             ORDER BY u.last_name, u.first_name`
        );
        return NextResponse.json({ users: result.rows });
    } catch (error: any) {
        console.error('[GET /api/users]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const formData = await req.formData();
        const last_name   = (formData.get('last_name')   as string)?.trim();
        const first_name  = (formData.get('first_name')  as string)?.trim();
        const middle_name = (formData.get('middle_name') as string)?.trim();
        const phoneRaw    = (formData.get('phone')       as string)?.trim();
        const email       = (formData.get('email')       as string)?.trim() || null;
        const password    = (formData.get('password')    as string);
        const role        = (formData.get('role')        as string)?.trim() || null;
        const passport_series = (formData.get('passport_series') as string)?.trim() || null;
        const passport_number = (formData.get('passport_number') as string)?.trim() || null;
        const birthday    = (formData.get('birthday')    as string) || null;
        const comment     = (formData.get('comment')     as string)?.trim() || null;
        const photoFile   = formData.get('photo') as File | null;

        if (!last_name || !first_name || !middle_name || !phoneRaw || !password) {
            return NextResponse.json({ error: 'Заполните обязательные поля: ФИО, телефон, пароль' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
        }

        const phone = phoneRaw.replace(/\D/g, '').replace(/^7/, '').slice(0, 10);

        let role_id: number | null = null;
        if (role) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            role_id = roleRes.rows[0]?.id ?? null;
        }

        let photoPath: string | null = null;
        if (photoFile && photoFile.size > 0) {
            const path = await import('path');
            const fs = await import('fs/promises');
            const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? '';
            const uploadsDir = path.default.join(process.cwd(), 'public', 'uploads');
            await fs.default.mkdir(uploadsDir, { recursive: true });
            const regDate = new Date().toISOString().slice(0, 10);
            const san = (s: string) => s.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '_');
            const filename = `${regDate}_${phone}_${san(last_name)}_${san(first_name)}_${san(middle_name)}.${ext}`;
            const bytes = await photoFile.arrayBuffer();
            await fs.default.writeFile(path.default.join(uploadsDir, filename), Buffer.from(bytes));
            photoPath = `/uploads/${filename}`;
        }

        const password_hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users
             (last_name, first_name, middle_name, phone, email,
              photo, passport_series, passport_number, birthday, comment,
              password_hash, role_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING id, last_name, first_name, middle_name, phone, email, registered_at`,
            [last_name, first_name, middle_name, phone, email,
                photoPath, passport_series, passport_number,
                birthday, comment, password_hash, role_id]
        );
        return NextResponse.json({ user: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Пользователь с таким телефоном или email уже существует' }, { status: 409 });
        }
        console.error('[POST /api/users]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}