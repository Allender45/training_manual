import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/apiAuth';
import { AUDIO_EXT, extFromMime, validateUpload } from '@/lib/upload';

export async function POST(req: NextRequest) {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
        }

        const error = validateUpload(file, { allowedExt: AUDIO_EXT, maxSizeMb: 10 });
        if (error) return NextResponse.json({ error }, { status: 400 });

        const path = await import('path');
        const fs = await import('fs/promises');

        const ext = extFromMime(file.type) ?? 'webm';
        const dir = path.default.join(process.cwd(), 'public', 'uploads', 'surveys', 'audio');
        await fs.default.mkdir(dir, { recursive: true });
        const filename = `${Date.now()}_${auth.userId}.${ext}`;
        await fs.default.writeFile(path.default.join(dir, filename), Buffer.from(await file.arrayBuffer()));

        return NextResponse.json({ url: `/uploads/surveys/audio/${filename}` }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/surveys/audio]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}