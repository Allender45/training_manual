import pool from '../../db';

export interface VacancyRow {
    id: number;
    title: string;
    description: string;
    image_url: string | null;
    status: string;
    created_by: number;
    created_at: string;
}

export interface CreateVacancyInput {
    title: string;
    description: string;
    imageUrl: string | null;
    createdBy: number;
}

export interface CreateLeadInput {
    vacancyId: number;
    referrerUserId: number | null;
    telegramId: number;
    fullName: string;
    phone: string;
}

export interface LeadRow {
    id: number;
    vacancy_id: number;
    referrer_user_id: number | null;
    telegram_id: number;
    full_name: string;
    phone: string;
    status: string;
    comment: string | null;
    created_at: string;
}

export interface LeadWithVacancy extends LeadRow {
    vacancy_title: string;
}

export async function createVacancy(input: CreateVacancyInput): Promise<number> {
    const { rows } = await pool.query(
        `INSERT INTO vacancies (title, description, image_url, created_by)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [input.title, input.description, input.imageUrl, input.createdBy]
    );
    return rows[0].id;
}

export async function getOpenVacancies(): Promise<VacancyRow[]> {
    const { rows } = await pool.query(
        `SELECT * FROM vacancies WHERE status = 'open' ORDER BY created_at DESC`
    );
    return rows;
}

export async function getVacancy(vacancyId: number): Promise<VacancyRow | null> {
    const { rows } = await pool.query('SELECT * FROM vacancies WHERE id = $1', [vacancyId]);
    return rows[0] ?? null;
}

export async function closeVacancy(vacancyId: number): Promise<void> {
    await pool.query("UPDATE vacancies SET status = 'closed' WHERE id = $1", [vacancyId]);
}

export async function deleteVacancy(vacancyId: number): Promise<void> {
    await pool.query('DELETE FROM vacancies WHERE id = $1', [vacancyId]);
}

export async function createLead(input: CreateLeadInput): Promise<number> {
    const { rows } = await pool.query(
        `INSERT INTO vacancy_leads (vacancy_id, referrer_user_id, telegram_id, full_name, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [input.vacancyId, input.referrerUserId, input.telegramId, input.fullName, input.phone]
    );
    return rows[0].id;
}

export async function getVacancyLeads(vacancyId: number): Promise<LeadRow[]> {
    const { rows } = await pool.query(
        'SELECT * FROM vacancy_leads WHERE vacancy_id = $1 ORDER BY created_at DESC',
        [vacancyId]
    );
    return rows;
}

export async function getLead(leadId: number): Promise<LeadRow | null> {
    const { rows } = await pool.query('SELECT * FROM vacancy_leads WHERE id = $1', [leadId]);
    return rows[0] ?? null;
}

export async function updateLeadStatus(leadId: number, status: string): Promise<void> {
    await pool.query('UPDATE vacancy_leads SET status = $1 WHERE id = $2', [status, leadId]);
}

export async function updateLeadComment(leadId: number, comment: string): Promise<void> {
    await pool.query('UPDATE vacancy_leads SET comment = $1 WHERE id = $2', [comment, leadId]);
}

export async function getAllLeads(): Promise<LeadWithVacancy[]> {
    const { rows } = await pool.query(
        `SELECT vl.*, v.title AS vacancy_title
         FROM vacancy_leads vl
         JOIN vacancies v ON v.id = vl.vacancy_id
         ORDER BY vl.created_at DESC`
    );
    return rows;
}