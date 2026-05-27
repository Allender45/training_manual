import { NextRequest, NextResponse } from 'next/server';
import { unsignSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const dir = path.join(process.cwd(), 'public', 'records');

    if (!fs.existsSync(dir)) {
        return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(dir)
        .filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f))
        .map(f => ({
            id: f,
            name: f,
            url: `/records/${f}`,
        }));

    return NextResponse.json({ files });
}