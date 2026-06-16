import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const period  = searchParams.get('period');

    if (!userId || !period) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const token = process.env.ADAPTATION_API_TOKEN;
    if (!token) {
        return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const res = await fetch(
        `https://dev7.sfcrm.ru/adaptation-api/v1/users/${userId}/statistics/by-day?period=${period}`,
        { headers: { 'X-Service-Token': token } }
    );

    if (!res.ok) {
        return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }

    return NextResponse.json(await res.json());
}