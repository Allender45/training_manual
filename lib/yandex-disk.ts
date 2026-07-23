const BASE = 'https://cloud-api.yandex.net/v1/disk';

async function getToken(): Promise<string> {
    return process.env.YANDEX_ACCESS_TOKEN!;
}

export async function getUploadUrl(diskPath: string): Promise<string> {
    const token = await getToken();
    const res = await fetch(
        `${BASE}/resources/upload?path=${encodeURIComponent(diskPath)}&overwrite=true`,
        { headers: { Authorization: `OAuth ${token}` } }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Ошибка получения URL загрузки');
    return data.href;
}

export async function uploadFile(uploadUrl: string, buffer: Buffer, mimeType: string) {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: new Blob([new Uint8Array(buffer)], { type: mimeType }),
    });
    if (!res.ok) throw new Error('Ошибка загрузки файла на Диск');
}

export async function publishFile(diskPath: string): Promise<string> {
    const token = await getToken();

    const publishRes = await fetch(`${BASE}/resources/publish?path=${encodeURIComponent(diskPath)}`, {
        method: 'PUT',
        headers: { Authorization: `OAuth ${token}` },
    });
    if (!publishRes.ok) throw new Error('Ошибка публикации файла');

    for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 600));

        const res = await fetch(
            `${BASE}/resources?path=${encodeURIComponent(diskPath)}&fields=public_url`,
            { headers: { Authorization: `OAuth ${token}` } }
        );
        const data = await res.json();
        if (data.public_url) return data.public_url;
    }

    throw new Error('public_url не получен после публикации');
}

export async function deleteFile(diskPath: string) {
    const token = await getToken();
    await fetch(
        `${BASE}/resources?path=${encodeURIComponent(diskPath)}&permanently=true`,
        { method: 'DELETE', headers: { Authorization: `OAuth ${token}` } }
    );
}

export async function createFolder(diskPath: string) {
    const token = await getToken();
    const res = await fetch(
        `${BASE}/resources?path=${encodeURIComponent(diskPath)}`,
        { method: 'PUT', headers: { Authorization: `OAuth ${token}` } }
    );
    // 409 = папка уже существует — не ошибка
    if (!res.ok && res.status !== 409) throw new Error('Ошибка создания папки');
}