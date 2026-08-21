import pool from '@/lib/db';
import { fetchMetrics, InternMetrics } from '@/lib/metrics';

type Trigger = {
    id: number;
    title: string;
    metric_key: string;
    operator: '>' | '>=' | '<' | '<=' | '=';
    threshold: number;
    checklist_id: number;
    checklist_title: string;
};

function compare(value: number, operator: Trigger['operator'], threshold: number): boolean {
    switch (operator) {
        case '>':  return value > threshold;
        case '>=': return value >= threshold;
        case '<':  return value < threshold;
        case '<=': return value <= threshold;
        case '=':  return value === threshold;
    }
}

export type EngineResult = {
    checked: number;
    created: number;
    errors: string[];
};

export async function runTriggerEngine(): Promise<EngineResult> {
    const result: EngineResult = { checked: 0, created: 0, errors: [] };

    const triggersRes = await pool.query(
        `SELECT t.id, t.title, t.metric_key, t.operator, t.threshold::float AS threshold,
                t.checklist_id, c.title AS checklist_title
         FROM checklist_triggers t
         JOIN checklists c ON c.id = t.checklist_id
         WHERE t.is_active = true AND t.checklist_id IS NOT NULL AND c.is_active = true`
    );
    const triggers: Trigger[] = triggersRes.rows;
    if (triggers.length === 0) return result;

    const allMetrics = await fetchMetrics();

    for (const trigger of triggers) {
        const matched: InternMetrics[] = allMetrics.filter(intern => {
            const value = intern.metrics[trigger.metric_key];
            return value !== undefined && compare(value, trigger.operator, trigger.threshold);
        });
        result.checked += matched.length;

        for (const intern of matched) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // ON CONFLICT по UNIQUE(trigger_id, intern_id) — повторных срабатываний не будет
                const survey = await client.query(
                    `INSERT INTO surveys (trigger_id, checklist_id, intern_id, mentor_id)
                     SELECT $1, $2, $3, m.mentor_id
                     FROM (SELECT 1) AS one
                     LEFT JOIN mentorships m
                       ON m.intern_id = $3 AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
                     ON CONFLICT (trigger_id, intern_id) WHERE trigger_id IS NOT NULL DO NOTHING
                     RETURNING id, mentor_id`,
                    [trigger.id, trigger.checklist_id, intern.intern_id]
                );
                if (survey.rows.length === 0) {
                    await client.query('ROLLBACK');
                    continue; // беседа уже назначалась
                }

                const internName = await client.query(
                    `SELECT last_name || ' ' || first_name AS name FROM users WHERE id = $1`,
                    [intern.intern_id]
                );
                const name = internName.rows[0]?.name ?? 'стажёр';

                await client.query(
                    `INSERT INTO notifications (user_id, text, icon) VALUES ($1, $2, 'bell')`,
                    [intern.intern_id,
                        `Назначена беседа «${trigger.checklist_title}». Дождитесь, когда с вами свяжется наставник.`]
                );

                const mentorId = survey.rows[0].mentor_id;
                if (mentorId) {
                    await client.query(
                        `INSERT INTO notifications (user_id, text, icon) VALUES ($1, $2, 'bell')`,
                        [mentorId,
                            `Проведите беседу «${trigger.checklist_title}» со стажёром ${name} (триггер «${trigger.title}»).`]
                    );
                }

                await client.query('COMMIT');
                result.created++;
            } catch (error: any) {
                await client.query('ROLLBACK');
                result.errors.push(`trigger=${trigger.id} intern=${intern.intern_id}: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }

    return result;
}