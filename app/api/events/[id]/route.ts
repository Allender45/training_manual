import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'sidebarEventsMenu');
    if (auth instanceof NextResponse) return auth;

    const eventId = Number(params.id);
    if (!Number.isInteger(eventId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    try {
        const eventRes = await pool.query(
            `SELECT e.*, d.name AS department_name
             FROM events e
             LEFT JOIN departments d ON d.id = e.department_id
             WHERE e.id = $1`,
            [eventId]
        );
        if (!eventRes.rows[0]) return NextResponse.json({ error: 'Мероприятие не найдено' }, { status: 404 });

        const slotsRes = await pool.query(
            `SELECT s.id, s.label, s.capacity, COUNT(p.id)::int AS taken
             FROM event_slots s
             LEFT JOIN event_participants p ON p.slot_id = s.id
             WHERE s.event_id = $1
             GROUP BY s.id
             ORDER BY s.id`,
            [eventId]
        );

        const participantsRes = await pool.query(
            `SELECT p.id, p.user_id, p.slot_id, u.first_name, u.last_name, p.registered_at
             FROM event_participants p
             JOIN users u ON u.id = p.user_id
             WHERE p.event_id = $1
             ORDER BY p.registered_at`,
            [eventId]
        );

        return NextResponse.json({
            event: eventRes.rows[0],
            slots: slotsRes.rows,
            participants: participantsRes.rows,
        });
    } catch (error: any) {
        console.error('[events/[id] GET]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'eventsTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const eventId = Number(params.id);
    if (!Number.isInteger(eventId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    try {
        const { title, description, category, startsAt, visibility, departmentId, hideParticipants, status, slots } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
        if (!startsAt) return NextResponse.json({ error: 'Дата начала обязательна' }, { status: 400 });
        if (visibility === 'department' && !departmentId) {
            return NextResponse.json({ error: 'Выберите подразделение' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updated = await client.query(
                `UPDATE events
                 SET title = $1, description = $2, category = $3, starts_at = $4,
                     visibility = $5, department_id = $6, hide_participants = $7, status = $8
                 WHERE id = $9
                 RETURNING id`,
                [
                    title.trim(),
                    description?.trim() || '',
                    category?.trim() || '',
                    startsAt,
                    visibility,
                    visibility === 'department' ? departmentId : null,
                    !!hideParticipants,
                    status ?? 'open',
                    eventId,
                ]
            );
            if (!updated.rows[0]) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Мероприятие не найдено' }, { status: 404 });
            }

            for (const slot of (slots ?? [])) {
                if (!slot?.label?.trim()) continue;
                const capacity = Number(slot.capacity) || 1;
                if (slot.id) {
                    await client.query(
                        'UPDATE event_slots SET label = $1, capacity = $2 WHERE id = $3 AND event_id = $4',
                        [slot.label.trim(), capacity, slot.id, eventId]
                    );
                } else {
                    await client.query(
                        'INSERT INTO event_slots (event_id, label, capacity) VALUES ($1, $2, $3)',
                        [eventId, slot.label.trim(), capacity]
                    );
                }
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        const eventRes = await pool.query(
            `SELECT e.*, d.name AS department_name FROM events e LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = $1`,
            [eventId]
        );
        const slotsRes = await pool.query(
            `SELECT s.id, s.label, s.capacity, COUNT(p.id)::int AS taken
             FROM event_slots s LEFT JOIN event_participants p ON p.slot_id = s.id
             WHERE s.event_id = $1 GROUP BY s.id ORDER BY s.id`,
            [eventId]
        );
        return NextResponse.json({ event: eventRes.rows[0], slots: slotsRes.rows });
    } catch (error: any) {
        console.error('[events/[id] PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireFeature(req, 'eventsTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const eventId = Number(params.id);
    if (!Number.isInteger(eventId)) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM event_participants WHERE event_id = $1', [eventId]);
        await client.query('DELETE FROM event_slots WHERE event_id = $1', [eventId]);
        const result = await client.query('DELETE FROM events WHERE id = $1 RETURNING id', [eventId]);
        await client.query('COMMIT');
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Мероприятие не найдено' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[events/[id] DELETE]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    } finally {
        client.release();
    }
}