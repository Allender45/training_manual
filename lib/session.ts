import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.SESSION_SECRET!;

export function signSession(value: string): string {
    const sig = createHmac('sha256', SECRET).update(value).digest('base64url');
    return `${value}.${sig}`;
}

export function unsignSession(signed: string): string | null {
    const dot = signed.lastIndexOf('.');
    if (dot === -1) return null;
    const value = signed.slice(0, dot);
    const expected = Buffer.from(createHmac('sha256', SECRET).update(value).digest('base64url'));
    const actual   = Buffer.from(signed.slice(dot + 1));
    if (expected.length !== actual.length) return null;
    return timingSafeEqual(expected, actual) ? value : null;
}