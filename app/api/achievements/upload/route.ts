import { NextRequest, NextResponse } from 'next/server';
import { unsignSession } from '@/lib/session';
import { IMAGE_EXT, extFromMime, validateUpload } from '@/lib/upload';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });

        const uploadDir = path.join(process.cwd(), 'public', 'achievements');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uploadError = validateUpload(file, { allowedExt: IMAGE_EXT, maxSizeMb: 5 });
        if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
        const ext = `.${extFromMime(file.type) ?? 'png'}`;
        const filename = `${Date.now()}${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/achievements/${filename}` });
    } catch (error: any) {
        console.error('[achievements upload]', error);
        return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
    }
}