import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const publicUrl = req.nextUrl.searchParams.get('url');
    if (!publicUrl) return new NextResponse(null, { status: 400 });

    const metaRes = await fetch(
        `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`
    );
    if (!metaRes.ok) return new NextResponse(null, { status: 502 });

    const metaData = await metaRes.json();
    if (!metaData.href) return new NextResponse(null, { status: 502 });

    const imageRes = await fetch(metaData.href);
    if (!imageRes.ok) return new NextResponse(null, { status: 502 });

    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await imageRes.arrayBuffer();

    return new NextResponse(buffer, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
    });
}