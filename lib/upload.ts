// Валидация загружаемых файлов: расширение по whitelist (lowercase),
// MIME-тип по whitelist-префиксу и размер. Расширение для сохранения
// берём из MIME-маппинга (extFromMime), а не из имени файла.

export const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
export const VIDEO_EXT = ['mp4', 'webm', 'mov'];
export const AUDIO_EXT = ['mp3', 'wav', 'ogg'];

type UploadOptions = {
    allowedExt: string[];
    maxSizeMb: number;
};

// Допустимый префикс MIME-типа для каждого расширения из whitelist.
const EXT_MIME_PREFIX: Record<string, string> = {
    jpg: 'image/',
    jpeg: 'image/',
    png: 'image/',
    webp: 'image/',
    gif: 'image/',
    mp4: 'video/',
    webm: 'video/',
    mov: 'video/',
    mp3: 'audio/',
    wav: 'audio/',
    ogg: 'audio/',
    pdf: 'application/pdf',
};

// Каноническое расширение по MIME-типу (только whitelist).
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
};

export function extFromMime(mime: string): string | null {
    return MIME_TO_EXT[mime.toLowerCase()] ?? null;
}

// Возвращает null при успехе или текст ошибки (для ответа 400).
export function validateUpload(file: File, opts: UploadOptions): string | null {
    if (file.size === 0) return 'Файл пустой';

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!opts.allowedExt.includes(ext)) {
        return `Допустимые форматы файла: ${opts.allowedExt.join(', ')}`;
    }

    const mime = (file.type || '').toLowerCase();
    const prefixes = opts.allowedExt.map((e) => EXT_MIME_PREFIX[e] ?? '');
    if (!mime || !prefixes.some((p) => p && mime.startsWith(p))) {
        return 'Тип файла не соответствует допустимому формату';
    }

    if (file.size > opts.maxSizeMb * 1024 * 1024) {
        return `Размер файла не должен превышать ${opts.maxSizeMb} МБ`;
    }

    return null;
}
