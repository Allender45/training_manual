import pool from '@/lib/db';

export type InternMetrics = {
    intern_id: number;
    metrics: Record<string, number>;
};

type SummaryResponse = {
    userId: number;
    hireDate?: string;
    salaryForecast?: { amount?: number };
    calls?: { inbound?: number; outbound?: number; total?: number };
    conversions?: {
        ordersCount?: number;
        completedOrdersCount?: number;
        newClientOrdersCount?: number;
        completedNewClientOrdersCount?: number;
        appealsCount?: number;
        newClientConversionPercent?: number;
        completedNewClientConversionPercent?: number;
        completedFromAppealsPercent?: number;
    };
    cash?: { newClients?: number; total?: number };
};

// Доступные ключи метрик (указываются в поле «Ключ метрики» триггера):
//   days_since_hire                            — дней с даты найма
//   salary_forecast_amount                     — прогноз ЗП
//   calls_inbound / calls_outbound / calls_total
//   conversions_orders_count
//   conversions_completed_orders_count
//   conversions_new_client_orders_count
//   conversions_completed_new_client_orders_count
//   conversions_appeals_count
//   conversions_new_client_conversion_percent
//   conversions_completed_new_client_conversion_percent
//   conversions_completed_from_appeals_percent
//   cash_new_clients / cash_total
function flattenSummary(summary: SummaryResponse): Record<string, number> {
    const metrics: Record<string, number> = {};

    if (summary.hireDate) {
        const days = (Date.now() - new Date(summary.hireDate).getTime()) / 86400000;
        metrics.days_since_hire = Math.max(0, Math.floor(days));
    }
    if (summary.salaryForecast?.amount != null)
        metrics.salary_forecast_amount = summary.salaryForecast.amount;

    for (const [key, value] of Object.entries(summary.calls ?? {})) {
        if (typeof value === 'number') metrics[`calls_${camelToSnake(key)}`] = value;
    }
    for (const [key, value] of Object.entries(summary.conversions ?? {})) {
        if (typeof value === 'number') metrics[`conversions_${camelToSnake(key)}`] = value;
    }
    for (const [key, value] of Object.entries(summary.cash ?? {})) {
        if (typeof value === 'number') metrics[`cash_${camelToSnake(key)}`] = value;
    }
    return metrics;
}

function camelToSnake(key: string): string {
    return key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

async function fetchSummary(crmId: number): Promise<SummaryResponse | null> {
    const baseUrl = process.env.ADAPTATION_API_URL;
    const token = process.env.ADAPTATION_API_TOKEN;
    if (!baseUrl || !token) {
        console.warn('[metrics] ADAPTATION_API_URL / ADAPTATION_API_TOKEN не заданы');
        return null;
    }
    try {
        const response = await fetch(`${baseUrl}users/${crmId}/statistics/summary`, {
            headers: { 'X-Service-Token': token },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.warn(`[metrics] crm_id=${crmId}: API ответил ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.warn(`[metrics] crm_id=${crmId}: ошибка запроса`, error);
        return null;
    }
}

async function fetchFromExternalApi(): Promise<InternMetrics[]> {
    const interns = await pool.query(
        `SELECT id, crm_id FROM users
         WHERE role_id = 6 AND is_active = true AND crm_id IS NOT NULL`
    );

    const result: InternMetrics[] = [];
    const BATCH = 5; // ограничиваем параллелизм, чтобы не уронить внешний API
    for (let i = 0; i < interns.rows.length; i += BATCH) {
        const batch = await Promise.all(
            interns.rows.slice(i, i + BATCH).map(async intern => {
                const summary = await fetchSummary(intern.crm_id);
                return summary
                    ? { intern_id: intern.id, metrics: flattenSummary(summary) }
                    : null;
            })
        );
        for (const item of batch) if (item) result.push(item);
    }
    return result;
}

// Заглушка для разработки (METRICS_API_STUB=true): всем активным стажёрам
// с crm_id выдаёт значения чуть выше порогов существующих триггеров.
async function fetchStub(): Promise<InternMetrics[]> {
    const triggers = await pool.query(
        `SELECT DISTINCT metric_key, threshold::float AS threshold
         FROM checklist_triggers WHERE is_active = true`
    );
    if (triggers.rows.length === 0) return [];

    const interns = await pool.query(
        `SELECT id FROM users WHERE role_id = 6 AND is_active = true AND crm_id IS NOT NULL`
    );

    return interns.rows.map(intern => ({
        intern_id: intern.id,
        metrics: Object.fromEntries(
            triggers.rows.map(t => [t.metric_key, t.threshold + (intern.id % 10)])
        ),
    }));
}

export async function fetchMetrics(): Promise<InternMetrics[]> {
    if (process.env.METRICS_API_STUB === 'true') {
        console.warn('[metrics] METRICS_API_STUB=true — используются тестовые данные');
        return fetchStub();
    }
    return fetchFromExternalApi();
}