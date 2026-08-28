import pool from '../../db';

export interface NewsRow {
    id: number;
    title: string;
    body: string;
    image_url: string | null;
    created_by: number;
    created_at: string;
    published: boolean;
}

export interface CreateNewsInput {
    title: string;
    body: string;
    imageUrl: string | null;
    createdBy: number;
}

export async function createNews(input: CreateNewsInput): Promise<number> {
    const { rows } = await pool.query(
        `INSERT INTO news (title, body, image_url, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
        [input.title, input.body, input.imageUrl, input.createdBy]
    );
    return rows[0].id;
}

export async function getLatestNews(limit = 5): Promise<NewsRow[]> {
    const { rows } = await pool.query(
        'SELECT * FROM news WHERE published = true ORDER BY created_at DESC LIMIT $1',
        [limit]
    );
    return rows;
}

export async function getNews(newsId: number): Promise<NewsRow | null> {
    const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [newsId]);
    return rows[0] ?? null;
}

export async function getActiveTelegramChatIds(): Promise<number[]> {
    const { rows } = await pool.query(
        'SELECT telegram_chat_id FROM users WHERE is_active = true AND telegram_chat_id IS NOT NULL'
    );
    return rows.map((r) => r.telegram_chat_id);
}