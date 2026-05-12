import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const result = await pool.query(
            `SELECT u.id, u.last_name, u.first_name, u.middle_name, u.phone, u.email,
                    u.photo, u.passport_series, u.passport_number,
                    TO_CHAR(u.birthday, 'YYYY-MM-DD') AS birthday,
                    u.comment, u.registered_at, u.role_id, r.name AS role
             FROM users u
                      LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
        }
        return NextResponse.json({ user: result.rows[0] });
    } catch (error: any) {
        console.error('[me]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    const userId = unsignSession(raw);
    if (!userId) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { last_name, first_name, middle_name, email,
            passport_series, passport_number, birthday, comment, role } = body;

        const phone = (body.phone as string ?? '').replace(/\D/g, '').replace(/^7/, '').slice(0, 10);

// resolve role_id by name
        let role_id: number | null = null;
        if (role) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            role_id = roleRes.rows[0]?.id ?? null;
        }

        const result = await pool.query(
            `UPDATE users
     SET last_name=$1, first_name=$2, middle_name=$3, phone=$4,
         email=$5, passport_series=$6, passport_number=$7, birthday=$8, comment=$9,
         role_id=$10
     WHERE id=$11
     RETURNING id, last_name, first_name, middle_name, phone, email,
         photo, passport_series, passport_number,
         TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
         comment, registered_at, role_id`,
            [last_name, first_name, middle_name, phone,
                email || null, passport_series || null, passport_number || null,
                birthday || null, comment || null, role_id, userId]
        );
        const user = result.rows[0];
        if (user) {
            const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
            user.role = roleRes.rows[0]?.name ?? null;
        }
        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('[patch me]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}