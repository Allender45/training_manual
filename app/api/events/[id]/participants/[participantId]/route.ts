import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireFeature } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; participantId: string } }) {
    const auth = await requireFeature(req, 'eventsTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    const eventId = Number(params.id);
    const participantId = Number(params.participantId);
    if (!Number.isInteger(eventId) || !Number.isInteger(participantId)) {
        return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
    }

    try {
        const { slotId } = await req.json();
        const targetSlotId = slotId ? Number(slotId) : null;

        if (targetSlotId) {
            const slot = await pool.query(
                `SELECT s.capacity, COUNT(p.id)::int AS taken
                 FROM event_slots s
                 LEFT JOIN event_participants p ON p.slot_id = s.id AND p.id != $2
                 WHERE s.id = $1 AND s.event_id = $3
                 GROUP BY s.id`,
                [targetSlotId, participantId, eventId]
            );
            if (!slot.rows[0]) return NextResponse.json({ error: 'Дорожка не найдена' }, { status: 404 });
            if (slot.rows[0].taken >= slot.rows[0].capacity) {
                return NextResponse.json({ error: 'На дорожке нет свободных мест' }, { status: 400 });
            }
        }

        const res = await pool.query(
            'UPDATE event_participants SET slot_id = $1 WHERE id = $2 AND event_id = $3 RETURNING id',
            [targetSlotId, participantId, eventId]
        );
        if (!res.rows[0]) return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[participants PATCH]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}