import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { requireFeature } from '@/lib/apiAuth';
import { hasFeature } from '@/lib/permissions';
import { IMAGE_EXT, extFromMime, validateUpload } from '@/lib/upload';
import { phoneDigits } from '@/lib/format';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');

    if (scope === 'mentors') {
        const result = await pool.query(`
        SELECT u.id, TRIM(u.last_name || ' ' || u.first_name) AS name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Наставник' AND u.is_active = true
        ORDER BY u.last_name
    `);
        return NextResponse.json({ users: result.rows });
    }

    try {
        const meRes = await pool.query('SELECT role_id FROM users WHERE id = $1', [userId]);
        const roleId: number | null = meRes.rows[0]?.role_id ?? null;

        let result;
        if (roleId === 4) {
            result = await pool.query(
                `SELECT u.id,
                        TRIM(u.last_name || ' ' || u.first_name)                   AS name,
                        COALESCE(u.email, '')                                      AS email,
                        COALESCE(u.phone, '')                                      AS phone,
                        COALESCE(r.name, '')                                       AS role,
                        u.is_active                                                AS active,
                        u.photo,
                        u.crm_id,
                        u.adaptation_access,
                        TRIM(m_user.last_name || ' ' || m_user.first_name)         AS mentor_name,
                        COALESCE(up_count.completed, 0)                            AS courses_completed,
                        (SELECT COUNT(*)::int FROM manuals WHERE is_active = true) AS courses_total
                 FROM users u
                          LEFT JOIN roles r ON r.id = u.role_id
                          JOIN mentorships ms ON ms.intern_id = u.id AND ms.end_date IS NULL AND ms.mentor_id = $1
                          LEFT JOIN users m_user ON m_user.id = ms.mentor_id
                          LEFT JOIN (SELECT user_id, COUNT(*)::int AS completed
                                     FROM user_progress
                                     WHERE content_type = 'course'
                                     GROUP BY user_id) up_count ON up_count.user_id = u.id
                 ORDER BY u.last_name, u.first_name`,
                [userId]
            );
        } else {
            result = await pool.query(
                `SELECT u.id,
                        TRIM(u.last_name || ' ' || u.first_name) AS name,
                        COALESCE(u.email, '')                    AS email,
                        COALESCE(u.phone, '')                    AS phone,
                        COALESCE(r.name, '')                     AS role,
                        u.is_active                              AS active,
                        u.photo,
                        u.crm_id,
                        u.adaptation_access,
                        TRIM(m_user.last_name || ' ' || m_user.first_name) AS mentor_name,
                        COALESCE(up_count.completed, 0)                            AS courses_completed,
                        (SELECT COUNT(*)::int FROM manuals WHERE is_active = true) AS courses_total
                 FROM users u
                          LEFT JOIN roles r ON r.id = u.role_id
                          LEFT JOIN mentorships ms ON ms.intern_id = u.id AND ms.end_date IS NULL
                          LEFT JOIN users m_user ON m_user.id = ms.mentor_id
                          LEFT JOIN (SELECT user_id, COUNT(*)::int AS completed
                                     FROM user_progress
                                     WHERE content_type = 'course'
                                     GROUP BY user_id) up_count ON up_count.user_id = u.id
                 ORDER BY u.last_name, u.first_name`
            );
        }

        return NextResponse.json({ users: result.rows });
    } catch (error: any) {
        console.error('[GET /api/users]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'usersTableCreateButton');
    if (auth instanceof NextResponse) return auth;
    try {
        const formData = await req.formData();
        const last_name   = (formData.get('last_name')   as string)?.trim();
        const first_name  = (formData.get('first_name')  as string)?.trim();
        const middle_name = (formData.get('middle_name') as string)?.trim();
        const phoneRaw    = (formData.get('phone')       as string)?.trim();
        const email       = (formData.get('email')       as string)?.trim() || null;
        const password    = (formData.get('password')    as string);
        const roleRaw     = (formData.get('role')        as string)?.trim();
        const passport_series = (formData.get('passport_series') as string)?.trim() || null;
        const passport_number = (formData.get('passport_number') as string)?.trim() || null;
        const birthday    = (formData.get('birthday')    as string) || null;
        const comment     = (formData.get('comment')     as string)?.trim() || null;
        const photoFile   = formData.get('photo') as File | null;

        if (!hasFeature(auth.roleId, 'profileRoleChange') && roleRaw && roleRaw !== 'Стажёр') {
            return NextResponse.json({ error: 'Недостаточно прав для назначения этой роли' }, { status: 403 });
        }
        const role = roleRaw || 'Стажёр';

        if (!last_name || !first_name || !middle_name || !phoneRaw || !password) {
            return NextResponse.json({ error: 'Заполните обязательные поля: ФИО, телефон, пароль' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
        }

        const phone = phoneDigits(phoneRaw);

        let role_id: number | null = null;
        if (role) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            role_id = roleRes.rows[0]?.id ?? null;
        }

        let photoPath: string | null = null;
        if (photoFile && photoFile.size > 0) {
            const uploadError = validateUpload(photoFile, { allowedExt: IMAGE_EXT, maxSizeMb: 5 });
            if (uploadError) {
                return NextResponse.json({ error: uploadError }, { status: 400 });
            }
            const path = await import('path');
            const fs = await import('fs/promises');
            const ext = extFromMime(photoFile.type) ?? 'jpg';
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