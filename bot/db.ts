import { Pool } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL не задан: укажите строку подключения к БД в переменных окружения');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err: Error) => {
    console.error('[bot/db] Ошибка idle-клиента пула:', err);
});

export default pool;