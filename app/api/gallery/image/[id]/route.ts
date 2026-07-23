import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const { rows } = await pool.query('SELECT public_url FROM gallery WHERE id = $1', [params.id]);
    if (!rows[0]) return new NextResponse(null, { status: 404 });

    const metaRes = await fetch(
        `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(rows[0].public_url)}`
    );
    if (!metaRes.ok) return new NextResponse(null, { status: 502 });

    const metaData = await metaRes.json();
    if (!metaData.href) return new NextResponse(null, { status: 502 });

    const imageRes = await fetch(metaData.href);
    if (!imageRes.ok) return new NextResponse(null, { status: 502 });

    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await imageRes.arrayBuffer();

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
        },
    });
}