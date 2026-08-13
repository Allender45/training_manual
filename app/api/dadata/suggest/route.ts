import { NextRequest, NextResponse } from 'next/server';
import { unsignSession } from '@/lib/session';

const API_KEY = process.env.DADATA_API_KEY!;
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { query, mode, kladrId } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return NextResponse.json({ suggestions: [] });
    }

    const body: Record<string, unknown> = { query: query.trim(), count: 5 };
    if (mode === 'city') {
        body.from_bound = { value: 'city' };
        body.to_bound = { value: 'settlement' };
    } else {
        body.from_bound = { value: 'street' };
        body.to_bound = { value: 'house' };
        if (kladrId) body.locations = [{ kladr_id: kladrId }];
    }

    try {
        const res = await fetch(DADATA_URL, {
            method: 'POST',
            headers: {
                Authorization: `Token ${API_KEY}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        const suggestions = (data.suggestions ?? []).map((s: any) => ({
            value: s.value as string,
            kladrId: (s.data?.kladr_id ?? '') as string,
            city: (s.data?.city ?? s.data?.settlement ?? '') as string,
            street: (s.data?.street ?? '') as string,
            house: [s.data?.house, s.data?.block].filter(Boolean).join('/') as string,
        }));

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('[POST /api/dadata/suggest]', error);
        return NextResponse.json({ suggestions: [] });
    }
}