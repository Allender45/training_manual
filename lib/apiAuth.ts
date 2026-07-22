import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unsignSession } from '@/lib/session';
import { hasFeature } from '@/lib/permissions';
import type { Feature } from '@/lib/permissions';

export type AuthContext = {
    userId: number;
    roleId: number | null;
    crmId: number | null;
};

export async function getAuth(req: NextRequest): Promise<AuthContext | null> {
    const raw = req.cookies.get('session')?.value ?? '';
    const sessionValue = unsignSession(raw);
    const userId = Number(sessionValue);
    if (!sessionValue || !Number.isInteger(userId)) return null;

    const result = await pool.query('SELECT role_id, crm_id FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) return null;
    return {
        userId,
        roleId: result.rows[0].role_id ?? null,
        crmId: result.rows[0].crm_id ?? null,
    };
}

export async function requireFeature(req: NextRequest, feature: Feature): Promise<AuthContext | NextResponse> {
    try {
        const auth = await getAuth(req);
        if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        if (!hasFeature(auth.roleId, feature)) {
            return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
        }
        return auth;
    } catch (error) {
        console.error('[apiAuth]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

// Доступ к персональным данным (звонки, статистика, адаптация, прогресс):
// сам пользователь или роли с правами editUser/mentorWidgets.
export function canAccessUserData(auth: AuthContext, isSelf: boolean): boolean {
    if (isSelf) return true;
    return hasFeature(auth.roleId, 'editUser') || hasFeature(auth.roleId, 'mentorWidgets');
}
