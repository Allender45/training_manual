import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';
import { deleteFile } from '@/lib/yandex-disk';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { rows } = await pool.query('SELECT disk_path FROM gallery WHERE id = $1', [params.id]);
    if (!rows[0]) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

    await deleteFile(rows[0].disk_path);
    await pool.query('DELETE FROM gallery WHERE id = $1', [params.id]);

    return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { albumId } = await req.json();
    await pool.query('UPDATE gallery SET album_id = $1 WHERE id = $2', [albumId ?? null, params.id]);

    return NextResponse.json({ ok: true });
}