import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';
import { createFolder } from '@/lib/yandex-disk';

export async function GET() {
    const { rows } = await pool.query(
        `SELECT a.id, a.name, a.created_at,
                COUNT(g.id)::int AS photo_count
         FROM gallery_albums a
         LEFT JOIN gallery g ON g.album_id = a.id
         GROUP BY a.id ORDER BY a.name`
    );
    return NextResponse.json({ albums: rows });
}

export async function POST(req: NextRequest) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Укажите название' }, { status: 400 });

    const folder = process.env.YANDEX_DISK_FOLDER ?? '/gallery';
    await createFolder(`disk:${folder}/${name.trim()}`);

    const { rows } = await pool.query(
        `INSERT INTO gallery_albums (name, created_by) VALUES ($1, $2) RETURNING *`,
        [name.trim(), auth.userId]
    );
    return NextResponse.json({ album: rows[0] });
}