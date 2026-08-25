import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import pool from '../bot/db';

async function run() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
        console.log(`Applying ${file}...`);
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        console.log(`Applied ${file}`);
    }

    console.log('Done.');
    await pool.end();
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});