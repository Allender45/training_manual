import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';
import { getUploadUrl, uploadFile, publishFile } from '@/lib/yandex-disk';

export async function GET(req: NextRequest) {
    const albumId = req.nextUrl.searchParams.get('albumId');
    const { rows } = await pool.query(
        `SELECT g.id, g.title, g.public_url, g.created_at, g.album_id,
                TRIM(u.last_name || ' ' || u.first_name) AS author
         FROM gallery g
                  LEFT JOIN users u ON u.id = g.uploaded_by
         WHERE ($1::int IS NULL OR g.album_id = $1::int)
         ORDER BY g.created_at DESC`,
        [albumId ?? null]
    );
    return NextResponse.json({ photos: rows });
}

export async function POST(req: NextRequest) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string)?.trim() || null;
    const albumId = formData.get('albumId') ? Number(formData.get('albumId')) : null;

    if (!file || file.size === 0) {
        return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    const folder = process.env.YANDEX_DISK_FOLDER ?? '/gallery';
    const ext = file.name.split('.').pop() ?? 'jpg';
    const subFolder = albumId
        ? await pool.query('SELECT name FROM gallery_albums WHERE id=$1', [albumId]).then(r => r.rows[0]?.name)
        : null;
    const diskPath = `disk:${folder}${subFolder ? '/' + subFolder : ''}/${Date.now()}_${auth.userId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadUrl = await getUploadUrl(diskPath);
    await uploadFile(uploadUrl, buffer, file.type);
    const publicUrl = await publishFile(diskPath);

    const { rows } = await pool.query(
        `INSERT INTO gallery (title, disk_path, public_url, uploaded_by, album_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [title, diskPath, publicUrl, auth.userId, albumId]
    );

    return NextResponse.json({ ok: true, id: rows[0].id, publicUrl });
}