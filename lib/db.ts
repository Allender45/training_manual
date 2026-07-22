import { createRequire } from 'module';
import type { Pool } from 'pg';

const _require = createRequire(import.meta.url);

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL не задан: укажите строку подключения к БД в переменных окружения');
}

const pool: Pool = new (_require('pg').Pool)({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err: Error) => {
    console.error('[db] Ошибка idle-клиента пула:', err);
});

export default pool;