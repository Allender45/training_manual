import { runTriggerEngine } from '@/lib/triggerEngine';

let lastRunDate = '';
let running = false;

// Вызывается из GET /api/notifications (опрашивается раз в минуту).
// Прогоняет движок один раз в сутки в заданный час, fire-and-forget.
export function maybeRunScheduledEngine(): void {
    if (process.env.TRIGGER_ENGINE_SCHEDULE !== 'true') return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const runHour = Number(process.env.TRIGGER_ENGINE_HOUR ?? '7');

    if (running || now.getHours() !== runHour || lastRunDate === today) return;

    running = true;
    lastRunDate = today;

    runTriggerEngine()
        .then(result => {
            console.log(`[triggerEngine] Плановый запуск: проверено=${result.checked}, назначено=${result.created}, ошибок=${result.errors.length}`);
            if (result.errors.length) console.error('[triggerEngine]', result.errors);
        })
        .catch(error => console.error('[triggerEngine] Ошибка планового запуска:', error))
        .finally(() => { running = false; });
}