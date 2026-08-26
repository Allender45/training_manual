import { NextRequest, NextResponse } from 'next/server';
import { requireFeature } from '@/lib/apiAuth';
import { getUploadUrl, uploadFile, publishFile, createFolder } from '@/lib/yandex-disk';

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'vacanciesTableAddButtons');
    if (auth instanceof NextResponse) return auth;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
        }

        const folder = process.env.YANDEX_DISK_FOLDER ?? '/gallery';
        await createFolder(`disk:${folder}/vacancies`);

        const ext = file.name.split('.').pop() ?? 'jpg';
        const diskPath = `disk:${folder}/vacancies/${Date.now()}_${auth.userId}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadUrl = await getUploadUrl(diskPath);
        await uploadFile(uploadUrl, buffer, file.type);
        const publicUrl = await publishFile(diskPath);

        return NextResponse.json({ imageUrl: publicUrl });
    } catch (error: any) {
        console.error('[vacancies/upload POST]', error);
        return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 500 });
    }
}