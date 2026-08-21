import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';
import { hasFeature } from '@/lib/permissions';

export async function GET(req: NextRequest) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const viewAll = hasFeature(auth.roleId, 'checklistsManage');
        const status = req.nextUrl.searchParams.get('status');

        const result = await pool.query(
            `SELECT s.id, s.status, s.scheduled_at, s.conducted_at,
                    c.title AS checklist_title,
                    t.title AS trigger_title,
                    TRIM(ui.last_name || ' ' || ui.first_name) AS intern_name,
                    TRIM(um.last_name || ' ' || um.first_name) AS mentor_name
             FROM surveys s
             JOIN checklists c ON c.id = s.checklist_id
             LEFT JOIN checklist_triggers t ON t.id = s.trigger_id
             JOIN users ui ON ui.id = s.intern_id
             LEFT JOIN users um ON um.id = s.mentor_id
             WHERE ($1::boolean OR s.mentor_id = $2)
               AND ($3::varchar IS NULL OR s.status = $3)
             ORDER BY s.scheduled_at DESC`,
            [viewAll, auth.userId, status || null]
        );
        return NextResponse.json({ surveys: result.rows });
    } catch (error) {
        console.error('[GET /api/surveys]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}