import { createRequire } from 'module';
import type { Pool } from 'pg';

const _require = createRequire(import.meta.url);

const pool: Pool = new (_require('pg').Pool)({
    connectionString: process.env.DATABASE_URL,
});

export default pool;