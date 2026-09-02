import pool from '../../db';
import bcrypt from 'bcryptjs';
import { AppUser } from '../../middlewares/resolveUser';
import { isAdmin } from '../../permissions';

export interface EventRow {
    id: number;
    title: string;
    description: string;
    category: string;
    starts_at: string;
    status: string;
    visibility: string;
    hide_participants: boolean;
}

export interface SlotRow {
    id: number;
    label: string;
    capacity: number;
    taken: number;
}

export interface DepartmentRow {
    id: number;
    name: string;
}

export interface CreateEventInput {
    title: string;
    description: string;
    category: string;
    startsAt: string;
    visibility: 'all' | 'department';
    departmentId: number | null;
    createdBy: number;
    hideParticipants: boolean;
    slots: { label: string; capacity: number }[];
}

export interface GuestUserInput {
    lastName: string;
    firstName: string;
    middleName: string;
    phone: string;
    telegramChatId: number;
}

export async function getDepartments(): Promise<DepartmentRow[]> {
    const { rows } = await pool.query('SELECT id, name FROM departments ORDER BY name');
    return rows;
}

export async function getVisibleEvents(user: AppUser | null): Promise<EventRow[]> {
    if (!user) {
        const { rows } = await pool.query(
            `SELECT id, title, description, category, starts_at, status, visibility, hide_participants
             FROM events
             WHERE status = 'open' AND visibility = 'all'
             ORDER BY starts_at`
        );
        return rows;
    }

    if (isAdmin(user)) {
        const { rows } = await pool.query(
            `SELECT id, title, description, category, starts_at, status, visibility, hide_participants
             FROM events
             WHERE status = 'open'
             ORDER BY starts_at`
        );
        return rows;
    }

    const { rows } = await pool.query(
        `SELECT DISTINCT e.id,
                         e.title,
                         e.description,
                         e.category,
                         e.starts_at,
                         e.status,
                         e.visibility,
                         e.hide_participants
         FROM events e
                  LEFT JOIN event_audience ea ON ea.event_id = e.id AND ea.user_id = $1
         WHERE e.status = 'open'
           AND (
             e.visibility = 'all'
                 OR (e.visibility = 'department' AND e.department_id = $2)
                 OR (e.visibility = 'whitelist' AND ea.user_id IS NOT NULL)
             )
         ORDER BY e.starts_at`,
        [user.id, user.department_id]
    );
    return rows;
}

export async function getEvent(eventId: number): Promise<EventRow | null> {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    return rows[0] ?? null;
}

export async function getEventSlots(eventId: number): Promise<SlotRow[]> {
    const { rows } = await pool.query(
        `SELECT s.id, s.label, s.capacity, COUNT(p.id)::int AS taken
         FROM event_slots s
         LEFT JOIN event_participants p ON p.slot_id = s.id
         WHERE s.event_id = $1
         GROUP BY s.id
         ORDER BY s.id`,
        [eventId]
    );
    return rows;
}

export async function getUserRegistration(eventId: number, userId: number) {
    const { rows } = await pool.query(
        'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );
    return rows[0] ?? null;
}

export async function registerForEvent(eventId: number, userId: number, slotId: number | null): Promise<boolean> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (slotId) {
            const slot = await client.query(
                `SELECT s.capacity, COUNT(p.id)::int AS taken
                 FROM event_slots s
                 LEFT JOIN event_participants p ON p.slot_id = s.id
                 WHERE s.id = $1
                 GROUP BY s.id`,
                [slotId]
            );
            if (!slot.rows[0] || slot.rows[0].taken >= slot.rows[0].capacity) {
                await client.query('ROLLBACK');
                return false;
            }
        }
        await client.query(
            'INSERT INTO event_participants (event_id, slot_id, user_id) VALUES ($1, $2, $3)',
            [eventId, slotId, userId]
        );
        await client.query('COMMIT');
        return true;
    } catch {
        await client.query('ROLLBACK');
        return false;
    } finally {
        client.release();
    }
}

export async function cancelRegistration(eventId: number, userId: number): Promise<boolean> {
    const res = await pool.query(
        'DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );
    return (res.rowCount ?? 0) > 0;
}

export async function createEvent(input: CreateEventInput): Promise<number> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const res = await client.query(
            `INSERT INTO events (title, description, category, starts_at, visibility, department_id, created_by, hide_participants)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [input.title, input.description, input.category, input.startsAt, input.visibility, input.departmentId, input.createdBy, input.hideParticipants]
        );
        const eventId = res.rows[0].id;
        for (const slot of input.slots) {
            await client.query(
                'INSERT INTO event_slots (event_id, label, capacity) VALUES ($1, $2, $3)',
                [eventId, slot.label, slot.capacity]
            );
        }
        await client.query('COMMIT');
        return eventId;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export interface ParticipantRow {
    first_name: string;
    last_name: string;
    slot_label: string | null;
    registered_at: string;
}

export async function getEventParticipants(eventId: number): Promise<ParticipantRow[]> {
    const { rows } = await pool.query(
        `SELECT u.first_name, u.last_name, s.label AS slot_label, p.registered_at
         FROM event_participants p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN event_slots s ON s.id = p.slot_id
         WHERE p.event_id = $1
         ORDER BY s.id NULLS FIRST, p.registered_at`,
        [eventId]
    );
    return rows;
}

export async function closeEvent(eventId: number): Promise<void> {
    await pool.query("UPDATE events SET status = 'closed' WHERE id = $1", [eventId]);
}

export async function deleteEvent(eventId: number): Promise<void> {
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
}

export async function createGuestUser(input: GuestUserInput): Promise<number> {
    const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'Стажёр'");
    const roleId = roleRes.rows[0]?.id ?? null;
    const passwordHash = await bcrypt.hash(input.phone, 12);
    const res = await pool.query(
        `INSERT INTO users (last_name, first_name, middle_name, phone, password_hash, role_id, telegram_chat_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [input.lastName, input.firstName, input.middleName, input.phone, passwordHash, roleId, input.telegramChatId]
    );
    return res.rows[0].id;
}

export async function getAppUserById(userId: number): Promise<AppUser | null> {
    const { rows } = await pool.query(
        'SELECT id, role_id, first_name, last_name, middle_name, phone, department_id FROM users WHERE id = $1',
        [userId]
    );
    return rows[0] ?? null;
}