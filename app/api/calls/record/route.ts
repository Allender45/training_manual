import { NextRequest, NextResponse } from 'next/server';
import { getAuth, canAccessUserData } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const callId = searchParams.get('callId');

    if (!userId || !callId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const isSelf = auth.crmId != null && String(auth.crmId) === userId;
    if (!canAccessUserData(auth, isSelf)) {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const token = process.env.ADAPTATION_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'Service not configured' }, { status: 503 });

    const baseUrl = process.env.ADAPTATION_API_URL;
    if (!baseUrl) return NextResponse.json({ error: 'Service not configured' }, { status: 503 });

    const res = await fetch(
        `${baseUrl}users/${userId}/calls/${callId}`,
        { headers: { 'X-Service-Token': token } }
    );

    if (!res.ok) return NextResponse.json({ error: 'Upstream error' }, { status: res.status });

    return NextResponse.json(await res.json());
}
