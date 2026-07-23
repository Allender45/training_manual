import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/apiAuth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    // Фото в альбоме остаются, album_id → NULL
    await pool.query('UPDATE gallery SET album_id = NULL WHERE album_id = $1', [params.id]);
    await pool.query('DELETE FROM gallery_albums WHERE id = $1', [params.id]);

    return NextResponse.json({ ok: true });
}