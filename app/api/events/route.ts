import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const auth = await requireFeature(req, 'sidebarEventsMenu');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await pool.query(
            `SELECT e.*, d.name AS department_name
             FROM events e
             LEFT JOIN departments d ON d.id = e.department_id
             ORDER BY e.starts_at DESC`
        );
        return NextResponse.json({ events: result.rows });
    } catch (error: any) {
        console.error('[events GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'eventsTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, description, category, startsAt, visibility, departmentId, hideParticipants, slots } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
        if (!startsAt) return NextResponse.json({ error: 'Дата начала обязательна' }, { status: 400 });
        if (visibility === 'department' && !departmentId) {
            return NextResponse.json({ error: 'Выберите подразделение' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const res = await client.query(
                `INSERT INTO events (title, description, category, starts_at, visibility, department_id, created_by, hide_participants)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [
                    title.trim(),
                    description?.trim() || '',
                    category?.trim() || '',
                    startsAt,
                    visibility,
                    visibility === 'department' ? departmentId : null,
                    auth.userId,
                    !!hideParticipants,
                ]
            );
            const eventId = res.rows[0].id;

            for (const slot of (slots ?? [])) {
                if (!slot?.label?.trim()) continue;
                await client.query(
                    'INSERT INTO event_slots (event_id, label, capacity) VALUES ($1, $2, $3)',
                    [eventId, slot.label.trim(), Number(slot.capacity) || 1]
                );
            }

            await client.query('COMMIT');

            const created = await pool.query(
                `SELECT e.*, d.name AS department_name FROM events e LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = $1`,
                [eventId]
            );
            return NextResponse.json({ event: created.rows[0] }, { status: 201 });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('[events POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}