import { config } from 'dotenv';

config({ path: '.env.local' });

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
export const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME  ?? '';
export const SUPPORT_API_URL = process.env.SUPPORT_API_URL ?? '';
export const SUPPORT_BOT_API_KEY = process.env.SUPPORT_BOT_API_KEY ?? '';

if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в переменных окружения');
}