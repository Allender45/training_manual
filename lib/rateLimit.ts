// Простой in-memory rate limiter: окно 5 минут, максимум 10 попыток на ключ.
// Ограничения: состояние сбрасывается при рестарте процесса и не является
// общим для нескольких инстансов — для прода за балансировщиком нужен redis.

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type RateEntry = {
    count: number;
    resetAt: number;
};

const store = new Map<string, RateEntry>();
let lastCleanup = Date.now();

function cleanup(now: number) {
    if (now - lastCleanup < WINDOW_MS) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
    }
}

// true — попытка разрешена, false — лимит превышен.
export function checkRateLimit(key: string): boolean {
    const now = Date.now();
    cleanup(now);
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }
    entry.count += 1;
    return entry.count <= MAX_ATTEMPTS;
}
