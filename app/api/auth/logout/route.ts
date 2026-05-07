import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Выход выполнен' });
    response.cookies.set('session', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
    });
    return response;
}