require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let offset = 0;

async function poll() {
    try {
        const res = await fetch(
            `https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=30&offset=${offset}`
        );
        const data = await res.json();

        for (const update of data.result ?? []) {
            offset = update.update_id + 1;
            const message = update.message;
            console.log('📨 update:', JSON.stringify(update)); // <-- добавь эту строку
            if (!message) continue;

            const text = message.text ?? '';
            const chatId = message.chat.id;

            if (text.startsWith('/start ')) {
                const userId = parseInt(text.slice(7).trim(), 10);
                if (!isNaN(userId)) {
                    await pool.query(
                        'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
                        [chatId, userId]
                    );
                    console.log(`✅ Linked user ${userId} → chat_id ${chatId}`);
                }
            }
        }
    } catch (err) {
        console.error('Poll error:', err.message);
    }

    poll(); // рекурсивно, без задержки (Telegram сам держит соединение 30с)
}

console.log('🤖 Bot polling started...');
poll();